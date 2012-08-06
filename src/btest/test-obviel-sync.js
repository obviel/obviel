/* */
var assert = buster.assert;
var refuse = buster.refute;

var syncTestCase = buster.testCase("sync tests:", {
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
    },
    "update to socket io": function(done) {
        obviel.sync.mapping({
            iface: 'test',
            target: {
                update: {
                    socketIoProperties: function(m) {
                        return {
                            type: 'updateTest'
                        };
                    }
                }
            }
        });
        // mock a socket io
        var io = {
            emit: sinon.spy()
        };
        
        var conn = new obviel.sync.SocketIoConnection(io);
        var session = conn.session();

        var obj = {
            iface: 'test',
            id: 'testid',
            value: 1.0
        };
        session.update(obj);
        session.commit().done(function() {
            assert(io.emit.calledWith('updateTest', obj));
            done();
        });
    },
    "source update from HTTP response": function(done) {
        var obj = {
            iface: 'test',
            id: 'testid',
            value: 1.0
        };

        obviel.sync.mapping({
            iface: 'test',
            source: {
                update: {
                    finder: function(serverObj) {
                        return obj;
                    }
                }
            }
        });
        
        this.server.respondWith('POST', 'getUpdates', function(request) {
            request.respond(
                200, {'Content-Type': 'application/json'},
                JSON.stringify({
                    obvielsync: [
                        {
                            'action': 'update',
                            'obj': {
                                iface: 'test',
                                id: 'testid',
                                value: 2.0
                            }
                        }
                    ]
                }));
        });
        
        
        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();
        
        $.ajax({
            type: 'POST',
            url: 'getUpdates',
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: {}
        }).done(function(entries) {
            session.processSource(entries);
            assert.equals(obj.value, 2.0);
            done();
        });
    },
    "source add from HTTP response": function(done) {
        var container = {
            iface: 'container',
            entries: []
        };
        
        obviel.sync.mapping({
            iface: 'test',
            source: {
                add: {
                    finder: function(serverObj) {
                        return {
                            container: container,
                            propertyName: 'entries'
                        };
                    }
                }
            }
        });
        
        this.server.respondWith('POST', 'getUpdates', function(request) {
            request.respond(
                200, {'Content-Type': 'application/json'},
                JSON.stringify({
                    obvielsync: [
                        {
                            'action': 'add',
                            'obj': {
                                iface: 'test',
                                id: 'testid',
                                value: 2.0
                            }
                        }
                    ]
                }));
        });
        
        
        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();
        
        $.ajax({
            type: 'POST',
            url: 'getUpdates',
            processData: false,
            contentType: 'application/json',
            dataType: 'json',
            data: {}
        }).done(function(entries) {
            session.processSource(entries);
            assert.equals(container.entries.length, 1);
            assert.equals(container.entries[0], {
                iface: 'test',
                id: 'testid',
                value: 2.0
            });
            done();
        });
    }


    
});
