var config = module.exports;

var linterConf = {
    linter: 'jshint',
        linterOptions: {
            asi: false,
            bitwise: true,
            boss: false,
            browser: true,
            curly: true,
            devel: false,
            eqeqeq: true,
            evil: false,
            expr: false,
            forin: false,
            immed: true,
            jquery: true,
            latedef: false,
            mootools: false,
            newcap: true,
            node: false,
            noempty: true,
            nomen: false,
            nonew: true,
            onevar: false,
            plusplus: false,
            regexp: true,
            strict: false,
            supernew: true,
            undef: true,
            white: false
        },
        excludes: [
            "jquery",
            "json-template",
            "Gettext.js",
            "json2",
            "jshashtable_src.js",
            "jshashset_src.js"
       ]
};

config["Obviel Core"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/json-template.js',
        'src/dependencies/Gettext.js',
        'src/dependencies/json2.js'
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
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
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
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
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
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
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
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
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
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
};


config["Obviel Forms Datepicker"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/jquery-ui.js',
        'src/dependencies/jquery.datalink.js',
        'src/dependencies/Gettext.js'
    ],
    sources: [
        'src/obviel/obviel-template.js',
        'src/obviel/obviel.js',
        'src/obviel/obviel-forms.js',
        'src/obviel/obviel-forms-datepicker.js'
    ],
    tests: [
        "src/btest/test-obviel-forms-datepicker.js"
    ],
    resources: [
        {path: '/', file: 'src/btest/body.html'}
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
};

config["Obviel Forms Autocomplete"] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/jquery-ui.js',
        'src/dependencies/jquery.datalink.js',
        'src/dependencies/Gettext.js',
        'src/dependencies/jquery.ba-bbq.js'
    ],
    sources: [
        'src/obviel/obviel-template.js',
        'src/obviel/obviel.js',
        'src/obviel/obviel-forms.js',
        'src/obviel/obviel-forms-autocomplete.js'
    ],
    tests: [
        "src/btest/test-obviel-forms-autocomplete.js"
    ],
    resources: [
        {path: '/', file: 'src/btest/body.html'}
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
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
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
};

config['Obviel Sync'] = {
    rootPath: ".",
    environment: "browser",
    libs: [
        'src/dependencies/jquery.js',
        'src/dependencies/jshashtable_src.js',
        'src/dependencies/jshashset_src.js'
    ],
    sources: [
        'src/obviel/obviel-sync.js'
    ],
    tests: [
        "src/btest/test-obviel-sync.js"
    ],
    extensions: [require('buster-lint')],
    "buster-lint": linterConf
};