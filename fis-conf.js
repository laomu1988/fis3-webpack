fis.set('project.files', ['/demo/index.html', 'map.json']);

require('./fis3-pack');


// 使用相对路径
fis.hook('relative');
fis.match('*.*', {relative: true});

fis.match('*.*', {optimizer: fis.plugin('minify')});