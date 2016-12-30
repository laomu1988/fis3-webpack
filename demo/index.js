(function () {
    require('index.css');
    var a = 1;
    var b = 2;
    console.log('test');
    document.body.innerHTML = '<div>test</div><div id="tpl"></div>';
    require('./test2.js');
    require('./test.css');
    var html = require('./test.tpl');
    document.querySelector('#tpl').innerHTML = html;
})();