Obviel - Object/View/Element
============================

Obviel is a way to structure your Javascript application.

It is released under the MIT license.

See doc for much more documentation.

BACKWARD INCOMPATIBILITY NOTES:
===============================

When porting apps from 'hurry.views' to 'obviel', take the following into
account:

* fixed the option 'seperator' on decimal_field, is now called 'separator'
  (mind the 'a')

* changed the event names, they now all end on '.obviel' (namespace) and some
  have shorter names

* changed the namespaces, 'views' is now called 'obviel' and 'formviews' is
  now 'obviel.forms'
