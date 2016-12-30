fis.set('project.files', ['/demo/index.html', 'map.json']);

require('./fis3-pack');

fis.hook('relative');
fis.match('*.*', {relative: true});

// 引入html文件
fis.on('fis3-pack', function (packFile, file) {
    if (file.ext === '.tpl' && !file.packed) {
        file.packed = true;
        var content = file._content || '';
        content = content.replace(/([\'\"\n])/g, '\\$1');
        // content = content.replace(/\n/g, '\\n');
        packFile._content += 'define("' + file.moduleId + '",function(r,e,m){m.exports = "' + content + '"})';
    }
});
