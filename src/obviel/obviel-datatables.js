/* Obviel datatable integration */

obviel.datatables = {};

(function($, obviel, module) {

    var global_datatable_config = {
        iDisplayLength: 10
    };
    
    var table_management = {

        // when the user changes the length of the table, store
        // this in a global settings so it applies to all tables
        fnInitComplete: function() {
            var datatable_wrapper = $(this).closest('.dataTables_wrapper');
            $('.dataTables_length select', datatable_wrapper).bind(
                'change', function(event) {
                    var value = parseInt($(this).val());
                    global_datatable_config.iDisplayLength = value;
                });
        },

        /* when we render, any select all row will be set to false */
        fnDrawCallback: function(){
            $('input.row-select-all', self).each(function () {
                this.checked=false;
            });
            $(this).trigger('rendered.datatable', []);
        },

        /* attach metadata to tr and td */
        fnRowCallback: function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
            var settings = this.fnSettings();
            $(nRow).data(
                'dataTable', settings.aaFullData[iDisplayIndex].metadata);
            $('td', nRow).each(function (index, element){
                $(this).data(
                    'dataTable',
                    settings.aaFullData[iDisplayIndex].data[index].metadata);
            });
            return nRow;
        },

        /*  */
        fnStateLoadCallback: function (oSettings, oData) {
            return false;
        },

        /* store state */
        fnStateSaveCallback: function (oSettings, sValue) {
            var json = sValue + '}';
            DATATABLE_SOURCE_STATES[config.source] = json;
            return sValue;
        },

        /* we store the full data in the background because
           we don't want to use aoData, because that is cast
           to a string */
        
        fnServerData: function (sSource, aoData, fnCallback) {
            var table = this;
            
            $.ajax({
                url: sSource,
                dataType: 'json',
                data: aoData,
                success: function(data) {
                    var settings = table.fnSettings();
                    settings.aaFullData = $.extend({}, data.aaData);
                    var newdata = [];
                    $.each(data.aaData, function(row_index, row_value){
                        var row = [];
                        $.each(row_value.data, function(cell_index, cell_value){
                            row.push(cell_value);
                        });
                        newdata.push(row);
                    });
                    data.aaData = newdata;
                    fnCallback(data);
                }
            });

        }
    };
    

    obviel.view({
        iface: 'datatable',
        render: function() {
            var default_config = {
                aaSorting: [[0, 'asc']],
                bProcessing: true,
                bFilter: true,
                bLengthChange: true,
                bPaginate: true,
                bServerSide: true,
                sAjaxSource: '',
                bJQueryUI: true,
                sPaginationType: 'full_numbers',
                iDisplayLength: 10,
                bAutoWidth: true,
                bStateSave: true
            };

            /* combine default config with server-side config */
            var config = $.extend(default_config, this.obj);
            /* throw in table management functions */
            // config = $.extend(config, table_management);
            
            /* translation */

            /* sFilter handling */

            /* select all */
            
            this.el.dataTable(config);
        }
    });

})(jQuery, obviel, obviel.datatable);
