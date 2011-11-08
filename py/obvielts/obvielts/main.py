import webob
import webob.dec
import fanstatic
from js.obviel import obviel

@webob.dec.wsgify
def main(request):
    obviel.need()
    return webob.Response('<html><head></head><body>Hello world</body></html>')

def main_factory(global_config, **local_conf):
    return main

