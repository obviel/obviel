/* */
var assert = buster.assert;
var refuse = buster.refute;

var syncTestCase = buster.testCase("sync tests", {
    setUp: function() {
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
    },
    tearDown: function() {
        this.server.restore();
    },
    "update to object URL": function(done) {
        obviel.sync.mapping({
            iface: 'test',
            target: {
                update: obviel.sync.HttpRequest({
                    url: obviel.sync.modelProperty('updateUrl')
                })
            }
        });
        
        var updateData = null;
        
        this.server.respondWith('POST', 'blah', function(request) {
            updateData = request.requestBody;
            request.respond(200, {'Content-Type': 'application/json'},
                            JSON.stringify({}));
        });

        var conn = new obviel.sync.Connection();
        var session = conn.session();

        var obj = {
            iface: 'test',
            id: 'testid',
            value: 1.0,
            updateUrl: 'blah'
        };
        session.update(obj);
        session.commit().done(function() {
            assert.equals(updateData.value, 1.0);
            done();
        });
    }
    
});
