module.exports = function(grunt) {

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),


        watch: {

            sass: {
                files: ['../src/scss/**/*.scss'],
                tasks: ['compass:dev'],
                options: {
                    livereload: true
                }
            },

            libs: {
                files: ['../src/js/libs/**/*.js'],
                tasks: ['uglify:libs']
            },

            js: {
                files: ['../src/js/*.js'],
                tasks: ['uglify:scripts'],
                options: {
                    livereload: true
                }
            },

            images: {
                files: ['../src/images/**/*.*'],
                tasks: ['images'],
                options: {
                    livereload: true
                }
            },

            fonts: {
                files: ['../src/fonts/*.*'],
                tasks: ['fonts']
            },

            html: {
                files: ['../templates/*.html'],
                options: {
                    livereload: true
                }
            }
        },


        compass: {
            dev: {
                options: {
                    config: 'config.rb',
                    sourcemap: true,
                    force: true
                }
            }
        },



        clean: {
            options: {
                force: true
            },
            images: ["../dist/images"],
            fonts: ["../dist/fonts"],
            release: ["../dist"]
        },


        copy: {
            fonts: {
                expand: true,
                cwd: '../src/fonts',
                src: ['**'],
                dest: '../dist/fonts/'
            }
        },


        uglify: {

            scripts: {
                options: {
                    sourceMap: true
                },
                files: {
                    '../dist/js/scripts.min.js': [
                        '../src/js/util.js',
                        '../src/js/config.js',
                        '../src/js/ascii.js',
                        '../src/js/objects.js',
                        '../src/js/api.js',
                        '../src/js/ui.js',
                        '../src/js/scene.js',
                        '../src/js/events.js',
                        '../src/js/main.js'
                    ]
                }
            },

            libs: {
                files: {
                    '../dist/js/libs.min.js': [
                        "../src/js/libs/three.min.js",
                        "../src/js/libs/Detector.js",
                        "../src/js/libs/stats.min.js",
                        "../src/js/libs/seedrandom.js",
                        "../src/js/libs/TweenMax.min.js",
                        "../src/js/libs/jquery-2.1.3.js",
                        "../src/js/libs/jquery.history.js",
                        "../src/js/libs/modernizr.min.js",
                        "../src/js/libs/DeviceOrientationControls.js",
                        "../src/js/libs/ZeroClipboard.min.js",
                        "../src/js/libs/fastclick.js",
                        "../src/js/libs/omggif.js",
                        "../src/js/libs/iscroll.js",
                        "../src/js/libs/typed.min.js"
                    ]
                }
            }
        },


        svgmin: {
            options: {
                plugins: [{
                    removeViewBox: false
                }]
            },
            all: {
                files: [{
                    expand: true,
                    cwd: '../src/images/',
                    src: ['*.svg'],
                    dest: '../dist/images/',
                    ext: '.svg'
                }]
            }
        },



        imagemin: {
            dynamic: {
                options: {
                    optimizationLevel: 7
                },
                files: [{
                    expand: true,
                    cwd: '../src/images/',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: '../dist/images/'
                }]
            }
        },

    });


    grunt.registerTask('default', ['compass', 'images', 'copy', 'uglify']);
    grunt.registerTask('release', ['clean:release', 'copy', 'compass', 'images', 'uglify']);

    grunt.registerTask('images', ['clean:images', 'svgmin', 'imagemin']);
    grunt.registerTask('fonts',  ['clean:fonts', 'copy:fonts']);

};