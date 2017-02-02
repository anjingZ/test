/**
 * Created by anry on 2017/2/2.
 */

var gulp = require('gulp');
var path = require('path');

var clean = require('gulp-clean');

var less = require('gulp-less');
var lessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new lessAutoprefix({browsers: ['last 2 versions']});

var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');


gulp.task('clean',function () {
    return gulp.src('./build/')
        .pipe(clean({force:true}))
})

gulp.task('less',['clean'],function () {
    return gulp.src('./dev/less/**/*.less')
        // .pipe(sourcemaps.init())
        .pipe(less({
            paths:[path.join(__dirname,'less','includes')],
            plugins:[autoprefix]
        }))
        // .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/css/'))
})

gulp.task('concat-allCss',['less'],function () {
    return gulp.src(['./build/css/base.css','./build/css/layout.css'])
        .pipe(concat({path:'all.css'}))
        .pipe(gulp.dest('./build/css/'))
})

gulp.task('imgCopy',function () {
    return gulp.src('./dev/img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./build/img'))
})

gulp.task('watch',function () {
    gulp.watch('./dev/less/**/*.less',['concat-allCss']);
})

gulp.task('default',['concat-allCss','imgCopy'],function () {
    // gulp.run(['clean']);
})