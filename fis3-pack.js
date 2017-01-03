/**
 * 让fis3兼容webpack打包规则,引入资源仅需在代码中使用require即可
 *
 *
 *
 * @author: laomu1988@qq.com
 *
 * */
var fs = require('fs');
var path = require('path');
var config = {
    // 生成的文件名称
    name: 'fis3-webpack-mod',
    // 定义define和require的模块加载器
    mod: fs.readFileSync(__dirname + '/mod.js', 'utf8'),
    // 添加其他代码到生成的js文件中
    append: '',
    imgLimit: 10  // 当length小于
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
    packFile.webpacked = true;
    files[config.name] = packFile;
    fis.emit('fis3-webpack:start', packFile);
});
/**
 * 判断文件是否入口文件(被其他文件依赖)
 * */
function isRequired(file) {
    if (!file) {
        return false;
    }
    for (var attr in files) {
        var f = files[attr];
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
    if (!file || !file.release || file.webpacked) return;
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
    if (!file.webpacked) {
        var packBefore = 'define("' + file.moduleId + '",function(r,e,m){';
        var packEnd = '});\n';

        function pack(content) {
            file.webpacked = true;
            packFile._content += packBefore + content + packEnd;
        }

        if (file.isCssLike) {
            pack('');
        }
        else if (file.isHtmlLike) {
            // 只有被js引用的html才打包
            if (isRequired(file)) {
                file.webpacked = true;
                var content = file._content || '';
                content = content.replace(/([\'\"])/g, '\\$1')
                    .replace(/([\n])/g, '\\n');
                pack('m.exports="' + content + '";');
            }
        } else if (file.isImage()) {
            // 图片依赖
            var from = isRequired(file);
            if (from) {
                var base64 = 'm.exports = "' + file.getBase64() + '";';
                var absolutePath = 'm.exports = "' + file.release + '";';
                if (file._content.length <= 1024 * config.imgLimit) {
                    // 体积小于指定体积,使用base64格式引入
                    return pack(base64);
                }
                if (!file.relative) {
                    // 使用绝对路径
                    return pack(absolutePath);
                }
                while (from && !from.isHtmlLike) {
                    console.log(from);
                    from = isRequired(from);
                }
                if (!from) {
                    // 没有找到引入位置,直接使用base64引入
                    fis3.warn('fis3-webpack can not resolve file:', file.origin);
                    return pack(base64);
                }
                // console.log(file._content.length);
                // packFile._content += 'define("' + file.moduleId + '",function(r,e,m){m.exports = "' + file.getBase64() + '"});\n';
                // 使用相对路径引入图片
                var src = path.relative(from.dirname, file.fullname);
                // console.log('relative:', from.dirname, file.fullname, src);
                return pack('m.exports = "' + src + '";');
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