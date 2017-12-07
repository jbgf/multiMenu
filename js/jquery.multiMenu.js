+function ($) {
    'use strict';
    // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
    // ============================================================

    function transitionEnd() {
        var el = document.createElement('bootstrap')

        var transEndEventNames = {
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'oTransitionEnd otransitionend',
            transition: 'transitionend'
        }

        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return {end: transEndEventNames[name]}
            }
        }

        return false // explicit for ie8 (  ._.)
    }

    // http://blog.alexmaccaw.com/css-transitions
    $.fn.emulateTransitionEnd = function (duration) {
        var called = false
        var $el = this
        $(this).one('bsTransitionEnd', function () {
            called = true
        })
        var callback = function () {
            if (!called) $($el).trigger($.support.transition.end)
        }
        setTimeout(callback, duration)
        return this
    }

    $(function () {
        $.support.transition = transitionEnd()

        if (!$.support.transition) return

        $.event.special.bsTransitionEnd = {
            bindType: $.support.transition.end,
            delegateType: $.support.transition.end,
            handle: function (e) {
                if ($(e.target).is(this)) return e.handleObj.handler.apply(this, arguments)
            }
        }
    })

}(jQuery);
// jquery.modalBox
+function ($) {
    'use strict';

    // modalBox CLASS DEFINITION
    // ======================

    var modalBox = function (element, options) {
        this.options = options
        this.$body = $(document.body)
        this.$element = $(element)
        this.$dialog = this.$element.find('.modalBox-dialog')
        this.$backdrop = null
        this.isShown = null
        this.originalBodyPad = null
        this.scrollbarWidth = 0
        this.ignoreBackdropClick = false

        if (this.options.remote) {
            this.$element
                .find('.modalBox-content')
                .load(this.options.remote, $.proxy(function (e) {
                    this.$element.trigger('loaded.bs.modalBox')
                }, this))
        }
    }

    modalBox.VERSION = '3.3.6'

    modalBox.TRANSITION_DURATION = 300
    modalBox.BACKDROP_TRANSITION_DURATION = 150

    modalBox.DEFAULTS = {
        backdrop: true,
        keyboard: true,
        show: true
    }

    modalBox.prototype.toggle = function (_relatedTarget) {
        return this.isShown ? this.hide() : this.show(_relatedTarget)
    }

    modalBox.prototype.show = function (_relatedTarget) {
        var that = this
        var e = $.Event('show.bs.modalBox', {relatedTarget: _relatedTarget})

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        this.isShown = true

        this.checkScrollbar()
        this.setScrollbar()
        this.$body.addClass('modalBox-open')

        this.escape()
        this.resize()

        this.$element.on('click.dismiss.bs.modalBox', '[data-dismiss="modalBox"]', $.proxy(this.hide, this))

        this.$dialog.on('mousedown.dismiss.bs.modalBox', function () {
            that.$element.one('mouseup.dismiss.bs.modalBox', function (e) {
                if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
            })
        })

        this.backdrop(function () {
            var transition = $.support.transition && that.$element.hasClass('fade')

            if (!that.$element.parent().length) {
                that.$element.appendTo(that.$body) // don't move modalBoxs dom position
            }

            that.$element
                .show()
                .scrollTop(0)

            that.adjustDialog()

            if (transition) {
                that.$element[0].offsetWidth // force reflow
            }

            that.$element.addClass('in')

            that.enforceFocus()

            var e = $.Event('shown.bs.modalBox', {relatedTarget: _relatedTarget})

            /*modalBox-dialog*/
            that.centerDialog();
            transition ?
                that.$dialog // wait for modalBox to slide in
                    .one('bsTransitionEnd', function () {
                        that.$element.trigger('focus').trigger(e)
                    })
                    .emulateTransitionEnd(modalBox.TRANSITION_DURATION) :
                that.$element.trigger('focus').trigger(e)
        })
    }

    modalBox.prototype.centerDialog = function (e) {
        var that = this;
        var m_dialog = that.$dialog;
        var offsetTop = this.options.offsetTop || 0;

        m_dialog.css({
            "position": "absolute",
            "margin": "0px",
            "top": function () {
                return (that.$element.height() - offsetTop - m_dialog.height()) / 2 + "px";
            },
            "left": function () {
                return (that.$element.width() - m_dialog.width()) / 2 + "px";
            }
        })
    }

    modalBox.prototype.hide = function (e) {
        if (e) e.preventDefault()

        e = $.Event('hide.bs.modalBox')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.escape()
        this.resize()

        $(document).off('focusin.bs.modalBox')

        this.$element
            .removeClass('in')
            .off('click.dismiss.bs.modalBox')
            .off('mouseup.dismiss.bs.modalBox')

        this.$dialog.off('mousedown.dismiss.bs.modalBox')

        $.support.transition && this.$element.hasClass('fade') ?
            this.$element
                .one('bsTransitionEnd', $.proxy(this.hidemodalBox, this))
                .emulateTransitionEnd(modalBox.TRANSITION_DURATION) :
            this.hidemodalBox()
    }

    modalBox.prototype.enforceFocus = function () {
        $(document)
            .off('focusin.bs.modalBox') // guard against infinite focus loop
            .on('focusin.bs.modalBox', $.proxy(function (e) {
                if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
                    this.$element.trigger('focus')
                }
            }, this))
    }

    modalBox.prototype.escape = function () {
        if (this.isShown && this.options.keyboard) {
            this.$element.on('keydown.dismiss.bs.modalBox', $.proxy(function (e) {
                e.which == 27 && this.hide()
            }, this))
        } else if (!this.isShown) {
            this.$element.off('keydown.dismiss.bs.modalBox')
        }
    }

    modalBox.prototype.resize = function () {
        if (this.isShown) {
            $(window).on('resize.bs.modalBox', $.proxy(this.handleUpdate, this))
        } else {
            $(window).off('resize.bs.modalBox')
        }
    }

    modalBox.prototype.hidemodalBox = function () {
        var that = this
        this.$element.hide()
        this.backdrop(function () {
            that.$body.removeClass('modalBox-open')
            that.resetAdjustments()
            that.resetScrollbar()
            that.$element.trigger('hidden.bs.modalBox')
        })
    }

    modalBox.prototype.removeBackdrop = function () {
        this.$backdrop && this.$backdrop.remove()
        this.$backdrop = null
    }

    modalBox.prototype.backdrop = function (callback) {
        var that = this
        var animate = this.$element.hasClass('fade') ? 'fade' : ''

        if (this.isShown && this.options.backdrop) {
            var doAnimate = $.support.transition && animate

            this.$backdrop = $(document.createElement('div'))
                .addClass('modalBox-backdrop ' + animate)
                .appendTo(this.$body)

            this.$element.on('click.dismiss.bs.modalBox', $.proxy(function (e) {
                if (this.ignoreBackdropClick) {
                    this.ignoreBackdropClick = false
                    return
                }
                if (e.target !== e.currentTarget) return
                this.options.backdrop == 'static'
                    ? this.$element[0].focus()
                    : this.hide()
            }, this))

            if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

            this.$backdrop.addClass('in')

            if (!callback) return

            doAnimate ?
                this.$backdrop
                    .one('bsTransitionEnd', callback)
                    .emulateTransitionEnd(modalBox.BACKDROP_TRANSITION_DURATION) :
                callback()

        } else if (!this.isShown && this.$backdrop) {
            this.$backdrop.removeClass('in')

            var callbackRemove = function () {
                that.removeBackdrop()
                callback && callback()
            }
            $.support.transition && this.$element.hasClass('fade') ?
                this.$backdrop
                    .one('bsTransitionEnd', callbackRemove)
                    .emulateTransitionEnd(modalBox.BACKDROP_TRANSITION_DURATION) :
                callbackRemove()

        } else if (callback) {
            callback()
        }
    }

    // these following methods are used to handle overflowing modalBoxs

    modalBox.prototype.handleUpdate = function () {
        this.adjustDialog()
    }

    modalBox.prototype.adjustDialog = function () {
        var modalBoxIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

        this.$element.css({
            paddingLeft: !this.bodyIsOverflowing && modalBoxIsOverflowing ? this.scrollbarWidth : '',
            paddingRight: this.bodyIsOverflowing && !modalBoxIsOverflowing ? this.scrollbarWidth : ''
        })
    }

    modalBox.prototype.resetAdjustments = function () {
        this.$element.css({
            paddingLeft: '',
            paddingRight: ''
        })
    }

    modalBox.prototype.checkScrollbar = function () {
        var fullWindowWidth = window.innerWidth
        if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
            var documentElementRect = document.documentElement.getBoundingClientRect()
            fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
        }
        this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
        this.scrollbarWidth = this.measureScrollbar()
    }

    modalBox.prototype.setScrollbar = function () {
        var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
        this.originalBodyPad = document.body.style.paddingRight || ''
        if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
    }

    modalBox.prototype.resetScrollbar = function () {
        this.$body.css('padding-right', this.originalBodyPad)
    }

    modalBox.prototype.measureScrollbar = function () { // thx walsh
        var scrollDiv = document.createElement('div')
        scrollDiv.className = 'modalBox-scrollbar-measure'
        this.$body.append(scrollDiv)
        var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
        this.$body[0].removeChild(scrollDiv)
        return scrollbarWidth
    }


    // modalBox PLUGIN DEFINITION
    // =======================

    function Plugin(option, _relatedTarget) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.modalBox')
            var options = $.extend({}, modalBox.DEFAULTS, $this.data(), typeof option == 'object' && option)

            if (!data) $this.data('bs.modalBox', (data = new modalBox(this, options)))
            if (typeof option == 'string') data[option](_relatedTarget)
            else if (options.show) data.show(_relatedTarget)
        })
    }

    var old = $.fn.modalBox

    $.fn.modalBox = Plugin
    $.fn.modalBox.Constructor = modalBox


    // modalBox NO CONFLICT
    // =================

    $.fn.modalBox.noConflict = function () {
        $.fn.modalBox = old
        return this
    }


    // modalBox DATA-API
    // ==============

    $(document).on('click.bs.modalBox.data-api', '[data-toggle="modalBox"]', function (e) {
        var $this = $(this)
        var href = $this.attr('href')
        var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
        var option = $target.data('bs.modalBox') ? 'toggle' : $.extend({remote: !/#/.test(href) && href}, $target.data(), $this.data())

        if ($this.is('a')) e.preventDefault()

        $target.one('show.bs.modalBox', function (showEvent) {
            if (showEvent.isDefaultPrevented()) return // only register focus restorer if modalBox will actually get shown
            $target.one('hidden.bs.modalBox', function () {
                $this.is(':visible') && $this.trigger('focus')
            })
        })
        Plugin.call($target, option, this)
    })

}(jQuery);
// jquery.multiMenu
+function ($) {
    'use strict';

    function multiMenu(element, options) {
        this.$body = $(document.body)
        this.$element = $(element)
        this.options = $.extend({}, multiMenu.DEFAULTS, options)
        this.$wrapper = this.$element.parents(".modalBox");
        /*弹窗*/
        this.searchBtn = this.$wrapper.find(this.options.searchBtn);
        /*搜索按钮*/
        this.searchInput = this.$wrapper.find(this.options.searchInput);
        /*搜索输入框*/
        this.$chooseZone = this.$wrapper.find(".chooseZone");
        this.tempSnapShot = {};
        this.outer = this.$element.parents(this.options.outer);
        this.allData = this.deepCopy(this.options.allData);//使用深拷贝否则数据被修改，用于下一个实例
        this.targetInput = this.outer.find(this.options.targetInput);

        this.enableAddToOuter = this.options.enableAddToOuter;
        this.historyStack = window['historyStack'] ? window['historyStack'] : window['historyStack'] = [];
        this.historyTemp_stack = [];
        this.historyTrigger = "[data-history]";
        this.historyZone = this.outer.find(this.historyTrigger);

        this.choosed_arr = [];
        /*已选中的item组成的array*/
        this.modalTrigger = this.options.modalTrigger

        this.tempResultStorage = [];

        /*options */
        this.mainClass = this.options.class;
        this.mcClass = this.options.mcClass;
        this.activeClass = this.options.activeClass;

        /*定制个性化*/
        this.customizeEnable = this.options.customizeEnable;
        this.customize = this.options.customize;

        /*唯一性标示*/
        this.uniqueEnable = this.options.uniqueEnable;
        this.unique = this.options.uniqueTest;
        this.unique_Arr = {a: [], b: []};


        this.ini(this.allData);
        /*初始化构建*/
        this.sure();
        /*确定选择*/
        this.options.enableKeyWordSearch && this.iniSearch();
        /*初始化搜索*/
        this.iniHistory();
        /*初始化历史记录*/
    }

    multiMenu.VERSION = '1.0'

    multiMenu.DEFAULTS = {
        class: "multi-li",
        mcClass: "mc-li",
        activeClass: "active",
        uniqueTest: ['id'],
        modalTrigger: '.addItemBtn',
        enableKeyWordSearch: false         /*默认不开启关键词搜索*/
    }

    multiMenu.prototype.iniContainer = function () {
        var that = this;
        /*新建多选待选区*/
        this.$multiChooseZone =
            $("<div class='multiChooseZone'></div>").appendTo(that.$element);
        this.choose();
        /*从待选区列表中选择事件：包括列表和待选区*/
    }

    multiMenu.prototype.ini = function (data) {
        var that = this;
        var hasCp = that.customizeEnable && that.customize.check_pack && that.customize;
        this.iniContainer();
        /*初始化容器*/
        this.iniData(data);
        /*初始化数据*/
        this.createlevel(hasCp);
        /*创建可选列表*/
        this.operate_stack(0, "root");
        this.modalBox(that.modalTrigger);
    }

    multiMenu.prototype.modalBox = function (trigger) {
        $(document).on("click", trigger, function () {
            var modalBox = $(this).parents("table").next(".modalBox01");
            modalBox.modalBox();
        });
    }

    multiMenu.prototype.iniData = function (data) {
        var that = this;
        this.stack = [];
        /*记录当前节点位置的栈*/
        this.curObj = data;
        /*当前所在的数据节点*/
        this.arrToChoose = this.curObj.sub;
        /*当前待选的数组*/
    }

    multiMenu.prototype.iniSearch = function () {
        var that = this;
        var dom = jsel(that.allData);
        /*jsel 插件：使用xpath语法查询*/
        var $clearbtn = that.searchInput.parent('div').find(".clearInput");
        var onSearch = false;
        /*是否正在搜索状态*/
        var result, notResult;
        that.searchBtn.on("click", function () {
            var searchText = that.searchInput.val();
            if (searchText == '') {
                layer.msg('查询无结果', {

                    time: 1000 //
                }, function () {

                });
                return false;
            }

            /*重置notResult*/
            resetNotResult();


            /*返回一个数组*/
            /*完全匹配 :"//*[@keyword='"+searchText+"']"
              模糊匹配：contains()方法
              jsel插件將json的key 轉化，相當於xml中的屬性
              Q:限定後代滿足一定條件作爲篩選當前節點的條件？
                折衷辦法：給選定的選項的兄弟元素打上標記，構建列表時加以隱藏  @1。

              搜索内容：A:搜索keyword，B:拥有keyword的name,C：最後一級的name
              优先级：C > A = B;
              */

            /*判断最後一級選項搜索，并作数据处理*/
            var items_xpath = "//*[@final]/descendant::*[contains(@name,'" + searchText + "')]";
            result = dom.selectAll(items_xpath);
            /*判断是否有搜索到*/
            if (result.length > 0) {
                //var not_xpath = items_xpath+"[1]/preceding-sibling::*|" + items_xpath + "[last()]/following-sibling::*";
                var not_xpath = "//*[@final]/descendant::*[not(contains(@name,'" + searchText + "')) and @name]";
                notResult = dom.selectAll(not_xpath);       //選中選項的兄弟；
                if (notResult.length > 0) {
                    $.each(notResult, function (i, e) {
                        e['itemSearch'] = false;
                    })
                } else {
                    notResult = false;
                }
            }
            /*搜索keyword*/
            var xpath = "//*[contains(@keyword,'" + searchText + "')]";
            /*搜索有拥有keyword属性的name*/
            xpath += "|//*[contains(@name,'" + searchText + "') and @keyword]";
            /*搜索最後一級的name的父级*/
            xpath += "|//*[@final]/descendant::*[contains(@name,'" + searchText + "')]/ancestor::*[@final]";

            result = dom.selectAll(xpath);

            /*获取搜索到的数据*/
            if (result.length > 0) {
                !that.tempSnapShot['snaped'] && that.snapShot();
                /*未记录快照时，记录快照*/
                that.$chooseZone.empty();
                layer.load(1, {
                    shade: [0.1, '#fff'], //0.1透明度的白色背景
                    end: function () {
                        /*初始化列表及数据*/
                        that.ini({sub: result});
                        onSearch = true;
                    },
                    time: 1000
                });

            } else {
                layer.msg('查询无结果', {

                    time: 1000 //
                }, function () {

                });
            }
        })
        that.searchInput.on("change", function () {
            if ($(this).val() != '') {
                $clearbtn.show();
            }
        })
        $clearbtn.on("click", function () {        /*清除输入按钮*/
            $(this).hide();
            that.searchInput.val('');

            if (onSearch) {
                that.resetSnapShot()
                /*恢复快照*/
                onSearch = false;

                /*重置notResult*/
                resetNotResult();

            }
        })

        function resetNotResult() {
            if (notResult && notResult.length > 0) {
                $.each(notResult, function (i, e) {
                    e['itemSearch'] = true;
                })
            }
        }
    }

    multiMenu.prototype.snapShot = function () {
        var that = this;
        var html = that.$chooseZone.html();
        that.tempSnapShot = {
            snaped: true,
            html: html,
            data: {stack: that.stack, curObj: that.curObj, arrToChoose: that.arrToChoose}
        };

    }

    multiMenu.prototype.resetSnapShot = function () {
        var that = this;
        var snap = that.tempSnapShot,
            data = snap.data;
        that.$chooseZone.html(snap.html);
        that.$multiChooseZone = that.$element.find(".multiChooseZone");
        /*重新更新多选待选区容器*/
        that.stack = data.stack;
        /*记录当前节点位置的栈*/
        that.curObj = data.curObj;
        /*当前所在的数据节点*/
        that.arrToChoose = data.arrToChoose;
        /*当前待选的数组*/

        that.resetMultiChooseZone();
        snap['snaped'] = false;
        /*记录状态为未设置快照*/
    }

    multiMenu.prototype.operate_stack = function (popNum, index) {
        var that = this;
        if (index != "root") {
            /*保存历史记录，通过每次点击的index来保存一条index chain用于定位*/
            popNum > 0 && that.historyTemp_stack.splice(-popNum, popNum);
            if (!that.hasSub()) {
                that.historyTemp_stack.splice(-1, 1);
            }
            that.historyTemp_stack.push(index);

            /*用栈来保存当前的位置*/
            popNum > 0 && that.stack.splice(-popNum, popNum);
            that.curObj = that.stack[that.stack.length - 1][index];

            if (that.hasSub()) {
                that.arrToChoose = that.curObj.sub;
                that.stack.push(that.arrToChoose);
            }

        } else {
            that.stack.push(that.arrToChoose);
        }
    }

    multiMenu.prototype.deepCopy = function (source) {
        var that = this;
        var result = {};
        for (var key in source) {
            result[key] = typeof source[key] === 'object' ? that.deepCopy(source[key]) : source[key];
        }
        return result;
    }


    multiMenu.prototype.choose = function () {
        var that = this;
        var index_li, index_ul;
        var num;

        /*不可以使用
        $(document).on("click.multiMenu",'.'+that.mainClass+'')
        导致多个实例绑定事件的触发
        */
        that.$chooseZone.off("click").on("click", "li", function () {

            if (that.hasSub() && $(this).hasClass(that.activeClass)) {
                return
            }
            var uls = that.$element.find("ul");
            var ul = $(this).parent("ul"), sameLevel;
            index_ul = uls.index(ul);
            index_li = ul.children("li").index($(this));

            num = that.getPopNum(ul, index_ul),
                sameLevel = num == 0;
            that.operate_stack(num, index_li);
            if (!sameLevel) {
                ul.nextAll("ul").remove();
                /*清空当前的数据*/
                that.$multiChooseZone.empty();
            }

            /*如果不是最后一级*/
            if (that.hasSub()) {
                /*如果不是倒二级*/
                /*1,2*/
                if (!that.isFinalLevel()) {

                    that.createlevel();
                } else {
                    /*如果是倒二级，则创建多选待选区*/
                    /*3*/
                    var hasContent = that.customizeEnable && that.customize.content && that.customize;

                    that.createMultiChoose(hasContent);
                }
            } else {
                /*如果是最后一级 mcClass为最后一级独有*/
                if ($(this).hasClass(that.mcClass)) {
                    var index = $(this).parents("ul").find('.' + that.mcClass + '').index($(this));
                    var item = that.curObj;

                    if (item['choosed']) {

                        var dindex = $(this).attr("data-cindex");
                        that.cancel(item, dindex);

                    } else if (item['tempChoosed']) {

                        that.tempResult(true, item, this);
                    } else {

                        that.tempResult(false, item, this);
                    }
                }
            }

            $(this).addClass(that.activeClass)
                .siblings('.' + that.mainClass + '').removeClass(that.activeClass);

        })
    }

    multiMenu.prototype.createlevel = function (hasCp) {
        var that = this;
        var string = "<ul class='multi-ul'>";
        var arr = that.arrToChoose;

        $.each(arr, function (i, e) {
            var style = "";
            if (hasCp && e['check_pack']) {
                style = hasCp.cpcss
            }

            string += '<li class=' + that.mainClass + ' style="' + style + '">' + e.name + '</li>'
        })
        string += "</ul>";
        that.$multiChooseZone.before(string);
        /*添加多层级选择列表*/

        /*!多选结果区!*/
        var length = that.$wrapper.find(".choosedZone ul").length;
        if (length == 0) {
            that.$wrapper.find(".choosedZone").append("<ul></ul>");
            that.$choosedZoneUl = that.$wrapper.find(".choosedZone ul");
        }
    }

    /*创建多选区*/
    multiMenu.prototype.createMultiChoose = function (hasContent) {
        var that = this;

        function isEmptyObject(obj) {
            for (var key in obj) {
                return false;
            }
            return true;
        }

        var string = $("<ul class='multi-choose-ul'></ul>");
        /*多选待选列表*/

        var arr = that.arrToChoose;
        /*当前待选的数组*/
        var contentStatus = 0;
        $.each(arr, function (i, e) {

            var cla = that.mcClass;
            var ca_index, ta_index, continueValidate,
                contentTips = hasContent && !isEmptyObject(e['content']) && e['content'];

            /*若开启唯一性标识符且不是自身
            （可以用没有被选中判断，即!e.choosed 且!e.tempChoosed来）*/

            if (that.uniqueEnable && !e.choosed && !e.tempChoosed) {
                continueValidate = that.uniqueValidate(e, 0);
                continueValidate = that.uniqueValidate(e, 1);
            }

            if (e.choosed) {             /*如果item有记录是选中的*/
                ca_index = e["cindex"];
                cla += " choosed";
            } else if (e.tempChoosed) {   /*如果item有记录是临时选中的*/
                ta_index = e['tindex'];
                cla += " choosed";

            } else {
                ca_index = false;
                ta_index = false;
            }

            /* @1：表示当前处于搜索状态，且此选项没选上，应予隐藏*/
            if (e.itemSearch == false) {
                cla += " hideIM";
            }

            /*如果需要提示套餐 信息*/

            if (contentTips) {
                cla += " hoverContentTips";
                contentStatus = 1;
                var ctstring = "";

                $.each(contentTips, function (i, e) {
                    var ctindex = parseInt(i) + 1;
                    ctstring += "<div >" + ctindex + "、" + e + "</div>";
                })

            }
            $('<li class="' + cla + '" data-cindex=' + ca_index + ' data-taindex=' + ta_index + ' >' + e.name + '</li>')
                .appendTo(string)
                .data("conthover", ctstring)
        })


        that.$multiChooseZone.append(string);
        if (contentStatus) {
            var hoverNodes = that.$multiChooseZone.find(".hoverContentTips");
            hoverNodes.each(function (i, e) {       /*鼠标经过展示信息*/
                var layerTips,
                    _content = $(e).data("conthover"),
                    size = that.getContentWidth(_content);
                $(e).mouseenter(function () {
                    layerTips = layer.tips(_content, e, {
                            tips: [2, '#3595CC'],
                            time: 0,
                            area: [size.width, size.height]

                        }
                    );
                }).mouseleave(function () {
                    setTimeout(function () {
                        layer.close(layerTips)
                    }, 500)
                })
            })
        }
    }

    multiMenu.prototype.getContentWidth = function (content) {
        var that = this;
        var sensor = $('<div></div>').css({display: 'none'}).html(content);
        $("body").append(sensor);
        var width = sensor.width(),
            height = sensor.height();
        sensor.remove();
        return {width: width, height: height};
    }

    /*临时处理程序：
      1、临时选中，临时取消；
      2、点击多选区最后一级时触发*/
    multiMenu.prototype.tempResult = function (flag, item, ele) {
        var that = this,
            $ele1,
            $ele2,
            ta_index,
            cli;

        flag ? getRidOf() : add();

        function getRidOf() {

            ta_index = $(ele).attr("data-taindex");
            $(ele).removeClass("choosed").removeAttr("data-taindex");
            $ele2 = that.$choosedZoneUl.find("li[data-taindex=" + ta_index + "]").remove();
            /*多选待选区事件*/
            that.update_indexAfterCancel(1, ta_index); //cancel之后更新taindex

            /*去除临时选择集合中的某项*/
            that.updateCoreData(3, false, ta_index, false);
            /*设置可识别状态为：临时取消*/
            that.set_recognitionState(1, item);
        }

        function add() {
            ta_index = that.tempResultStorage.length;
            /*多选结果区的构建*/
            cli = $("<li class='choosed_li' data-taindex=" + ta_index + ">" + item.name + "</li>");
            $(ele).addClass("choosed").attr({"data-taindex": ta_index});

            cli.appendTo(that.$choosedZoneUl).on("click", function () {
                /*多选结果区点击事件：临时选中*/

                if (item['tempChoosed']) {
                    ta_index = $(this).attr("data-taindex");
                    /*更新tempResultStorage $ele1,
                      由于采用的是每次删除再重新建立列表，
                      删除后会导致tempResultStorage存储的$ele1失效*/

                    $ele1 = that.$multiChooseZone.find("li[data-taindex=" + ta_index + "]");
                    $ele1.removeClass('choosed').removeAttr("data-taindex");
                    $ele2.remove();

                    that.update_indexAfterCancel(1, ta_index); //cancel之后更新taindex

                    /*设置可识别状态为：临时取消*/
                    that.set_recognitionState(1, item);
                    /*去除临时选择集合中的某项*/
                    that.updateCoreData(3, false, ta_index, false);
                }
            });

            $ele1 = that.$multiChooseZone.find("li[data-taindex=" + ta_index + "]");
            $ele2 = that.$choosedZoneUl.find("li[data-taindex=" + ta_index + "]");

            /*设置临时选中识别状态*/
            that.set_recognitionState(0, item, ta_index);

            /*临时选中的元素各项信息存储*/
            var uniqueString = that.getUniqueString(item);
            var tempOptions = {
                item: item,
                element: {ele1: $ele1, ele2: $ele2},
                historyTemp: that.historyTemp_stack.slice(0),
                uniqueString: uniqueString
            }
            /*添加临时数组*/
            that.updateCoreData(2, false, false, tempOptions);

        }
    }

    multiMenu.prototype.cancel = function (item, dindex) {
        var that = this;
        /*必须加上下文以区别多实例*/
        var multiToCancel = $(".multiChooseZone li[data-cindex=" + dindex + "]", that.wrapper);

        $(".choosedZone li[data-cindex=" + dindex + "]", that.wrapper).remove();

        multiToCancel.removeClass("choosed")
            .removeAttr("data-cindex");

        $(".outermulti-ul li[data-cindex=" + dindex + "]", that.outer).remove();

        that.update_indexAfterCancel(0, dindex); //cancel之后更新cindex

        that.set_recognitionState(3, item);   //设置数据data可识别状态
        that.updateCoreData(1, false, dindex); //更新核心数组

        that.updateTargetInput(that.choosed_arr);
    }

    multiMenu.prototype.update_indexAfterCancel = function (mode, indexToUpdate) {
        var that = this;
        var attr_str;
        if (mode == 0) {
            attr_str = "data-cindex";
        } else if (mode == 1) {
            attr_str = "data-taindex";
        }

        /*多选结果区*/
        $(".choosedZone li[" + attr_str + "]", that.wrapper).each(function (i, e) {
            var index = $(this).attr(attr_str);
            if (index > indexToUpdate) {
                $(this).attr(attr_str, index - 1);
            }
        });
        /*多选区*/

        $(".multiChooseZone li[" + attr_str + "]", that.wrapper).each(function (i, e) {
            var index = $(this).attr(attr_str);

            if (index > indexToUpdate) {

                $(this).attr(attr_str, index - 1);
            }

        });

        mode == 0 && $(".outermulti-ul li[" + attr_str + "]", that.outer).each(function (i, e) {
            var index = $(this).attr(attr_str);
            if (index > indexToUpdate) {
                $(this).attr(attr_str, index - 1);
            }
        });
    }


    /*唯一标识验证，
      通过唯一标识验证，检查当前传入的item是否是已经选中的或临时选中的，
      若是，则同时建立映射；
      1、choosed_arr unique_Arr['a'] 通过updateCoreData 建立顺序一一对应关系；
      2、tempResultStorage unique_Arr['b'] 通过updateCoreData 为顺序一一对应关系
      3、多选区构建时触发*/
    multiMenu.prototype.uniqueValidate = function (item, mode) {
        var that = this;
        var uniqueString = that.getUniqueString(item);
        var indexOfunique,
            choosedItem;

        if (!uniqueString) {
            return false
        }
        if (mode == 0) {
            indexOfunique = that.unique_Arr['a'].indexOf(uniqueString);
            if (indexOfunique != -1) {/*若存在该标识符组合*/
                choosedItem = that.choosed_arr[indexOfunique];
                /*设置可识别状态为：选中*/
                that.set_recognitionState(2, item, choosedItem['cindex'])

            }

        } else if (mode == 1) {
            indexOfunique = that.unique_Arr['b'].indexOf(uniqueString);
            if (indexOfunique != -1) {/*若存在该标识符组合*/
                choosedItem = that.tempResultStorage[indexOfunique]['item'];
                /*设置可识别状态为：临时选中*/
                that.set_recognitionState(0, item, choosedItem["tindex"])
            }
        }
        /*建立映射关系*/
        if (choosedItem) {
            item['map'] = choosedItem;
            choosedItem['map'] = item;
            return 'map';
        } else {
            return false;
        }
    }

    multiMenu.prototype.getUniqueString = function (item) {
        var stringArr = this.unique,
            uniqueString = '',
            length = stringArr.length;

        $.each(stringArr, function (i, e) {

            if (i == length - 1) {
                uniqueString += item[e];

                if (item[e] == undefined) {
                    uniqueString = false;
                    return false;
                }
            } else {
                uniqueString += item[e] + "&";
            }
        })

        return uniqueString;
    }

    multiMenu.prototype.isFinalLevel = function (index) {
        var that = this;
        var status;

        if ("final" in that.curObj) {
            status = true;
        } else {
            status = false;
        }
        return status;
    }

    multiMenu.prototype.getPopNum = function (ul, index_ul) {
        var that = this;
        var num = ( that.stack.length - 1 ) - index_ul;
        return num;
    }


    multiMenu.prototype.sure = function () {
        var that = this;
        var success = that.options.success;

        that.$wrapper.on("click", ".sampleBtn", function () {
            /*将临时保存结果循环添加*/

            $.each(that.tempResultStorage, function (i, e) {

                that.add.call(that, e.item, e.element, e.historyTemp);
            })

            if (that.choosed_arr.length > 0) {
                var arr = that.choosed_arr
                if (that.enableAddToOuter) {
                    that.updateTargetInput(arr);
                    that.addToOuterResult(arr);
                }
                /*执行回调函数*/
                if (success && typeof(success) == "function") {
                    $.proxy(success, that.$element[0])(arr, that);
                } else {
                }
            }
            that.resetTempResult(0);
            that.updateCoreData(4);
            that.$wrapper.find(".close").trigger("click");
        })
    }

    multiMenu.prototype.add = function (item, ele, historyTemp) {
        var that = this;
        var ca_index = that.choosed_arr.length, maptaIndex;
        var $ele1 = ele.ele1;
        var $ele2 = ele.ele2;
        if (item['map']) { /*有map对象且当前显示了，若未显示则构建时会有data-cindex*/
            maptaIndex = item['map']['tindex'];
            /*map 元素设置cindex，设置识别态为：选中*/
            var $ele3 = that.$multiChooseZone.find("li[data-taindex=" + maptaIndex + "]");
            $ele3.length > 0 && $ele3.attr({"data-cindex": ca_index})
                .removeAttr("data-taindex");

            that.set_recognitionState(2, item['map'], ca_index)

        }
        $ele1.attr({"data-cindex": ca_index}).removeAttr("data-taindex");
        $ele2.attr({"data-cindex": ca_index}).removeAttr("data-taindex").on("click", function () {
            /*添加取消事件,
              ca_index重新获取，否则可能由于之前的cancel导致cindex更新*/
            ca_index = $(this).attr("data-cindex")
            that.cancel(item, ca_index);

        });

        /*设置可识别状态:选中*/
        that.set_recognitionState(2, item, ca_index)
        /*设置可识别状态:临时取消*/
        that.set_recognitionState(1, item)

        /*将临时结果添加到历史数组*/

        /*记录历史*/
        that.recordHistory(item);

        that.updateCoreData(0, item);

    }

    multiMenu.prototype.recordHistory = function (item) {
        var that = this;
        if (that.historyStack.indexOf(item) == -1) {
            that.historyStack.push(item);
        }

    }

    multiMenu.prototype.chooseFromHistory = function () {
        var that = this;
        that.historyUl = that.historyUl.on("click", "li", function () {
            var ul_index = $(this).attr("data-order"), /*第几条历史纪录*/
                item = that.historyStack[ul_index];
            if (that.choosed_arr.indexOf(item) == -1) {
                that.addToMenuFromHistory(item, ul_index);
                that.updateTargetInput(that.choosed_arr);
            }
            ;

        })
    }

    multiMenu.prototype.addToMenuFromHistory = function (item, ul_index) {
        var that = this;

        //  添加到多选结果区

        /*若已经临时选中*/
        if (item['tempChoosed']) {
            $.each(that.tempResultStorage, function (i, e) {
                if (e['item'] == item) {
                    that.add.call(that, item, e.element, e.historyTemp);
                    /*去除临时选择集合中的某项*/
                    that.updateCoreData(3, false, i, false);
                }
            })
        } else {
            /*若未临时选中*/
            //添加item
            that.updateCoreData(0, item);

            var ca_index = that.choosed_arr.length - 1,
                cli = $("<li class='choosed_li' data-cindex=" + ca_index + ">" + item.name + "</li>");
            cli.appendTo(that.$choosedZoneUl).on("click", function () {
                ca_index = $(this).attr("data-cindex");
                that.cancel(item, ca_index);
            });

            that.set_recognitionState(2, item, ca_index)

            that.resetMultiChooseZone();

        }
        that.addToOuterResult()
    }
    multiMenu.prototype.resetMultiChooseZone = function () {
        var that = this;
        if (that.hasSub()) {     /*非最后一级*/
            /*设置可识别状态后，重新建立多选待选区*/
            if (that.isFinalLevel()) {   /*倒二级*/

                $.each(that.curObj['sub'], function (i, e) {
                    if (that.uniqueValidate(e, 0) == 'map') {
                    }
                })
                that.$multiChooseZone.empty();
                that.createMultiChoose();
            }

        } else {                    /*最后一级*/
            that.uniqueValidate(that.curObj, 0);
            that.$multiChooseZone.empty();
            that.createMultiChoose();
        }
    }
    multiMenu.prototype.iniHistory = function () {
        var that = this;
        var ul = "<ul class='multiMenu_history' style=''></ul>";
        that.background();
        that.historyUl = $(ul).appendTo(that.historyZone.css("position", "relative"));
        that.showHistory();
        that.chooseFromHistory();
    }


    /*重置临时存储结果*/
    multiMenu.prototype.resetTempResult = function (mode) {
        var that = this;

        $.each(that.tempResultStorage, function (i, e) {
            var element = e.element;
            var $ele1 = element.ele1;
            var $ele2 = element.ele2;
            $ele1.removeAttr("data-taindex");
            if (mode == 0) {
                $ele2.removeAttr("data-taindex")
            }
            ;
            if (mode == 1) {
                $ele1.removeClass("choosed")
                $ele2.remove();
            }
        })

    }


    multiMenu.prototype.background = function () {
        var that = this;
        that.$bg = $(document.createElement('div'))
            .css({
                position: "fixed",
                background: "rgba(0,0,0,0.5)",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                display: "none",
                cursor: "cell"
            })
            .appendTo(that.$body)
            .on("click", function (e) {
                if (e.target !== e.currentTarget) return

                that.$bg.hide();
                that.historyUl.hide();
            })
    }


    multiMenu.prototype.hasSub = function (index) {
        var that = this;
        var status;

        if ("sub" in that.curObj) {
            status = true;
        } else {
            status = false;
        }
        return status;
    }


    /*更新核心数据 choosed_arr
                    unique_Arr
                    整个json：choosed等
      1、choosed_arr unique_Arr['a'] 为顺序一一对应关系；
      2、tempResultStorage unique_Arr['b'] 为顺序一一对应关系
                          */
    multiMenu.prototype.updateCoreData = function (mode, item, indexToDelete, tempOptions) {
        var that = this;
        if (mode == 0) {
            /*添加*/
            var uniqueChar = that.getUniqueString(item);
            that.choosed_arr.push(item);
            that.unique_Arr['a'].push(uniqueChar)
        } else if (mode == 1) {
            /*删除*/
            that.choosed_arr.splice(indexToDelete, 1);
            $.each(that.choosed_arr, function (i, e) {
                if (i >= indexToDelete) {
                    e['cindex']--;
                }
            })
            that.unique_Arr['a'].splice(indexToDelete, 1);
        } else if (mode == 2) {
            /*临时增加*/
            that.tempResultStorage.push(tempOptions);
            that.unique_Arr['b'].push(tempOptions.uniqueString)
        } else if (mode == 3) {
            /*临时删除*/
            that.tempResultStorage.splice(indexToDelete, 1);
            $.each(that.tempResultStorage, function (i, e) {
                if (i >= indexToDelete) {
                    e['item']['tindex']--;
                }
            })

            that.unique_Arr['b'].splice(indexToDelete, 1);
        } else if (mode == 4) {
            that.tempResultStorage.length = 0;
            that.unique_Arr['b'].length = 0;
        }
    }

    multiMenu.prototype.addToOuterResult = function () {
        var that = this;
        var arr = that.choosed_arr;

        if (that.enableAddToOuter != 1) return;
        var ul = $("<ul class='outermulti-ul'/>");
        for (var i = 0; i < arr.length; i++) {
            if (arr[i]) {
                /*var itmeName = arr[i].names || arr[i].name;     优先输出names*/
                var itmeName = arr[i].name || arr[i].names;
                var li = $('<li class="choosed_li" data-cindex=' + i + '>' + itmeName + '</li>');
                li.appendTo(ul).on("click", function () {
                    var index = $(this).attr("data-cindex"),
                        item = arr[index];

                    that.cancel(item, index);

                })
            }
        }
        that.targetInput.data("ca", arr)
            .prev("ul").remove().end()
            .before(ul);
    }


    /* 设置数据data可识别状态*/
    multiMenu.prototype.set_recognitionState = function (mode, item, index) {
        var that = this;
        if (mode == 0) {
            /*临时选中*/
            item['tempChoosed'] = true;
            item['tindex'] = index;
        } else if (mode == 1) {
            /*临时取消*/
            item['tempChoosed'] = false;
            item['tindex'] = false;
            item['map'] && item['map']["tempChoosed"] && (item['map']["tempChoosed"] = false);
        } else if (mode == 2) {
            /*选中*/
            item["choosed"] = true;
            item['cindex'] = index;
        } else if (mode == 3) {
            /*取消*/
            item["choosed"] = false;
            item['cindex'] = false;
            item['map'] && item['map']["choosed"] && (item['map']["choosed"] = false);
            /*若存在映射则一起设为false*/

        }
    }
    multiMenu.prototype.updateTargetInput = function (arr) {
        var that = this,
            input = that.targetInput;

        updateInput(input, arr);

        function updateInput(targetInput, arr) {
            var string = "";
            for (var i = 0; i < arr.length; i++) {
                if (arr[i]) {
                    string += arr[i].id + '&' + arr[i].mod + ',';
                }
            }
            string = string.substring(0, string.length - 1);
            targetInput.val(string);
        }
    }


    multiMenu.prototype.showHistory = function () {
        var that = this;

        that.outer.on("click", that.historyTrigger, function (e) {
            var historyarr = that.historyStack,
                ul = that.historyUl,
                ul_length = ul.find("li").length;

            if (historyarr && historyarr.length > 0) {
                that.$bg.show();
                that.historyUl.show();
            }
            if (historyarr.length > ul_length) {
                var newarr = historyarr.slice(ul_length);
                var lis = "";
                for (var i = 0; i < newarr.length; i++) {
                    var io = i + ul_length;
                    lis += "<li style='' data-order=" + (io) + ">" + newarr[i]["name"] + "</li>";
                }

                ul.append(lis);
            }
        })

    }

    // multiMenu PLUGIN DEFINITION
    // ===========================

    function Plugin(option) {
        return this.each(function () {
            var $this = $(this)
            var data = $this.data('bs.multiMenu')
            var options = typeof option == 'object' && option

            if (!data) $this.data('bs.multiMenu', (data = new multiMenu(this, options)))

            if (typeof option == 'string') data[option]()
        })
    }

    var old = $.fn.multiMenu

    $.fn.multiMenu = Plugin
    $.fn.multiMenu.Constructor = multiMenu


    // multiMenu NO CONFLICT
    // =====================

    $.fn.multiMenu.noConflict = function () {
        $.fn.multiMenu = old
        return this
    }


}(jQuery);



