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
from js.jquery_datatables import jquery_datatables_css

from obvielts.framework import Publisher, url, JSON, REST, Default, RootBase

# we want to load our main.js javascript resource on the main page later
library = fanstatic.Library('obvielts', 'resources')

def bootstrap_url(url_):
    return '<script type="text/javascript" src="/bootstrap.js"></script>'

bootstrap_js = fanstatic.Resource(library, 'bootstrap.js',
                                  renderer=bootstrap_url)

main_css = fanstatic.Resource(library, 'main.css', depends=[
        smoothness, jquery_datatables_css])

main_js = fanstatic.Resource(library, 'main.js', depends=[bootstrap_js,
                                                          main_css,
                                                          datatables])
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
        # then we load the main obviel using js
        #smoothness.need()
        #jquery_datatables_css.need()
       # main_css.need()
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
        return {
            'iface': 'datatable',
            'sAjaxSource': url(request, TableBrowser()),
            'aoColumns': [{
                    'sName': 'number',
                    'sTitle': 'Number',
                    }, {
                    'sName': 'text',
                    'sTitle': 'Text',
                    }
                ]
            }

class TableBrowser(JSON):
    def GET(self, request):
        args = request.GET
        limit = int(args.get('iDisplayLength', 10))
        offset = int(args.get('iDisplayStart', 0))

        echo = int(args.get('sEcho', 0))
        #search = request.get('sSearch', None)

        count = 4000
        data = generate_data(limit, offset, count)
        display_count = count
        
        return {
            'sEcho': echo,
            'aaData': data,
            'iTotalRecords': count,
            'iTotalDisplayRecords': display_count,
            }

def generate_data(limit, offset, count):
    """Generate fake table data.
    """
    result = []
    start = offset
    end = offset + limit
    if start >= count:
        return []
    if end > count:
        end = count
    for i in range(start, end):
        result.append([i, '#' + str(i)])
    return result

# register our objects using traject; an inverse is also needed to
# be able to reconstruct an instance's location, this is used by
# the path() function to locate the object
traject.register(RootBase, 'table', Table)
traject.register_inverse(RootBase, Table, 'table', lambda obj: {})
traject.register(RootBase, 'app_info', AppInfo)
traject.register_inverse(RootBase, AppInfo, 'app_info', lambda obj: {})
traject.register(RootBase, 'bootstrap.js', Bootstrap)
traject.register_inverse(RootBase, Bootstrap, 'bootstrap.js', lambda obj: {})
traject.register(RootBase, 'table_browser', TableBrowser)
traject.register_inverse(RootBase, TableBrowser, 'table_browser', lambda obj: {})
