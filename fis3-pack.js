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
    append: ''
};


var packFile;
fis.hook('commonjs');
fis.match('::package', {postpackager: fis.plugin('loader')});
fis.match('*.js', {isMod: true});
fis.match('*', {deploy: [fis.plugin('local-deliver')]});

fis.on('release:start', function (ret) {
    // 添加文件依赖
    var files = ret.src;
    for (var src in files) {
        var file = files[src];
        if (file.isHtmlLike) {
            file.addRequire(config.name + '.js');
        }
    }
    // 新建文件
    var projectPath = fis.project.getProjectPath();
    packFile = fis.file(projectPath + '/' + config.name + '.js');
    packFile._content = config.mod + config.append;
    packFile.isMod = false;
    files[config.name] = packFile;
    fis.emit('fis3-pack:start', packFile);
});

fis.on('compile:end', function (file) {
    fis.emit('fis3-pack', packFile, file);
    if (!file.packed) {
        if (file.isCssLike) {
            file.packed = true;
            packFile._content += 'define("' + file.moduleId + '",function(){});\n';
        }
        else if (file.ext === '.tpl') {
            file.packed = true;
            var content = file._content || '';
            content = content.replace(/([\'\"\n])/g, '\\$1');
            packFile._content += 'define("' + file.moduleId + '",function(r,e,m){m.exports = "' + content + '"})';
        }
    }
});

// 发布文件前触发
fis.on('postpackager', function () {
    fis.emit('fis3-pack:end', packFile);
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