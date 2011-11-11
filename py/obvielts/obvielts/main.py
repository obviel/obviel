"""Obviel test server

The Obviel test server is a simple WSGI-based web server that makes use
of WebOb for interaction with the request and response, and of the traject
library for routing.

It expooses a RESTful web service based on JSON.

It also shows a user interface that demonstrates some Obviel components.
"""

import webob
import fanstatic
from js.obviel import datatables
from js.jqueryui import smoothness
import traject

from obvielts.framework import Publisher, url, JSON, REST, Default, RootBase

# we want to load our main.js javascript resource on the main page later
library = fanstatic.Library('obvielts', 'resources')
main_js = fanstatic.Resource(library, 'main.js', depends=[datatables,
                                                          smoothness])
def main_factory(global_config, **local_conf):
    return Publisher(Root()).publish

root_html = '''\
<!DOCTYPE html>
<html>
<head>
</head>
<body id="main">
</body>
</html>'''

class Root(REST, RootBase):
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
traject.register(RootBase, 'table', Table)
traject.register_inverse(RootBase, Table, 'table', lambda obj: {})
traject.register(RootBase, 'app_info', AppInfo)
traject.register_inverse(RootBase, AppInfo, 'app_info', lambda obj: {})
traject.register(RootBase, 'bootstrap.js', Bootstrap)
traject.register_inverse(RootBase, Bootstrap, 'bootstrap.js', lambda obj: {})
