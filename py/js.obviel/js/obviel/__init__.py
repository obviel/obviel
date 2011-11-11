from fanstatic import Library, Resource

from js.jquery import jquery
from js.jquery_datalink import jquery_datalink as datalink
from js.jquery_jgrowl import jquery_jgrowl as jgrowl
from js.jquery_jgrowl import jquery_jgrowl_css as jgrowl_css
from js.jqueryui import jqueryui
from js.jsgettext import gettext
from js.json2 import json2
from js.json_template import json_template
from js.jquery_datatables import jquery_datatables_js

library = Library('obviel', 'resources')

obviel = Resource(library, 'obviel.js', depends=[jquery, json_template])

forms = Resource(library, 'obviel-forms.js', depends=[obviel, json2, datalink,
                                                      gettext])
forms_datepicker = Resource(library, 'obviel-forms-datepicker.js',
                            depends=[forms, jqueryui])
forms_autocomplete = Resource(library, 'obviel-forms-autocomplete.js',
                              depends=[forms, jqueryui])
forms_nl = Resource(library, 'obviel-forms-nl.js')

patterns = Resource(library, 'obviel-patterns.js', depends=[obviel])
jgrowl = Resource(library, 'obviel-jgrowl.js', depends=[obviel, jgrowl_css,
                                                        jgrowl])

datatables = Resource(library, 'obviel-datatables.js', depends=[
        obviel,
        jqueryui,
        jquery_datatables_js])
