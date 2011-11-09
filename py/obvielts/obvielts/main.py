import webob
import webob.dec
import fanstatic
from js.obviel import datatables
from js.jqueryui import smoothness
import traject

library = fanstatic.Library('obvielts', 'resources')
main_js = fanstatic.Resource(library, 'main.js', depends=[datatables,
                                                          smoothness])

@webob.dec.wsgify
def main(request):
    root = Root()

    path_info = request.path_info
    if path_info.startswith('/'):
        path_info = path_info[1:]

    if path_info != '':
        try:
            found = traject.resolve(root, path_info, Default)
        except traject.ResolutionError:
            raise webob.exc.HTTPNotFound()
    else:
        found = root

    try:
        method = getattr(found, request.method)
    except AttributeError:
        raise webob.exc.HTTPNotFound()
    
    return method(request)

    # main_js.need()
    # return webob.Response(
    #     '<html><head></head><body><div id="table"></div></body></html>')

def main_factory(global_config, **local_conf):
    return main

class Root(object):
    def GET(self, request):
        return webob.Response(
            '<html><head></head><body>Hello world</body></html')

class Default(object):
    def __init__(self, **kw):
        pass
    
class Table(object):
    def GET(self, request):
        return webob.Response(
            '<html><head></head><body>This is a table</body></html>')

traject.register(Root, 'table', Table)

