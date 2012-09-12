var config = module.exports;

config["Obviel Tests"] = {
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
        "src/btest/test-*.js"
    ]
}
