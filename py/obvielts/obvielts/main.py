import webob
import webob.dec
import fanstatic
from js.obviel import forms

library = fanstatic.Library('obvielts', 'resources')
main_js = fanstatic.Resource(library, 'main.js', depends=[forms])

@webob.dec.wsgify
def main(request):
    main_js.need()
    return webob.Response(
        '<html><head></head><body><div id="theform"></div></body></html>')

def main_factory(global_config, **local_conf):
    return main

