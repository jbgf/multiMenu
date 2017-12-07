jquery.multiMenu.js
===
这是一个基于工作项目编写的jquery多层级菜单插件
其中还引入了jsel插件扩展搜索功能，
样式部分使用sass编写
插件配置
    allData:json,<br>
    outer:".tableWrapper01",<br>
    enableAddToOuter:1,      /*允许更新targetInput*/<br>
    targetInput:".choosedItem",<br>
    uniqueEnable:true,<br>
    uniqueTest:["id","mod"],  /*唯一性验证方式为 id&&mod */<br>
    enableKeyWordSearch:true,<br>
    searchInput:".searchInputText",<br>
    searchBtn:".search",       /*搜索按钮selector*/<br>
    customizeEnable:true,      /*允许个性化定制*/<br>
    customize:{<br>
        check_pack:true,<br>
        cpcss:"border-bottom:1px solid #d3ecf9",<br>
        content:true<br>
    }，<br>
    success:function(){}<br>
