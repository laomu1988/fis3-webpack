(function () {
    var a = 1;
    var b = 2;
    console.log('test');
    document.body.innerHTML = '<div>test</div><div id="tpl"></div><img src="" class="icon">';
    require('./test2.js');
    require('./test.css');
    var html = require('./test.tpl');
    var img = require('./warning.png');
    console.log('img:',img);
    document.querySelector('#tpl').innerHTML = html;
    document.querySelector('.icon').src = img;
})();