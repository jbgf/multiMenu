
/*创建表格 start*/
function tableMake(json){
      var table = $("#template01").val();
      var tNum;
      var $allTable,
          indexToD,
          $tableToD;
      var data = {
          allData:json,
          outer:".tableWrapper01",
          targetInput:".choosedItem",
          enableAddToOuter:1,      /*允许更新targetInput*/
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
          }
      }
          $("#addSample")
              .on("click",function(){
                  $allTable = $(".tableSection table");
                  tableBuild(table,data);
              })
              .click()

      function tableBuild(tableEle,data){
              tNum = $allTable.length + 1;
          var title = "样品" + (tNum);
              $(tableEle).css("opacity",0).appendTo($(".tableSection"))
                         .animate({"opacity":1},function(){
                              var box = $(this).find(".chooseZone");
                              // 调用jquery.multiMenu.js 插件
                                  box.multiMenu(data);
                          })
                         .find(".titleName").text(title).end()
                         .find(":input").each(function(i,e){
                            var name = $(e).attr("name");
                                $(e).attr("name",'sample['+tNum+']'+name)
                         }).end()
                         .find(".fa-trash-o").on("click",function(){
                            tNum > 1 
                            ?(
                              $allTable = $(".tableSection table"),
                              $tableToD = $(this).parents("table"),
                              indexToD = $allTable.index($tableToD),
                              updateTable($allTable,indexToD),
                              $tableToD.parents(".tableWrapper01").animate({"opacity":0,"height":"toggle"},function(){
                                    $(this).find(".chooseZone").off();
                                    $(this).remove();
                                })
                              )
                            :alert('请至少填写一个样品');
                         });

      }

      function updateTable($tables,index){
          /*var $tableToChange = $tables.filter(':gt('+index+')');*/
            var reg = /\[(\d+)\]/;
              tNum -=1;
              $tables.each(function(i,e){
                
                if(i>index){

                    $(e).find(".titleName").text("样品" + i ).end()
                        .find(":input").each(function(input_index,input){
                          
                          var name = $(input).attr("name");
                          var num = reg.exec(name)[1];
                              name = (name.replace(reg,'['+(num-1)+']'));
                              $(input).attr("name",name)
                        })
                }
              })
      }

}
/*创建表格 end*/





