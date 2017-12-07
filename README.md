jquery.multiMenu.js
===
>
这是一个基于工作项目编写的jquery多层级菜单插件
其中还引入了jsel插件扩展搜索功能，
样式部分使用sass编写
插件配置
---
    allData:json,
    outer:".tableWrapper01",
    enableAddToOuter:1,      /*允许更新targetInput*/
    targetInput:".choosedItem",
    uniqueEnable:true,
    uniqueTest:["id","mod"],  /*唯一性验证方式为 id&&mod */
    enableKeyWordSearch:true,
    searchInput:".searchInputText",
    searchBtn:".search",       /*搜索按钮selector*/
    customizeEnable:true,      /*允许个性化定制*/
    customize:{
        check_pack:true,
        cpcss:"border-bottom:1px solid #d3ecf9",
        content:true
    }，
    success:function(){}
