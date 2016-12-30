# fis3常用公共方法


### 项目目标
* 通用压缩方案: fis3-optimizer-minify
* 兼容默认require写法
    - require css
    - require tpl,html,txt
    - require js


### 解决步骤
* 增加依赖文件
* 修改依赖文件,增加css同名id
* 判断tpl等文件是否被依赖,假如被依赖则加入到源文件列表
* 文件变更后是否可以正常输出(-w参数)



### fis
* verbose 可以查看详细输出