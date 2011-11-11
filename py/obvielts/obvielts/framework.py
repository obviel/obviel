"""The little web framework used for the test server.
"""

import webob
import webob.dec

from js.obviel import datatables
from js.jqueryui import smoothness
import traject
import json

HTTP_METHODS = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE']

class Publisher(object):
    def __init__(self, root):
        self.root = root
    
    @webob.dec.wsgify
    def publish(self, request):
        """The WSGI object.

        It publishes objects registered using the traject library.
        """        
        # use traject to find the object we are routing to
        path_info = request.path_info
        if path_info.startswith('/'):
            path_info = path_info[1:]

        if path_info != '':
            try:
                found = traject.resolve(self.root, path_info, Default)
            except traject.ResolutionError:
                # we cannot resolve the path, so it's not found
                raise webob.exc.HTTPNotFound()
        else:
            # if we have no path info, we want the root object
            found = self.root

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

def url(request, obj):
    """Generate a URL for the object.
    """
    p = path(obj)
    return request.application_url + '/' + p

class RootBase(object):
    pass

class Default(object):
    """A default object showing up for path segments not mapped by traject.
    It doesn't do anything, however.
    """
    def __init__(self, **kw):
        pass
    
def path(obj):
    """Generate a path for the object.
    """
    # we handle the root object specially
    if isinstance(obj, RootBase):
        return ''
    # locate the object using traject. this will give it and its ancestors
    # __name__ and __parent__ attributes (
    traject.locate(RootBase(), obj, Default)
    # now go through ancestors to construct path steps
    steps = []
    while True:
        steps.append(obj.__name__)
        obj = obj.__parent__
        if isinstance(obj, RootBase):
            break
    # we need to reverse the steps
    steps.reverse()
    # and construct the URL path
    return '/'.join(steps)
