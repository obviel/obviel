module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower: {
        target: {
            rjsConfig: 'rjs.js'
        }
    },
    requirejs: {
        compile: {
            options: {
                name: 'obviel',
                mainConfigFile: 'rjs.js',
                out: "obviel.js"
            }
        }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-requirejs');
  grunt.loadNpmTasks('grunt-bower-requirejs');
  // Default task(s).
  grunt.registerTask('default', ['bower', 'requirejs']);

};
