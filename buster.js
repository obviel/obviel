var config = module.exports;

config["Obviel Tests"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/jquery.mockjax.js',
        'src/dependencies/Gettext.js'
    ],
    
    sources: [
        "src/obviel/obviel-i18n.js",
        "src/obviel/obviel-template.js",
        'src/obviel/obviel.js'
    ],
    tests: [
        "src/btest/test-*.js"
    ],
    resources: [
        {path: '/', file: 'src/btest/body.html'}
    ]
}
