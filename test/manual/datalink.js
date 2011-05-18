
$(document).ready(function() {

    obviel.view({
        html: '<div id="alpha"></div><div id="beta"></div>',
        links: {
            '#alpha': 'alpha',
            '#beta': 'beta'
        },
        events: {
            '#alpha': {
                name: 'click',
                handler: function(ev) {
                    ev.view.liveobj.setField('beta', 'Changed');
                }
            }
        }
    });
    
    $('#test').render({'alpha': 'ALPHA', 'beta': 'BETA'});

});