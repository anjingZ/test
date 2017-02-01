// Created by zr8732@126.com  on 2014/10/7.
module.exports = function(grunt){
    //项目配置
    grunt.initConfig({
        pkg:grunt.file.readJSON('package.json'),
        path:{
            src:"dev",
            dist:"build"
        },
        clean:{
           build:{
              src:[
                  '<%= path.dist%>/'
              ]
           }
        },
        less:{
            build:{
                files:[
                    {
                        src:['<%= path.src%>/less/base.less'],
                        dest:'<%= path.dist%>/css/base.css'
                    },
                    {
                        src:['<%= path.src%>/less/layout.less'],
                        dest:'<%= path.dist%>/css/layout.css'
                    },
                    {
                        src:[
                            '<%= path.src%>/less/index/nav.less',
                            '<%= path.src%>/less/index/topBanner.less'
                        ],
                        dest:'<%= path.dist%>/css/index/index.css'
                    }
                ]

            }

        },
        concat:{
            js:{
               files:[{
                   src:['<%= path.src%>/js/a.js',
                   '<%= path.src%>/js/b.js'
                   ],
                   dest:'<%= path.dist%>/js/base.debug.js'
               }]
            },
            css:{
                files:[
                    {
                        src:[
                            '<%= path.dist%>/css/base.css',
                            '<%= path.dist%>/css/layout.css'
                        ],
                        dest:'<%= path.dist%>/css/all.debug.css'
                    },
                    {
                        src:[
                            '<%= path.dist%>/css/index/index.css'

                        ],
                        dest:'<%= path.dist%>/css/index/index.debug.css'
                    }
                ]
            }
        },
        cssmin:{
            build:{
                expand:true,
                cwd:'<%= path.dist%>/css/',
                src:['**/*.debug.css','!.min.css'],
                dest:'<%= path.dist%>/css/',
                ext:'.min.css'
            }
        },
        uglify:{
            build:{
                files:[
                    {
                        expand: true,
                        cwd:'<%= path.dist%>/js/',
                        src:'*.debug.js',
                        dest:'<%= path.dist%>/js/',
                        ext:'.min.js'

                    }
                ]
            }
        },
        copy:{
            main:{
                files:[
                    {
                        expand:true,
                        cwd:'<%= path.src%>/img/',
                        src:'**',
                        dest:'<%= path.dist%>/img/'
                    }
                ]
            }
        },
        watch:{
            css:{
                files:['<%= path.src%>/less/*.less'],
                tasks:['less','concat:css','cssmin']
            },
            js:{
                files:['<%= path.src%>/js/*.js'],
                tasks:['concat:js','uglify']
            }
        }


    });
    //加载任务插件
   // grunt.loadNpmTasks('grunt-contrib-clean');
    //grunt.loadNpmTasks('grunt-contrib-less');
    require('load-grunt-tasks')(grunt);
    //执行的命令
    grunt.registerTask('build:less',['less']);
    grunt.registerTask('build:css',['concat:css']);
    grunt.registerTask('build:cssmin',['cssmin']);
    grunt.registerTask('build:js',['concat:js','uglify']);
    grunt.registerTask('build:copy',['copy']);



    grunt.registerTask('default',['clean','build:less','build:css','build:cssmin','build:js','copy']);

    grunt.registerTask('dev','watch');
};
