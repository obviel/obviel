from setuptools import setup


setup(
    name='obvielts',
    version='0.1dev',
    description="Obviel Test Server, useful for testing Obviel in combination with server",
    classifiers=[],
    keywords='',
    author='Obviel Developers',
    author_email='obviel@googlegroups.com',
    license='BSD',
    url='http://obviel.org',
    packages=['obvielts'],
    include_package_data=True,
    zip_safe=False,
    install_requires=['paste', 'WebOb', 'fanstatic', 'js.obviel', 'traject'],
    extras_require = dict(
        test=['pytest >= 2.0'],
        ),
    entry_points = {
        'paste.app_factory': [
            'main = obvielts.main:main_factory'
            ],
        'paste.filter_factory': [
            'dontcachejson = ots.wsgi:dont_cache_json_factory'
            ],
        'fanstatic.libraries': [
            'obvielts = obvielts.main:library'
            ],
        }
    )
