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


config["Obviel Template"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/json2.js'
    ],
    sources: [
        "src/obviel/obviel.js",
        "src/obviel/obviel-template.js"
    ],
    tests: [
        "src/btest/test-obviel-template.js"
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


config["Obviel i18n"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/Gettext.js'
    ],
    sources: [
        'src/obviel/obviel-template.js', // for i18n.variables
        'src/obviel/obviel-i18n.js'
    ],
    tests: [
        "src/btest/test-obviel-i18n.js"
    ]
};


config["Obviel Forms"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/jquery.datalink.js',
        'src/dependencies/Gettext.js'
    ],
    sources: [
        'src/obviel/obviel-template.js',
        'src/obviel/obviel.js',
        'src/obviel/obviel-forms.js'
    ],
    tests: [
        "src/btest/test-obviel-forms.js"
    ],
    resources: [
        {path: '/', file: 'src/btest/body.html'}
    ]
};


config["Obviel Patterns"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js'
    ],
    sources: [
        'src/obviel/obviel.js',
        'src/obviel/obviel-patterns.js'
    ],
    tests: [
        "src/btest/test-obviel-patterns.js"
    ]
};


