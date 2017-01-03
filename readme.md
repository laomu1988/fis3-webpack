# 让fis3像webpack一样打包

## 项目目标
* js文件中通过require引入其他文件
    - require css,less
    - require tpl,html,txt
    - require js
* 兼容压缩方案: fis3-optimizer-minify
* 兼容relative配置

## 使用
1. 安装
```
npm install --save-dev fis3-webpack
```
2. 在项目中配置fis-conf.js
```
require('fis3-webpack');
// 设置项目入口文件
fis.set('project.files', ['/demo/index.html', 'map.json']);
```
3. 执行命令打包
```
fis3 release -d output
```


## 自定义配置
```
var fs = require('fs');
var webpack = require('fis3-webpack');
// 修改依赖的js模块规范文件(amd,cmd等)
webpack({
    mod: fs.readFileSync(__dirname + '/js/require.js'), // 定义define和require规则的文件,例如可以使用require.js
    append: 'console.log("append script");'             // 增加其他js处理代码
});


// 增加其他的require文件规则,例如引入tpl
fis.on('fis3-webpack',function(file) {
    if(file.ext === '.tpl') {
        var content = file._content || '';
        content = content.replace(/([\'\"])/g, '\\$1').replace(/\n/g,'\\n');
        // file.webpacked表示文件处理后的内容
        file.webpacked = 'define("' + file.moduleId + '",function(r,e,m){m.exports = "' + content + '"})';
    }
});
```


## 注意问题
* 使用该插件后,将默认使用common.js格式,所有js文件都将被define(moduleId)模式包裹(除了默认定义模块).
    - html文件引入js时,需要增加script标签,然后require('js文件路径') 即可
    - 假如某文件不需要使用define包裹, 需在fis-conf.js中配置fis.match('文件匹配规则',{isMod: false}



## 原理
1. 监听fis3的release:start事件,生成依赖文件fis3-webpack-mod.js, 依赖文件初始化时包含配置中的mod(定义define和require)和append,并触发fis3-webpack:start事件
2. 监听compile:end事件(每个文件处理完成后触发), 触发web-pack事件(参数为当前处理的文件), 假如修改了文件属性webpacked值为string类型,则不会使用默认的处理程序再次处理
3. 监听postpackager事件(打包阶段调用),触发fis3-webpack:end事件,参数是fis3-webpack-mod.js文件



### TODO
* [x] 增加依赖文件
* [x] css文件依赖根据文件moduleId和文件类型增加define命名空间
* [x] 判断tpl等文件是否被依赖,假如被依赖则自动加入生成文件
* [x] tpl根据文件类型判断而不是扩展名判断
* [x] tpl压缩后是否可以正常使用
* [x] style引入和require引入的css文件顺序
* [x] 文件变更后是否可以正常输出(-w参数)
* [x] 引入图片
* [x] packTo合并文件


### fis3常用打包规则
* verbose 可以查看详细输出