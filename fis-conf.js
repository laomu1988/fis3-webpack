fis.set('project.files', ['/demo/index.html', 'map.json']);

require('./fis3-pack');


// 使用相对路径
fis.hook('relative');
fis.match('*.*', {relative: true});
fis.match('*.js', {packTo: 'index.dest.js'});
fis.match('*.css', {packTo: 'index.dest.css'});
fis.match('*.html', {release: 'index.dest.html'});

// fis.match('*.*', {optimizer: fis.plugin('minify')});