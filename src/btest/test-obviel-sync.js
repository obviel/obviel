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
                update: {
                    httpProperties: function(m) {
                        return {
                            method: 'POST',
                            url: m.obj['updateUrl']
                        };
                    }
                }
            }
        });
        var updateData = null;

        var testUrl = 'blah';
        
        this.server.respondWith('POST', testUrl, function(request) {
            updateData = request.requestBody;
            request.respond(200, {'Content-Type': 'application/json'},
                            JSON.stringify({}));
        });

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {
            iface: 'test',
            id: 'testid',
            value: 1.0,
            updateUrl: testUrl
        };
        session.update(obj);
        session.commit().done(function() {
            assert.equals(updateData.value, 1.0);
            done();
        });
    },
    "add to container URL": function(done) {
        obviel.sync.mapping({
            iface: 'test',
            target: {
                add: {
                    httpProperties: function(m) {
                        return {
                            method: 'POST',
                            url: m.container['addUrl']
                        };
                    }
                }
            }
        });

        var testUrl = 'blah';
        
        var addData = null;
        
        this.server.respondWith('POST', testUrl, function(request) {
            addData = request.requestBody;
            request.respond(200, {'Content-Type': 'application/json'},
                            JSON.stringify({}));
        });

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        var obj = {
            iface: 'test',
            id: 'testid',
            value: 1.0
        };
        var container = {
            iface: 'container',
            entries: [],
            addUrl: testUrl
        };
        container.entries.push(obj);
        session.add(container, 'entries', obj);
        session.commit().done(function() {
            assert.equals(addData, {iface: 'test', id: 'testid',
                                    value: 1.0});
            done();
        });
    }// ,
    // "update to websocket": function(done) {
    //     obviel.sync.mapping({
    //         iface: 'test',
    //         target: {
    //             update: {
    //                 connection: obviel.sync.webSocketConnection,
    //                 properties: function(obj) { 
    //                     return { type: 'updateTest'};
    //                 }
    //             }
    //         }
    //     });
    //     var updateData = null;

    //     var fakeWebSocket = function() {
            
    //     };
    //     var conn = new obviel.sync.Connection();
    //     var session = conn.session();

    //     var obj = {
    //         iface: 'test',
    //         id: 'testid',
    //         value: 1.0,
    //         updateUrl: testUrl
    //     };
    //     session.update(obj);
    //     session.commit().done(function() {
    //         assert.equals(updateData.value, 1.0);
    //         done();
    //     });
    // },

    
});
