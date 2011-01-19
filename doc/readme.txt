hurry.view
**********

Introduction
============

This library packages the jQuery views for `hurry.resource`_.

.. _`hurry.resource`: http://pypi.python.org/pypi/hurry.resource

How to use?
===========

You can import views from ``hurry.views`` and ``.need`` it
where you want these resources to be included on a page::

  from hurry.views import views

  .. in your page or widget rendering code, somewhere ..

  views.need()

This requires integration between your web framework and
``hurry.resource``, and making sure that the original resources
(shipped in the ``views-build`` directory in ``hurry.views``) are
published to some URL.

The package has already been integrated for Grok_ and the Zope
Toolkit. If you depend on the `hurry.zoperesource`_ package in your
``setup.py``, the above example should work out of the box. Make sure
to depend on the `hurry.zoperesource`_ package in your ``setup.py``.

.. _`hurry.zoperesource`: http://pypi.python.org/pypi/hurry.zoperesource

.. _Grok: http://grok.zope.org
