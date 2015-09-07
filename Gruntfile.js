// Gruntfile.js

module.exports = function(grunt) {

	// Init
	grunt.initConfig({

		// Get the configuration
		pkg: grunt.file.readJSON('package.json'),
		meta: {
	     	banner: '/**\n' +
	      	' * <%= pkg.description %>\n' +
	      	' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
	      	' * @link <%= pkg.homepage %>\n' +
	      	' * @author <%= pkg.author %>\n' +
	      	' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
	      	' */\n'
	    },
	    connect: {
	     	devserver: {
	        	options: {
	          		port: 9001,
	          		hostname: '0.0.0.0',
	          		base: '.'
	        	}
	      	}
	    },
	    dirs: {
	      	src: 'src',
	      	dest: 'dist'
	    },
	    copy: {

	    },
	    concat: {
	    	options: {
	        	banner: '<%= meta.banner %>'
	      	},
	      	dist: {
	        	src: ['<%= dirs.src %>/*.js', '<%= dirs.src %>/**/*.js'],
	        	dest: '<%= dirs.dest %>/<%= pkg.name %>.js'
	      	}
	    },
	    cssmin: {
      		combine: {
        		files: {
          			'<%= dirs.dest %>/<%= pkg.name %>.min.css': ['<%= dirs.dest %>/<%= pkg.name %>.css']
        		}
      		}
    	},
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			build: ['Gruntfile.js', 'src/**/*.js']
		},
		ngAnnotate: {
      		dist: {
        		files: {
          			'<%= concat.dist.dest %>': ['<%= concat.dist.dest %>']
        		}
      		}
    	},
		uglify: {
			options: {
        		banner: '<%= meta.banner %>'
      		},
      		dist: {
        		src: ['<%= concat.dist.dest %>'],
        		dest: '<%= dirs.dest %>/<%= pkg.name %>.min.js'
      		}
		},
		watch: {
      		dev: {
        		files: ['<%= dirs.src %>/**'],
        		tasks: ['build']
      		}
    	}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-ng-annotate');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
  	grunt.loadNpmTasks('grunt-contrib-uglify');
  	grunt.loadNpmTasks('grunt-contrib-cssmin');
  	grunt.loadNpmTasks('grunt-contrib-watch');

  	// Build task
  	grunt.registerTask('build', ['jshint', 'concat', 'ngAnnotate', 'uglify', 'cssmin']);

  	// Default task
  	grunt.registerTask('default', ['build', 'connect', 'watch']);

};
