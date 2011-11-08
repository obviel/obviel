import webob

def dont_cache_json_factory(global_config, **local_conf):
    return DontCacheJson

class DontCacheJson(object):
    def __init__(self, application):
        self.application = application

    def __call__(self, environ, start_response):
        req = webob.Request(environ)
        res = req.get_response(self.application)
        if (res.content_type is None or
            res.content_type.lower() not in ['application/json']):
            return res(environ, start_response)
        res.cache_expires(seconds=0)
        return res(environ, start_response)
