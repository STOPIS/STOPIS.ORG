module.exports = function(grunt) {

	grunt.initConfig({

    pkg : grunt.file.readJSON('package.json'),

    coffee: {
      compile: {
				options: {
					join: true
				},
        files: {
          '../public/script.js': 'scripts/script.coffee'
        }
      }
    },

    uglify: {
      production: {
        files: {
          'scripts/libs/jquery.autocomplete.min.js' : ['scripts/libs/jquery.autocomplete.js'],
          'dist/scripts/app.min.js' : ['scripts/app.js']
        }
      }
    },

		sass: {
		    dist: {
		      options: {
						style: 'compressed'
		      },
		      files: {
		      	'../public/style.css': 'stylesheets/style.scss'
		      }
		    }
		},

    jade: {
      compile: {
        options: {
          data: {
            debug: false
          }
        },
        files: {
					"../index.html": ["views/index.jade"],
					"../legal.html": ["views/legal.jade"]
        }
      }
    }

  });


  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-coffee');

  grunt.registerTask('js', ['coffee']);
  grunt.registerTask('css', ['sass']);
  grunt.registerTask('html', ['jade']);
  grunt.registerTask('default', ['js', 'css', 'html']);


};
