"""Obviel test server

The Obviel test server is a simple WSGI-based web server that makes use
of WebOb for interaction with the request and response, and of the traject
library for routing.

It expooses a RESTful web service based on JSON.

It also shows a user interface that demonstrates some Obviel components.
"""

import webob
import webob.dec
import fanstatic
from js.obviel import datatables
from js.jqueryui import smoothness
import traject
import json
import fanstatic

# we want to load our main.js javascript resource on the main page later
library = fanstatic.Library('obvielts', 'resources')
main_js = fanstatic.Resource(library, 'main.js', depends=[datatables,
                                                          smoothness])

HTTP_METHODS = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE']

@webob.dec.wsgify
def main(request):
    """The WSGI object.

    It publishes objects registered using the traject library.
    
    The main_factory integrates it with paster (see setup.py for how it
    it is hooked up).
    """    
    # we always start at the root object
    root = Root()

    # use traject to find the object we are routing to
    path_info = request.path_info
    if path_info.startswith('/'):
        path_info = path_info[1:]

    if path_info != '':
        try:
            found = traject.resolve(root, path_info, Default)
        except traject.ResolutionError:
            # we cannot resolve the path, so it's not found
            raise webob.exc.HTTPNotFound()
    else:
        # if we have no path info, we want the root object
        found = root

    # HEAD requests we want to handle by doing a GET and then removing
    # the body, unless a HEAD method can be found
    handle_head = request.method == 'HEAD'
    if not handle_head:
        method = request.method
    else:
        if not hasattr(found, 'HEAD'):
            method = 'GET'
        else:
            method = 'HEAD'
            # don't need special HEAD handling
            handle_head = False

    # now look for a method based on the HTTP method (GET, POST, etc)
    try:
        method = getattr(found, method)
    except AttributeError:
        # we can't find the method, so raise Method Not Allowed
        allowed_methods = found.allowed_methods()
        raise webob.exc.HTTPMethodNotAllowed(headers=[
                'Allow', ', '.join(found.allowed_headers())])

    # call the method on the object found
    result = method(request)
    # process the result into a Response object
    response = found.process_result(result)
    
    # we simulated a HEAD request with a GET request, so no body
    if handle_head:
        response.body = ''
        
    return response

def main_factory(global_config, **local_conf):
    return main

class REST(object):
    """A basic REST object.
    """
    def process_result(self, result):
        return result
    
    def allowed_methods(self):
        """Calculate allowd methods.
        """
        result = []
        for method in HTTP_METHODS:
            if hasattr(self, method):
                result.append(method)
        if 'GET' in result and 'HEAD' not in result:
            result.append('HEAD')
        result.sort()
        return result
    
class JSON(REST):
    """A JSON object. Result can be dict, list, int, str.
    """
    def process_result(self, result):
        # pass through any already made responses
        if isinstance(result, webob.Response):
            return result
        # use json library to serialize Python object we got
        s = json.dumps(result)
        return webob.Response(s, content_type='application/json')
    
class Default(REST):
    """A default object showing up for path segments not mapped by traject.
    It doesn't do anything, however.
    """
    def __init__(self, **kw):
        pass

root_html = '''\
<!DOCTYPE html>
<html>
<head>
</head>
<body id="main">
</body>
</html>'''

class Root(REST):
    def GET(self, request):
        # make a fake resource that gets loaded before the other ones
        # that sets up the app_info and the template_url
        def bootstrap_url(url_):
            return '<script type="text/javascript" src="%s"></script>' % (
                url(request, Bootstrap()))
        # a hack, as this is a fake resource we don't care whether it can
        # be found on the filesystem
        fanstatic.set_resource_file_existence_checking(False)
        bootstrap_js = fanstatic.Resource(library, 'bootstrap.js',
                                          renderer=bootstrap_url)
        fanstatic.set_resource_file_existence_checking(True)

        # we want our bootstrap js first
        bootstrap_js.need()
        # then we load the main obviel using js
        main_js.need()
        
        return webob.Response(root_html)
                      
class Bootstrap(REST):
    def GET(self, request):
        js = '''\
var app_info = "%s";
var template_url = "%s";
'''
        needed = fanstatic.get_needed()
        js = js % (
            url(request, AppInfo()),
            needed.library_url(library) + '/')
        
        return webob.Response(js, content_type='text/javascript');
    
class AppInfo(JSON):
    def GET(self, request):
        return {
            'iface': 'app_info',
            'table': url(request, Table())
            }
    
class Table(JSON):
    def GET(self, request):
        return {}

# register our objects using traject; an inverse is also needed to
# be able to reconstruct an instance's location, this is used by
# the path() function to locate the object
traject.register(Root, 'table', Table)
traject.register_inverse(Root, Table, 'table', lambda obj: {})
traject.register(Root, 'app_info', AppInfo)
traject.register_inverse(Root, AppInfo, 'app_info', lambda obj: {})
traject.register(Root, 'bootstrap.js', Bootstrap)
traject.register_inverse(Root, Bootstrap, 'bootstrap.js', lambda obj: {})

def url(request, obj):
    """Generate a URL for the object.
    """
    p = path(obj)
    return request.application_url + '/' + p

def path(obj):
    """Generate a path for the object.
    """
    # we handle the root object specially
    if isinstance(obj, Root):
        return ''
    # locate the object using traject. this will give it and its ancestors
    # __name__ and __parent__ attributes (
    traject.locate(Root(), obj, Default)
    # now go through ancestors to construct path steps
    steps = []
    while True:
        steps.append(obj.__name__)
        obj = obj.__parent__
        if isinstance(obj, Root):
            break
    # we need to reverse the steps
    steps.reverse()
    # and construct the URL path
    return '/'.join(steps)
