var config = module.exports;

config["Obviel Core"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/json-template.js',
        'src/dependencies/Gettext.js'
    ],
    
    sources: [
        "src/obviel/obviel-i18n.js",
        "src/obviel/obviel-template.js",
        'src/obviel/obviel.js'
    ],
    tests: [
        "src/btest/test-obviel-iface.js",
        "src/btest/test-obviel.js"
    ],
    resources: [
        {path: '/', file: 'src/btest/body.html'},
        'src/btest/fixtures/**.**'
    ]
};


config["Obviel Traject"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js'
    ],
    sources: [
        'src/obviel/obviel-traject.js'
    ],
    tests: [
        "src/btest/test-obviel-traject.js"
    ]
};


