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
var packFile, packedFiles = {};
fis.hook('commonjs');
fis.match('::package', {postpackager: fis.plugin('loader')});
fis.match('*.js', {isMod: true});
fis.match('*', {deploy: [fis.plugin('local-deliver')]});

function log(sign, file) {
    return false;

    if (file && file.id) {
        sign && console.log('--------------    ' + sign + '    ---------');
        console.log('file.id:', file.id);
        console.log('file.url:', file.url);
        console.log('file.links:', JSON.stringify(file.links));
        console.log('file.requires:', JSON.stringify(file.requires));
    } else {
        console.log.apply(console, arguments);
    }
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
    packFile.useCache = false;
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
// link文件加入到require列表前,package时会优先输出
function adjustLinks(file) {
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
}


fis.on('compile:end', function (file) {
    log('compile:end' + file.id);
    if (!file || !file.release || file.id.indexOf(config.name) >= 0 || file.webpacked === false) return;
    log('start webpack:', file.id);
    files[file.id] = file;
    files[file.moduleId] = file;
    files[file.url] = file;
    if (file.isHtmlLike) {
        adjustLinks(file);
    }
    log('compile:end', file);
    // console.log('compile:end', file);
    file.webpacked = undefined;
    fis.emit('fis3-webpack', file);
    if (typeof file.webpacked !== 'string') {
        function pack(content) {
            log('webpack:', file.moduleId);
            var packBefore = 'define("' + file.moduleId + '",function(r,e,m){';
            var packEnd = '});\n';
            file.webpacked = packFile._content + packBefore + content + packEnd;
        }

        if (file.isCssLike) {
            pack('');
        }
        else if (file.isHtmlLike) {
            // 只有被js引用的html才打包
            if (isRequired(file)) {
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
                    pack(base64);
                }
                else if (!file.relative) {
                    // 使用绝对路径
                    pack(absolutePath);
                } else {
                    while (from && !from.isHtmlLike) {
                        // console.log(from);
                        from = isRequired(from);
                    }
                    if (!from) {
                        // 没有找到引入位置,直接使用base64引入
                        fis3.warn('fis3-webpack can not resolve file:', file.origin);
                        pack(base64);
                    } else {
                        // console.log(file._content.length);
                        // packFile._content += 'define("' + file.moduleId + '",function(r,e,m){m.exports = "' + file.getBase64() + '"});\n';
                        // 使用相对路径引入图片
                        var src = path.relative(from.dirname, file.fullname);
                        // console.log('relative:', from.dirname, file.fullname, src);
                        pack('m.exports = "' + src + '";');
                    }
                }
            }
        }
    }
    if (file.webpacked) {
        log('add webpacked:', file.getId());
        packedFiles[file.getId()] = file;
    }
    // if (file.webpacked || content != packFile.getContent()) {
    //     // 每次修改完packfile后都重新编译一次
    //     fis.compile(packFile, packFile.getContent());
    // }
});

fis.on('pack:file', function (message) {
    if (message.file.id.indexOf(config.name) >= 0) {
        var content = '';
        for (var id in packedFiles) {
            content += packedFiles[id].webpacked || '';
        }
        packFile.setContent(packFile.getContent() + content);

        // 重新编译一次,避免内容改变影响其他插件
        fis.compile(packFile, packFile.getContent());
    }
    log('pack:file', message.file.id);
});


fis.on('postpackager', function (source) {
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