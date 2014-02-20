/**
 * THIS PLUGIN'S GOAL IS TO SOLVE THE LARGE MOUNT OF DATA RENDERING IN TABLE
 * WHEN YOU SCROLL TO THE TABLE BOTTOM, THE NEXT TABLE ROW DATA BLOCK RENDERED
 * USAGE:
 *   LazyRenderTable(jTable,config).start()
 * @author David Wang
 * @email davidwang2006@outlook.com
 * @date 2014-2-20 23:01:11
 * Created by David on 14-2-20.
 */

(function($){
    'use strict';

    /**
     *
     * @param jTable
     * @param config {
     *    url:xxx,
     *    rowGenerator: fn,
     *    paramsGenerator: fn | Object,[*]
     *    start : Number,   [*] //开始行索引，从0开始，即在某行后开始添加新的
     *    statisticsCb: fn, [*] //用于统计
     *    emptyRowGenerator: fn, [*] //无数据时回调的
     *    onceRenderCount: Number, [*] //一次渲染多少行
     * }
     * @returns {LazyRenderTable}
     * @constructor
     */
    function LazyRenderTable(jTable,config){

        if(!(this instanceof LazyRenderTable))
            return new LazyRenderTable(jTable,config);

        if(jTable.data('lazy-render'))
            return jTable.data('lazy-render');

        config = config || {};

        if(!config.url){//url for ajax post
            console.error('Please specify the url parameter to config object');}
        if(!config.rowGenerator){//for generator rows
            console.error('Please specify the rowGenerator parameter to config object');}
        config.start = config.start || 0;
        config.onceRenderCount = config.onceRenderCount || 10;
        config.paramsGenerator = config.paramsGenerator || {};

        this.jTable = jTable;
        jTable.data('lazy-render',this);
        jTable.start = _delegate(this.start,this);
        this.config = config;


        this.data = [];//all data
        this.rowsAdded = [];//store rows added
        this.dataCursor = 0;//current data index

        $(document).scroll(_delegate(this._judgeContinueNeeded,this));
        $(window).resize(_delegate(this._judgeContinueNeeded,this));

        return this;
    }

    function _delegate(fn,target){
        var args = Array.prototype.slice.call(arguments,2);
        return function(){
            fn.apply(target,args);
        };
    }

    /**
     * reset all modified variables
     */
    LazyRenderTable.prototype.reset = function(){
        this.data.length = 0;
        this.rowsAdded.forEach(function(jRow){jRow.remove();});//delete all added rows
        this.dataCursor = 0;
        this.currentRow = this.jTable.find('tr').eq(this.config.start);
        return this;
    };

    /**
     * this method is called by the trigger button
     */
    LazyRenderTable.prototype.start = function(){
        this.reset();//
        var config = this.config;
        var render = this;
        $.post(config.url,(typeof config.paramsGenerator == 'function' ? config.paramsGenerator() : config.paramsGenerator),function(data){
            render.data = data;
            console.log('data.length ' ,data.length);
            config.statisticsCb && config.statisticsCb(data);
            if(data.length == 0)
                config.emptyRowGenerator && render.rowsAdded.push(config.emptyRowGenerator().insertAfter(render.currentRow));
            else
                render._next();
        }).fail(render.errorHandler);
        return this;
    };

    /**
     * render next
     * @private
     */
    LazyRenderTable.prototype._next = function(){
        var beginCursor = this.dataCursor;
        for(var i = beginCursor; i < Math.min(this.data.length,beginCursor+this.config.onceRenderCount); i++){
            this.rowsAdded.push(
                this.currentRow = this.config.rowGenerator(this.data[i],i).insertAfter(this.currentRow)
            );
            this.dataCursor++;
        }
        this._judgeContinueNeeded();
        return this;
    };

    /**
     * 判断是否要继续渲染
     * @private
     */
    LazyRenderTable.prototype._judgeContinueNeeded = function(){
        var render = this;
        var jTable = this.jTable;
        if(render.dataCursor + 1 < render.data.length/*还有数据没有渲染完毕*/
            && (jTable.offset().top + jTable.height() < $(document).scrollTop() + $(window).height()) /*并且表格的最后一行可视*/){
            render._next();
        }
        return this;
    };

    LazyRenderTable.prototype.errorHandler = function(err){
        console.warn(err);
        alert('服务器异常！请联系管理员!');
    };

    $.fn.extend({
        lazyRenderTable: function(config){
            LazyRenderTable(this,config);
            return this;
        }
    });

    define && define(function(){
        return LazyRenderTable;
    });

    return LazyRenderTable;

})(window.jQuery);
