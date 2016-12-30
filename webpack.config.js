var webpack = require('webpack');

module.exports = {
    //插件项
    // plugins: [new webpack.optimize.UglifyJsPlugin({
    //     compress: {
    //         warnings: false
    //     }
    // })],
    //页面入口文件配置
    entry: {
        demo: './demo/index.js'
    },
    //入口文件输出配置
    output: {
        path: './output/',
        filename: '[name].dist.js'
    },
    module: {
        //加载器配置
        loaders: [
            {test: /\.less$/, loader: 'style!css!less'},
            {test: /\.css$/, loader: 'style!css'},
            {test: /\.tpl$/, loader: 'string'}
        ]
    }
};