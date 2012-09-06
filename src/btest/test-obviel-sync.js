/* */
var assert = buster.assert;
var refuse = buster.refute;

// TODO

// * implement defaults and test
// * localstorage implementation
// * configure updater to remove properties or leave them be
// * configure to interpret messages back as add, update, delete (I guess
// the type of updater could also do this). how to determine where we
// want to do the add?
// * refresh httpproperties default are different than for, say, update
// * properties alternative would be not to have a function that returns
//   an object, but an object that may have function members
// * if we can't find a property on m.obj we want to give a nice error?

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
                    http: function(m) {
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
            updateData = $.parseJSON(request.requestBody);
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
            iface: 'container',
            target: {
                add: {
                    http: function(m) {
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
            addData = $.parseJSON(request.requestBody);
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
                    socket: function(m) {
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
    "source refresh from HTTP response, client-initiated": function(done) {
        var obj = {
            iface: 'test',
            id: 'testid',
            value: 1.0,
            refreshUrl: 'refreshObj'
        };

        obviel.sync.mapping({
            iface: 'test',
            source: {
                update: {
                    finder: function(serverObj) {
                        return obj;
                    }
                }
            },
            target: {
                refresh: {
                    http: function(m) {
                        return {
                            method: 'GET',
                            url: m.obj['refreshUrl'],
                            response: obviel.sync.multiUpdater 
                        };
                    }
                }

            }
        });
        
        this.server.respondWith('GET', 'refreshObj', function(request) {
            request.respond(
                200, {'Content-Type': 'application/json'},
                JSON.stringify({
                    iface: 'test',
                    id: 'testid',
                    value: 2.0,
                    refreshUrl: 'refreshObj'
                }));
        });

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();
        session.refresh(obj);
        session.commit().done(function() {
            assert.equals(obj.value, 2.0);
            done();
        });
    },
    "source update from HTTP response, after POST": function(done) {
        var testUrl = 'blah';

        // client-side data
        
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

        // mapping
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

        obviel.sync.mapping({
            iface: 'container',
            source: {
                update: {
                    finder: function(serverObj) {
                        return container;
                    }
                }
            },
            target: {
                add: {
                    http: function(m) {
                        return {
                            method: 'POST',
                            url: m.container['addUrl'],
                            response: obviel.sync.multiUpdater
                        };
                    }
                }
            }
        });

        // server-side data; a simple list
        var serverData = [];
        
        // when we get a new entry, add it to the list, touch value to
        // see we had it, and respond with an array of things to update
        this.server.respondWith('POST', testUrl, function(request) {
            var addData = $.parseJSON(request.requestBody);
            serverData.push(addData);

            addData.value += 1;
            
            request.respond(200, {'Content-Type': 'application/json'},
                            JSON.stringify([
                                addData,
                                {
                                    iface: 'container',
                                    count: serverData.length
                                }
                            ]));
        });

        var conn = new obviel.sync.HttpConnection();
        var session = conn.session();

        container.entries.push(obj);
        session.add(container, 'entries', obj);
        session.commit().done(function() {
            assert.equals(serverData,
                          [{iface: 'test', id: 'testid', value: 2.0}]);
            assert.equals(container.count, 1);
            assert.equals(container.entries[0].value, 2.0);
            done();
        });
        
    }

    
    // "source add from HTTP response": function(done) {
    //     var container = {
    //         iface: 'container',
    //         entries: []
    //     };
        
    //     obviel.sync.mapping({
    //         iface: 'test',
    //         source: {
    //             add: {
    //                 finder: function(serverObj) {
    //                     return {
    //                         container: container,
    //                         propertyName: 'entries'
    //                     };
    //                 }
    //             }
    //         }
    //     });
        
    //     this.server.respondWith('POST', 'getUpdates', function(request) {
    //         request.respond(
    //             200, {'Content-Type': 'application/json'},
    //             JSON.stringify({
    //                 obvielsync: [
    //                     {
    //                         'action': 'add',
    //                         'obj': {
    //                             iface: 'test',
    //                             id: 'testid',
    //                             value: 2.0
    //                         }
    //                     }
    //                 ]
    //             }));
    //     });
        
        
    //     var conn = new obviel.sync.HttpConnection();
    //     var session = conn.session();
        
    //     $.ajax({
    //         type: 'POST',
    //         url: 'getUpdates',
    //         processData: false,
    //         contentType: 'application/json',
    //         dataType: 'json',
    //         data: {}
    //     }).done(function(entries) {
    //         session.processSource(entries);
    //         assert.equals(container.entries.length, 1);
    //         assert.equals(container.entries[0], {
    //             iface: 'test',
    //             id: 'testid',
    //             value: 2.0
    //         });
    //         done();
    //     });
    // }


    
});
