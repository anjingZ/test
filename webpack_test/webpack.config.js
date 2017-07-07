/**
 * Created by ziyu on 2017/7/5.
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

require('shelljs/global');

// console.log(__dirname)

console.log(1,__dirname);

const PATH = {
    app: __dirname + '/src/js/',
    dist: __dirname + '/dist/'
}

let isDev = process.argv.join(',').indexOf('development') > -1 ? true:false;
if(!isDev){
    rm('-rf', PATH.dist);
}


module.exports = {
    entry: {
        app: PATH.app + 'index.js'
    },
    output: {
        path: PATH.dist,
        filename: '[name].[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                // use: ['style-loader','css-loader']
                use: ExtractTextPlugin.extract({
                    use: 'css-loader'
                })
            },
            {
                test: /\.(js|jsx)$/,
                exclude:/node_modules/,
                use: [{loader: 'babel-loader',
                    options:{
                        presets:['es2015']
                    }
                }]
            }
        ]
    },
    devtool:isDev?'cheap-eval-source-map':'cheap-source-map',
    devServer:{
        hot: true,
        contentBase: path.resolve(__dirname,'dist'),
        publicPath:'/',
        compress: true,
        port: 9000
    },
    externals:{
        jquery:'jQuery'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin('styles.[hash].css'),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name:['vendor']
        }),
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ]
}