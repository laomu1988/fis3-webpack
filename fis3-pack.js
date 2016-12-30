/**
 * 让fis3兼容webpack打包规则,引入资源仅需在代码中使用require即可
 *
 *
 *
 * @author: laomu1988@qq.com
 *
 * */
var fs = require('fs');
var config = {
    // 生成的文件名称
    name: 'fis3-pack-mod',
    // 定义define和require的模块加载器
    mod: fs.readFileSync(__dirname + '/mod.js', 'utf8'),
    // 添加其他代码到生成的js文件中
    append: '',
};


var packFile;


fis.on('release:start', function (ret) {
    var files = ret.src;
    for (var src in files) {
        var file = files[src];
        if (file.isHtmlLike) {
            file.addRequire(config.name + '.js');
        }
    }
    var projectPath = fis.project.getProjectPath();
    packFile = fis.file(projectPath + '/' + config.name + '.js');
    packFile._content = config.mod + config.append;
    packFile.isMod = false;
    files[config.name] = packFile;
    console.log('newFile:', packFile);

    console.log('release:start', files);
});
fis.on('process:end', function (file) {
    // file.addRequire(path);
});
fis.on('standard:html', function () {

});

fis.on('compile:end', function (file) {
    // console.log('compile:end');
    if (file.isCssLike) {
        packFile._content += 'define("' + file.getId() + '",function(r,m){m.exports = "";})\n';
    }
});

fis.on('postpackager', function () {
    console.log('postpackager');
    // console.log('postpackager:', config.mod + packSrc);
    // packFile._content = config.mod + packSrc;
});


fis.on('compile:start', function (file) {
    // console.log('compile:start,', file.id);
    // if (file.isCssLike) {
    //     file.id = 'fis3-common-css';
    // }
    // if (file.isHtmlLike) {
    //     file.addLink('fis3-common');
    //     // file.id = 'fis3-common-html';
    // }
    // console.log('compile:start2,', file.id);
});
fis.on('lookup:file', function (info) {
    console.log('file:lookup', info.origin);
});


module.exports = function (conf) {
    if (conf) {
        for (var attr in conf) {
            if (typeof conf[attr] !== 'undefined') {
                config[attr] = conf[attr];
            }
        }
    }
};