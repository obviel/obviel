var config = module.exports;

config["Obviel Tests"] = {
    rootPath: ".",
    environment: "browser",
    sources: [
        "src/dependencies/*.js",
        "src/obviel/*.js"
    ],
    tests: [
        "src/btest/test-*.js"
    ]
}