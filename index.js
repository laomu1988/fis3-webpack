var commonPaths = {},
    path = require('path'),
    compareVersion = require(__dirname + '/common/js/util/compareVersion.js');

fis.set('project.ignore', ['node_modules/**', 'output/**', '.git/**', 'fis-conf.js']);

fis.match('*', {deploy: [fis.plugin('local-deliver')]});


var exports = {
    media: function () {
        return fis.project.currentMedia;
    },
    // 设置模块的路径,可自动在该模块下查找资源,引用时需要以模块名称开头, 例如 setModulePath('t10-ui', __dirname);
    setModulePath: function (moduleName, localPath) {
        if (moduleName) {
            fis.on('lookup:file', function (info, file) {
                var projectPath = fis.project.getProjectPath(); // 重新获取projectPath,避免设置projectRootPath路径变更
                localPath = localPath || projectPath;
                // 已经查找到文件,则退出
                if (info.file) return;
                // console.log(info.origin);
                var origin = info.origin.replace(/[\'\"]/g, ''), folderName;
                if (origin.indexOf('?') >= 0) {
                    origin = origin.substr(0, origin.indexOf('?'));
                }
                origin.replace(new RegExp('^[\\s\'\"\\/]*' + moduleName + '(\\W|$)(.*)'), function (all, end, left) {
                    // console.log('lookup:', moduleName, left);
                    origin = (localPath + '/' + left).replace(/[\'\"]/g, '');
                    if (origin[origin.length - 1] === '/') {
                        origin = origin.substring(0, origin.length - 1);
                    }
                    // console.log('origin:', origin);
                    // 假如存在package.json,则使用package.main
                    if (fis.util.isDir(origin) && fis.util.isFile(origin + '/package.json')) {
                        var pkg = require(origin + '/package.json');
                        if (pkg.main && fis.util.isFile(origin + '/' + pkg.main)) {
                            var uri = fis.uri(path.relative(projectPath, origin + '/' + pkg.main));
                            info.file = uri.file;
                            return;
                        }
                    }

                    folderName = origin.substring(origin.lastIndexOf('/')).replace(/\//g, '');
                    var list = [origin];
                    if (folderName.indexOf('.') < 0) list = list.concat([origin + '/index.js', origin + '/index.jsx', origin + '/' + folderName + '.js', origin + '/' + folderName + '.jsx'])
                    for (var i = 0; i < list.length; i++) {
                        // console.log('look:', list[i], projectPath);
                        var uri = fis.uri(path.relative(projectPath, list[i]));
                        if (uri.file) {
                            info.file = uri.file;
                            return;
                        }
                    }
                });

                // if (!info.file)console.log(info, origin);
            });
        }
    },
    // 设置文件路径, 只能指定一个文件的路径
    setCommonPath: function (media, module, path) {
        if (typeof module == 'string') {
            commonPaths[module] = path;
        } else {
            for (var attr in module) {
                commonPaths[attr] = module[attr];
            }
        }
        media.hook('commonjs', {
            extList: ['.js', '.jsx', '.es'],
            paths: commonPaths
        });
        return media;
    },
    // 打包时是否压缩
    min: function (media) {
        return media
            .match('*.png', {optimizer: fis.plugin('png-compressor')})
            .match('*.{js,jsx}', {
                optimizer: fis.plugin('uglify-js', {
                    mangle: {expect: ['require', 'define']}
                })
            })
            .match('*.{css,less,scss}', {
                //保持一个规则一个换行
                optimizer: fis.plugin('clean-css', {'keepBreaks': true})
            })
            .match('*.min.{js,css}', {optimizer: null}); // 避免重复压缩;
    },
    /**
     * 生成zip文件
     * filename: zip文件名称,默认output.zip
     * to:       打包到哪个文件夹, 默认 ./output/
     * include:  包含内容, []
     * exclude:  排除内容, []
     * **/
    zip: function (options) {
        options = options || {};
        options.filename = options.filename || 'output.zip';
        options.to = options.to || './output/';
        return fis.match(exports.media()).match('**', {
            deploy: [
                function (opt, modified, total, next) {
                    modified.reduceRight(function (_, file, index) {
                        if (!fis.util.filter(file.subpath, options.include, options.exclude)) {
                            modified.splice(index, 1)
                        }
                    }, null);
                    next();
                },
                fis.plugin('zip', {
                    filename: options.filename
                }),
                fis.plugin('local-deliver', {
                    to: options.to
                })
            ]
        });
    }
};


fis.unhook('components');
fis.hook('node_modules');

// 使用相对路径
fis.hook('relative');
fis.match('*.{html,less,js,jsx,ico,png,gif,jpg}', {relative: true});

// 开启模块化包装amd，cmd
fis.hook('commonjs', {extList: ['.js', '.jsx', '.es']});


module.exports = exports;