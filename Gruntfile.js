var fs       = require('fs'),
    path     = require('path'),

    cwd      = process.cwd(),
    buildDir = path.resolve(cwd, '.build'),
    distDir  = path.resolve(cwd, 'lib'),

    configGrunt;

configGrunt = function (grunt) {

  var cfg = {
    pkg: grunt.file.readJSON('package.json'),

    // Clean
    clean: {
      usecache: ['.build/*', '!.build/cache'],
      clearcache: ['.build'],
      build: ['lib/build'],
      release: ['lib/release'],
      all: ['.build', 'lib']
    },

    // CSS minify
    cssmin: {
      options: { keepSpecialComments: 0 },

      cache: {
        files: {
          '.build/cache/style.min.css' : ['vendor/css/*.min.css']
        }
      },

      build: {
        files: {
          'lib/build/assets/css/style.css' : ['.build/cache/*.min.css', '.build/css/*.min.css']
        }
      },

      release: {
        files: {
          'lib/release/assets/css/style.css' : ['.build/cache/*.min.css', '.build/css/*.min.css']
        }
      }
    },

    // Copy non-SASS/JS files
    copy: {
      cache: {
          files: [{
            expand: true,
            cwd: 'vendor/img',
            src: ['*.jpg', '*.png'],
            dest: '.build/cache'
          }]
      },

      build: {
        options: {
          process: function (content, srcpath) {
            return grunt.template.process(content);
          }
        },

        files: [{
          expand: true,
          cwd: 'src',
          src: ['*.hbs', 'partials/*.hbs'],
          dest: 'lib/build/'
        }, {
          expand: true,
          cwd: 'src',
          src: ['package.json'],
          dest: 'lib/build/',
        }]
      },

      buildImages: {
        files: [{
          expand: true,
          cwd: '.build/cache',
          src: ['*.png', '*.jpg'],
          dest: 'lib/build/assets/img/'
        }]
      },

      release: {
        options: {
          process: function (content, srcpath) {
            return grunt.template.process(content);
          }
        },

        files: [{
          expand: true,
          cwd: 'src',
          src: ['*.hbs', 'partials/*.hbs'],
          dest: 'lib/release/',
        }, {
          expand: true,
          cwd: 'src',
          src: ['package.json'],
          dest: 'lib/release/',
        }]
      },

      releaseImages: {
        files: [{
          expand: true,
          cwd: '.build/cache',
          src: ['*.png', '*.jpg'],
          dest: 'lib/release/assets/img/'
        }]
      }
    },

    // SASS
    sass: {
      main: {
        options: {
          outputStyle: 'compact'
        },
        files: [{
          expand: true,
          cwd: 'src/sass',
          src: ['*.sass', '*.scss'],
          dest: '.build/css/',
          ext: '.min.css'
        }]
      }
    },

    // Concurrent directives
    concurrent: {
      options: { logConcurrentOutput: true },

      clearb: ['clean:clearcache', 'clean:build'],
      clearbu: ['clean:usecache', 'clean:build'],
      clearr: ['clean:clearcache', 'clean:release'],
      clearru: ['clean:usecache', 'clean:release'],

      // build from cache
      cachebuild: ['copy:build', ['sass', 'cssmin:build']],

      // build all
      build: [['copy:cache', 'copy:buildImages'], 'copy:build', ['cssmin:cache', 'sass', 'cssmin:build']],

      // release from cache
      cacherelease: ['copy:release', ['sass', 'cssmin:release']],

      // release all
      release: [['copy:cache', 'copy:releaseImages'], 'copy:release', ['cssmin:cache', 'sass', 'cssmin:release']]
    },

    watch: {
      main: {
        files: ['src/*.hbs', 'src/partials/*.hbs', 'src/sass/*', 'src/js/*'],
        tasks: ['default']
      }
    }
  };

  // Load grunt stuff
  require('matchdep').filterDev(['grunt-*', '!grunt-cli']).forEach(grunt.loadNpmTasks);

  // Load config into Grunt
  grunt.initConfig(cfg);

  // Build
  grunt.registerTask('build', 'Builds with cache files, and assembles them if they do not exist', function () {
    var done = this.async();

    fs.stat(path.join(buildDir, 'cache'), function (err, stats) {
      if (err) {
        grunt.task.run(['concurrent:clearb', 'concurrent:build']);
        done();
      } else {
        grunt.task.run(['concurrent:clearbu', 'concurrent:cachebuild']);
        done();
      }
    });
  });

  // Rebuild all
  grunt.registerTask('build-all', 'Wipes and builds (not release)',
    ['clean:all', 'concurrent:build']);

  // Release
  grunt.registerTask('release', 'Releases with cache files, and assembles them if they do not exist', function () {
    var done = this.async();

    fs.stat(path.join(buildDir, 'cache'), function (err, stats) {
      if (err) {
        grunt.task.run(['concurrent:clearr', 'concurrent:release']);
        done();
      } else {
        grunt.task.run(['concurrent:clearru', 'concurrent:cacherelease']);
        done();
      }
    });
  });

  // Rerelease all
  grunt.registerTask('release-all', 'Wipes and releases',
    ['clean:all', 'concurrent:release']);

  // Refresh project
  grunt.registerTask('clear', 'Wipes all build and release files',
    ['clean:all']);

  // Default
  grunt.registerTask('default', 'build', ['build']);
};

module.exports = configGrunt;
