# 让fis3像webpack一样打包

### 项目目标
* 兼容默认require写法
    - require css,less
    - require tpl,html,txt
    - require js
* 通用压缩方案: fis3-optimizer-minify


### 使用
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


### TODO
* [x] 增加依赖文件
* [x] css文件依赖根据文件moduleId和文件类型增加define命名空间
* [x] 判断tpl等文件是否被依赖,假如被依赖则自动加入生成文件
* [x] tpl根据文件类型判断而不是扩展名判断
* [ ] tpl压缩后是否可以正常使用
* [ ] style引入和require引入的css文件顺序
* [ ] 文件变更后是否可以正常输出(-w参数)



### fis3常用打包规则
* verbose 可以查看详细输出