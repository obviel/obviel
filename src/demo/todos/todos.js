(function($, obviel) {
    // enter key
    var KEYCODE = 13;
    
    var _ = obviel.i18n.translate();
    
    // the application model
    var todos = {
        iface: 'todos',
        items: []
    };
    // a clear function removing a todo from the application
    var clear = function(todo) {
        for (var i = 0; i < todos.items.length; i++) {
            if (todos.items[i] === todo) {
                todos.items.splice(i, 1);
                break;
            }
        }
    };
    
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
            this.obj.items.push({iface: 'todo', done: false, title: value});
            $(this.obj).trigger('update');
        },
        toggleAll: function() {
            var done = $('#toggle-all').get(0).checked;
            $.each(this.obj.items, function(index, item) {
                item.done = done;
            });
            $(this.obj).trigger('update');
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
            todos.items = newItems;
            $(todos).trigger('update');
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
            this.obj.iface = 'todo-editing';
            $(this.obj).trigger('update');
        },
        toggle: function() {
            this.obj.done = !this.obj.done;
            $(this.obj).trigger('update');
            $(todos).trigger('updateStats');
        },
        clear: function() {
            clear(this.obj);
            $(todos).trigger('update');
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
                clear(this.obj);
                $(todos).trigger('update');
                return;
            }
            this.obj.title = value;  
            this.obj.iface = 'todo';
            $(this.obj).trigger('update');
        } 
    });
    

    // when the document is ready, load up languages & render the app model
    $(document).ready(function() {
        obviel.i18n.load().done(function() {
            obviel.i18n.setLocale('nl_NL').done(function() {
                $('#app').render(todos);
            });
        });
    });
}(jQuery, obviel));