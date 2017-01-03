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
    name: 'fis3-webpack-mod',
    // 定义define和require的模块加载器
    mod: fs.readFileSync(__dirname + '/mod.js', 'utf8'),
    // 添加其他代码到生成的js文件中
    append: ''
};
var files = {};
var htmlFiles = {};
var jsFiles = {};
var packFile;
fis.hook('commonjs');
fis.match('::package', {postpackager: fis.plugin('loader')});
fis.match('*.js', {isMod: true});
fis.match('*', {deploy: [fis.plugin('local-deliver')]});

function log(file, sign) {
    return;
    sign && console.log('--------------    ' + sign + '    ---------');
    console.log('file.id:', file.id);
    console.log('file.url:', file.url);
    console.log('file.links:', file.links);
    console.log('file.requires:', file.requires);
}

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
    fis.emit('fis3-webpack:start', packFile);
});
/**
 * 判断文件是否被其他文件依赖,而不是入口文件
 * */
function isRequired(file) {
    if (!file) {
        return false;
    }
    for (var attr in jsFiles) {
        var f = jsFiles[attr];
        if (f.requires && f.requires.length > 0) {
            var requires = f.requires;
            for (var i = requires.length - 1; i >= 0; i--) {
                if (requires[i] === file.id || requires[i] === file.moduleId) {
                    return f;
                }
            }
        }
    }
    return false;
}

fis.on('compile:end', function (file) {

    files[file.id] = file;
    files[file.url] = file;
    if (file.isHtmlLike) {
        htmlFiles[file.id] = file;
        // link文件加入到require列表中,package时会优先输出
        if (file.links && file.links.length > 0) {
            var requires = file.requires;
            if (!requires) {
                file.addRequire(file.links[0]);
                requires = file.requires;
            }
            file.links.forEach(function (link) {
                link = link ? link.trim() : '';
                link = (link[0] === '\/' || link[0] === '\\') ? link.substr(1) : link.trim();
                if (requires.indexOf(link) < 0) {
                    requires.unshift(link);
                }
            });
        }
    } else if (file.isJsLike) {
        jsFiles[file.id] = file;
    }
    log(file, 'compile:end');
    // console.log('compile:end', file);
    fis.emit('fis3-webpack', packFile, file);
    if (!file.packed) {
        if (file.isCssLike) {
            file.packed = true;
            packFile._content += 'define("' + file.moduleId + '",function(){});\n';
        }
        else if (file.isHtmlLike) {
            // 只有被js引用的html才打包
            if (isRequired(file)) {
                file.packed = true;
                var content = file._content || '';
                content = content.replace(/([\'\"\n])/g, '\\$1');
                packFile._content += 'define("' + file.moduleId + '",function(r,e,m){m.exports = "' + content + '"})';
            }
        }
    }
});

fis.on('postpackager', function () {
    // 发布文件前触发
    fis.emit('fis3-webpack:end', packFile);
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