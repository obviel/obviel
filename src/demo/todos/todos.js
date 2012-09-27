(function($, obviel) {
    // enter key
    var KEYCODE = 13;

    var conn = new obviel.sync.LocalStorageConnection('todos');
    
    var _ = obviel.i18n.translate('todos');

    // transform to use obviel-sync
    // *set up connection globally, or at least in a globally gettable way
    // * mutator on connection to create session implicitly? and then
    // a commit on mutator as well
    // * all cases of an update trigger should now be a commit
    // * the backend should also send update events and such so that
    //   the UI can respond. in case of localstorage, these should be
    //   sent immediately, in case of a remote storage they could also
    //   be sent immediately, or be sent as soon as we get message from
    //   the source. event configuration could be done in config
    // * investigate ways to get the code more compact    
    // auto-commit on event handling? how to get the active session?
    
    // the application model
    var todos = {
        iface: 'todos',
        items: []
    };
    
    // XXX these are pretty empty; can we get rid of them entirely?
    // maybe not anymore once we have JS events configured
    obviel.sync.mapping({
        iface: 'todos',
        source: {
            'update': {
                finder: function() {
                    return todos;
                }
            }
        },
        target: {
            update: {
                event: 'update'
            },
            add: {
                event: 'update'
            },
            remove: {
                event: 'update'
            },
            refresh: {
            }
        }
    });
    
    obviel.sync.mapping({
        iface: 'todo',
        source: {
        },
        target: {
            update: {
                event: 'update'
            }
        }
    });

    
    // create a special stats model from the todos
    var getStats = function(todos) {
        var remaining = 0;
        var done = 0;
        var amount = 0;
        $.each(todos.items, function(index, todo) {
            if (todo.done) {
                done += 1;
            } else {
                remaining += 1;
            }
            amount += 1;
        });
        return {iface: 'stats', remaining: remaining, done: done,
                amount: amount};
    };
    
    // a view for the whole todos application
    obviel.view({
        iface: 'todos',
        obvtScript: 'obvt-todos',
        objectEvents: {
            update: 'rerender',
            updateStats: 'updateStats'
        },
        render: function() {
            $('#new-todo').focus();
            this.updateStats();
        },
        updateStats: function() {
            var stats = getStats(this.obj);
            if (stats.amount) {
                $('#toggle-all').get(0).checked = !stats.remaining;
                $('footer', this.el).render(stats);
                $('footer', this.el).show();
            } else {
                $('footer', this.el).hide();
            }
        },
        createOnEnter: function(ev) {
            if (ev.keyCode !== KEYCODE) {
                return;
            }
            var value = $('#new-todo').val();
            if (value === '') {
                return;
            }
            var m = this.mutator();
            var newObj = {iface: 'todo', done: false, title: value};
            m.get('items').push(newObj);
        },
        toggleAll: function() {
            var done = $('#toggle-all').get(0).checked;
            var m = this.mutator().get('items');
            var i;
            for (i = 0; i < this.obj.items.length; i++) {
                m.get(i).set('done', done);
            }
        }
    });

    // a view for the stats
    obviel.view({
        iface: 'stats',
        obvtScript: 'obvt-todo-stats',
        clearCompleted: function() {
            var newItems = [];
            $.each(todos.items, function(index, item) {
                if (!item.done) {
                    newItems.push(item);
                }
            });
            var m = conn.mutator(todos);
            m.set('items', newItems);
        }
    });

    // a view for an individual todo item, not editable
    obviel.view({
        iface: 'todo',
        obvtScript: 'obvt-todo',
        objectEvents: {
            update: 'rerender'
        },
        checked: function(el, variable) {
            if (variable('done')) {
                el.get(0).checked = true;
            }
        },
        render: function() {
            if (this.obj.done) {
                this.el.addClass('done');
            } else {
                this.el.removeClass('done');
            }
        },
        edit: function() {
            var m = this.mutator();
            m.set('iface', 'todo-editing');
        },
        toggle: function() {
            var m = this.mutator();
            m.set('done', !this.obj.done);
            // XXX how do we handle updateStats case?
            $(todos).trigger('updateStats');
        },
        clear: function() {
            conn.mutator(todos).get('items').remove(this.obj);
        }
    });

    // a view for an editable todo item
    obviel.view({
        iface: 'todo-editing',
        obvtScript: 'obvt-todo-editing',
        objectEvents: {
            update: 'rerender'
        },
        render: function() {
            $('input.edit', this.el).focus();
        },
        updateOnEnter: function(ev) {
            if (ev.keyCode === KEYCODE) {
                this.close();
            }
        },
        close: function() {
            var value = $('input.edit', this.el).val();
            if (!value) {
                conn.mutator(todos).get('items').remove(this.obj);
                return;
            }
            var m = this.mutator();
            m.set('title', value);
            m.set('iface', 'todo');
        } 
    });
    

    // XXX initialization can be summarized in one call like this
    // obviel.init(todos, '#app', connection, 'nl_NL');
    // or
    // $('#app').initrender(todos, connection, 'nl_NL');
    
    // when the document is ready, load up languages & sync the todos
    // model, and render it when it's done
    $(document).ready(function() {
        obviel.i18n.load().done(function() {
            obviel.i18n.setLocale('nl_NL').done(function() {
                conn.init(todos).done(function() {
                    $('#app').render(todos);
                });
            });
        });
    });
}(jQuery, obviel));