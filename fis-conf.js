fis.set('project.files', ['/demo/index.html', 'map.json']);

fis.hook('commonjs');

require('./fis3-pack');

fis.match('::package', {postpackager: fis.plugin('loader')});
// fis.match('*', {deploy: [fis.plugin('local-deliver')]});



fis.hook('relative');
fis.match('*.*', {relative: true});
fis.match('*.js', {isMod: true});
// fis.on('compile:parser', function (file) {
//     console.log('compile:parser');
// });


// fis.on('standard:html', function (file) {
//     console.log('parser', file);
// });

// fis.on('packager', function (file) {
//     console.log('compile: ', file.id);
//     console.log(file);
// });

// console.log('conf:loaded');
// var files = fis.project.getSource();
// console.log(files);
// fis.match('**', {
//     optimizer: fis.plugin('minify')
// });

