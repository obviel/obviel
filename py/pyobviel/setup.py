import os
from setuptools import setup, find_packages

def read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()

setup(
    name='pyobviel',
    version='0.5dev',
    description='Python Obviel integration',
    long_description='',
    author='Obviel Developers',
    author_email='obviel@googlegroups.com',
    packages=['pyobviel'],
    include_package_data = True,
    zip_safe=False,
    license='BSD',
    install_requires=[
        'simplejson',
        'sqlalchemy',
        'MySQL-python',
        'pytest >= 2.0.0', # XXX test require
    ],
)
