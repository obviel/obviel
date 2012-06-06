(function($, obviel) {
    obviel.view({
        iface: 'todos',
        obvt_url: 'todos.obvt',
        object_events: {
            update: 'rerender',
            update_stats: 'update_stats'
        },
        render: function() {
            $('#new-todo', this.el).focus();
            this.update_stats();
        },
        update_stats: function() {
            var stats = get_stats(this.obj);
            if (stats.amount) {
                $('#toggle-all', this.el).get(0).checked = !stats.remaining;
                $('footer', this.el).render(stats);
                $('footer', this.el).show();
            } else {
                $('footer', this.el).hide();
            }
        },
        create_on_enter: function(ev) {
            if (ev.keyCode !== 13) {
                return;
            }
            var value = $('#new-todo').val();
            if (value === '') {
                return;
            }
            this.obj.items.push({iface: 'todo', done: false, title: value});
            $(this.obj).trigger('update');
        },
        toggle_all: function() {
            var done = $('#toggle-all', this.el).get(0).checked;
            $.each(this.obj.items, function(index, item) {
                item.done = done;
            });
            $(this.obj).trigger('update');
        }
    });

    var get_stats = function(todos) {
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
    
    obviel.view({
        iface: 'stats',
        obvt_url: 'todo-stats.obvt',
        clear_completed: function() {
            var new_items = [];
            $.each(todos.items, function(index, item) {
                if (!item.done) {
                    new_items.push(item);
                }
            });
            todos.items = new_items;
            $(todos).trigger('update');
        }
    });
    
    obviel.view({
        iface: 'todo',
        obvt_url: 'todo.obvt',
        object_events: {
            update: 'rerender'
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
            $(todos).trigger('update_stats');
        },
        clear: function() {
            clear(this.obj);
            $(todos).trigger('update');
        }
    });

    obviel.view({
        iface: 'todo-editing',
        obvt_url: 'todo-editing.obvt',
        object_events: {
            update: 'rerender'
        },
        render: function() {
            $('input.edit', this.el).focus();
        },
        update_on_enter: function(ev) {
            if (ev.keyCode === 13) {
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
    

    var todos = {
        iface: 'todos',
        items: []
    };

    var clear = function(todo) {
        for (var i = 0; i < todos.items.length; i++) {
            if (todos.items[i] === todo) {
                todos.items.splice(i, 1);
                break;
            }
        }
    };

    $(document).ready(function() {    
        $('#todoapp').render(todos);
    });
}(jQuery, obviel));