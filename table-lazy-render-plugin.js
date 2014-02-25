/**
 * THIS PLUGIN'S GOAL IS TO SOLVE THE LARGE MOUNT OF DATA RENDERING IN TABLE
 * WHEN YOU SCROLL TO THE TABLE BOTTOM, THE NEXT TABLE ROW DATA BLOCK RENDERED
 * USAGE:
 *   LazyRenderTable(jTable,config).start()
 *   
 * 注意针对导出excel的时候table表头中有td前划行的，注意设置正确的ss:Index属性
 * @author David Wang
 * @email davidwang2006@outlook.com
 * @date 2014-2-20 23:01:11
 * Created by David on 14-2-20.
 */

(function($){
    'use strict';

    /**
     * 使用方法
     * LazyRenderTable(jTable,config)或jTable.lazyRenderTable(config)初始化后
     * 可调用jTable.trigger('start-loading')加载数据
     * 调用jTable.trigger('export-excel')导出excel结果
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
     *    dataPreFilter: func, [*]//数据刚由ajax返回时，预处理器 data = dataPreFilter(data);
     *    
     *    //或者再配置下面一个属性用于处理大数据集
     *    secondsLimit: xxx,
     *    partialExecutor: fn,
     *    doneCallback: 此处使用statisticsCb即可
     *    
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
        config.statisticsCb = config.statisticsCb || $.noop;
        config.doneCallback = config.doneCallback || config.statisticsCb;
        config.partialExecutor = config.partialExecutor || _delegate(function(a,b){
        	var rt = {};
        	b = b || {};
        	Object.keys(a).forEach(function(key){
        		if(typeof a[key] == 'number')
        			rt[key] = a[key] + ((key in b) ? b[key] : 0)
        	});
        	return rt;
        },this);
        
        
        this.jTable = jTable;
        jTable.data('lazy-render',this);
        jTable.on('start-loading',_delegate(this.start,this));
        jTable.on('export-excel',_delegate(this.exportExcel,this));
        this.config = config;


        this.data = [];//all data
        this.rowsAdded = [];//store rows added
        this.dataCursor = 0;//current data index

        $(document).scroll(_delegate(this._judgeContinueNeeded,this));
        $(window).resize(_delegate(this._judgeContinueNeeded,this));

        return this;
    }

    /**
     * 创建代理函数
     */
    function _delegate(fn,target){
        return function(){
        	var args = Array.prototype.slice.call(arguments,0);
            return fn.apply(target,args);
        };
    }

    /**
     * reset all modified variables
     */
    LazyRenderTable.prototype.reset = function(){
        this.data.length = 0;
        this.rowsAdded.forEach(function(jRow){jRow.remove();});//delete all added rows
        this.rowsAdded.length = 0;
        this.dataCursor = 0;
        this.currentRow = this.jTable.find('tr').eq(this.config.start);
        this.config.statisticsCb(null,0);
        return this;
    };

    /**
     * this method is called by the trigger button
     */
    LazyRenderTable.prototype.start = function(){
    	$.showLoading && $.showLoading();
        this.reset();//
        var config = this.config;
        var render = this;
        $.post(config.url,(typeof config.paramsGenerator == 'function' ? config.paramsGenerator() : config.paramsGenerator),function(data){
        	$.hideLoading && $.hideLoading();
        	console.debug('get ' + data.length+' datas');
        	data = config.dataPreFilter ? config.dataPreFilter(data) : data;
        	config.dataPreFilter && console.debug('after filter length of data is ' + data.length);
            render.data = data;
            
            LargeArrayExecutor(data,{
            	secondsLimit: config.secondsLimit,
            	partialExecutor: config.partialExecutor,
            	doneCallback: config.statisticsCb
            }).execute();
            //config.statisticsCb(data);
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
    
    //添加导出excel 功能
    LazyRenderTable.prototype.exportExcel = function(){
    	
    	this.data.length && Excel(this,this.config).build().export() || ($.messager && $.messager.alert('提示','无搜索结果,无法导出!') || alert('此搜索条件下无数据结果集，无法导出！'));
    	return this;
    };

    LazyRenderTable.prototype.errorHandler = function(err){
        console.warn(err);
        alert('服务器异常！请联系管理员!');
        return this;
    };

    $.extend({
    	lazyRenderTable: LazyRenderTable
    });
    
    $.fn.extend({
        lazyRenderTable: function(config){
			this.each(function(){
				LazyRenderTable($(this),config);
			});
            return this;
        },
	startLoading: function(){
		this.trigger('start-loading');
		return this;
	}
    });

    window.define && window.define(function(){
        return LazyRenderTable;
    });

    //----------------- 此处定义处理万级数据长度记录的便易方法
    /**
     * @param array 原始数组
     * @config {
     * 		secondsLimit: xxx [*], 限制多少时间内处理完毕，单位为秒，可为小数
     * 		partialExecutor: fn, 每一小片断处理器
     * 		doneCallback: fn, 处理完毕回调方法
     * }
     */
    function LargeArrayExecutor(array,config){
        if(!(this instanceof LargeArrayExecutor))
            return new LargeArrayExecutor(array,config);
        config = config || {};
        config.secondsLimit = config.secondsLimit || 1;//最少1秒
        config.partialExecutor = config.partialExecutor;
        config.doneCallback = config.doneCallback || $.noop;

        this.array = array;
        this.config = config;
        this.dataCursor = 0;
        return this;
    }
    /**
     * 时间段最小间隔
     * 定义为100毫秒
     * */
    LargeArrayExecutor.prototype.MIN_DURATION = 300;

    /**
     * 执行入口点
     */
    LargeArrayExecutor.prototype.execute = function(){
        //先将数组分段 最好不要生成新数组 而是用索引
        var config = this.config;
        //最小时间间隔为100ms
        //先计算出需要多少个时间段来执行
        var count = Math.ceil(config.secondsLimit * 1000 / this.MIN_DURATION);
        //console.log('will run '+count+' times');
        //再算出每段要算多少个
        var partialCount = Math.floor(this.array.length/count) || ((count = this.array.length) && 1);//如果每段处理0个的话，则只要分成1段
        
        //console.log('分成了'+count+'个时间段,每段执行'+partialCount+'个');
        
        //console.log('each time handle ',partialCount+' elements');
        //console.log('now will run '+count+' times');
        //针对每一段执行partialExecutor
        var fns = [];
        var self = this;

        for(var i = 0; i < count && this.dataCursor < this.array.length; i++){
            fns.push((function(index){
                return function(cb){
                    setTimeout(function(){
                        //此处调用partialExecutor
                        for(var j = 0; j < partialCount; j++){
                            self.sum = self.config.partialExecutor(self.array[index*partialCount + j],self.sum);
                            //console.log('累加第'+(index*partialCount + j));
                            self.dataCursor = index*partialCount + j + 1;
                        }
                        cb();
                    },index && self.MIN_DURATION);
                };
            })(i));
        }
        //console.time('iterator');
        this.serials(fns,function(){
        	//把剩余的给sum掉
        	for(var i = self.dataCursor; i< self.array.length; i++){
        		self.sum = self.config.partialExecutor(self.array[i],self.sum);
        	}
        	//console.log('doneCallback',self.sum);
            config.doneCallback(self.sum,self.array.length);
            //console.timeEnd('iterator');
        });
        return this;
    };
    /**
     * 将程序串行执行
     * @param fns
     * @param cb
     */
    LargeArrayExecutor.prototype.serials = function(fns,cb){
        var completed = 0;
        fns.length ? (function handle(){
            //var it = arguments.callee;
            fns[completed](function(){
                if(++completed == fns.length)
                    cb();
                else
                    handle();//it();
            });
        })() : cb();
        return this;
    }
    
    //--- 下面代码处理导出Excel功能
    /**
     * 使用方法
     * 
     * Excel(render,config).build().export();
     * 
     * @param render
     * @config{
     * 		download: 'xxx'//下载文件名
     * 		sheetName: '花名册名字'
     * }
     * @jTable 为不使用render的时候 
     */
    function Excel(render,config,jTable){
    	if(!(this instanceof Excel))
    		return new Excel(render,config,jTable);
    	config = config || {};
    	config.download = config.download || '下载.xls';
    	config.sheetName = config.sheetName || '未命名花名册';
    	
    	this.config = config;
    	this.render = render || {jTable:jTable,dataCursor:0,data:[]};
    	this.jTable = this.render.jTable;
    	
    	this.columnCount = this.jTable.find('tr:last td').length;
    	this.rowCount = this.jTable.find(jTable ? 'tr' : 'tr.scroll-show').length + this.render.data.length;
    	
    	
    	this.blobArray = new IoArray();//存储字符串
    	return this;
    	
    }
    
    Excel.prototype.HEAD_STYLE = {
    		id:'s66',
    		content: '<Style ss:ID="s66">' 
    					+ '<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>'
    					+'<Font ss:FontName="微软雅黑" x:Family="Swiss" ss:Size="13" ss:Color="#1F497D"/>'
    					+'</Style>'
    };
    Excel.prototype.BODY_STYLE = {
    		id:'s67',
    		content: '<Style ss:ID="s67">'
    				+ '<Font ss:FontName="微软雅黑" x:Family="Swiss" ss:Size="11"/>'
    				+'</Style>'
    };
    Excel.prototype.DEFAULT_STYLE = {
    		id:'Default',
    		content: '<Style ss:ID="Default" ss:Name="Normal">'
    			+ '<Alignment ss:Vertical="Center"/>'
    			+ '<Borders/>'
    			+ '<Font ss:FontName="宋体" x:CharSet="134" ss:Size="11" ss:Color="#000000"/>'
    			+ '<Interior/>'
    			+ '<NumberFormat/>'
    			+ '<Protection/>'
    			+ '</Style>'
    };
    /**
     * 添加头部
     */
    Excel.prototype.appendHead = function(){
    	this.blobArray
    		.push('<?xml version="1.0" encoding="utf-8"?>')
    		.push('<?mso-application progid="Excel.Sheet"?>')
    		.push('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ')
    		.push(' xmlns:o="urn:schemas-microsoft-com:office:office" ')
    		.push(' xmlns:x="urn:schemas-microsoft-com:office:excel" ')
    		.push(' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ')
    		.push(' xmlns:html="http://www.w3.org/TR/REC-html40"> ')
    		.push(' <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"> ')
    		.push(' <Created>'+new Date().toISOString()+'</Created> ')
    		.push(' <Version>14.00</Version> ')
    		.push(' </DocumentProperties> ')
    		.push(' <OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office"> ')
    		.push(' <RemovePersonalInformation/> ')
    		.push(' </OfficeDocumentSettings> ')
    		.push(' <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel"> ')
    		.push(' <WindowHeight>3900</WindowHeight> ')
    		.push(' <WindowWidth>8205</WindowWidth> ')
    		.push(' <WindowTopX>630</WindowTopX> ')
    		.push(' <WindowTopY>600</WindowTopY>')
    		.push(' <ProtectStructure>False</ProtectStructure>')
    		.push(' <ProtectWindows>False</ProtectWindows>')
    		.push(' </ExcelWorkbook>')
    		.push('<Styles>')
    		.push(this.DEFAULT_STYLE.content)
    		.push(this.HEAD_STYLE.content)
    		.push(this.BODY_STYLE.content)
    		.push('</Styles>')
    	return this;
    };
    
    Excel.prototype.appendSheet = function(){
    	this.blobArray
    		.push('<Worksheet ss:Name="'+this.config.sheetName+'">')
    		.push('<Table ss:ExpandedColumnCount="'+this.columnCount+'" ss:ExpandedRowCount="'+this.rowCount+'" x:FullColumns="1"')
    		.push(' x:FullRows="1" ss:DefaultColumnWidth="70" ss:DefaultRowHeight="15">')
    		.push('<Column ss:AutoFitWidth="1" ss:Width="100.75"/>');
    		//append rows
    	
    	this._appendTableRows();
    	
    	this.blobArray	
    		.push('</Table>')
    		//append WorksheetOptions
    		.push('<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">')
    		.push('<PageSetup><Header x:Margin="0.3"/><Footer x:Margin="0.3"/><PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/></PageSetup>')
    		.push('<Unsynced/>')
    		.push('<Print><ValidPrinterInfo/><PaperSizeIndex>9</PaperSizeIndex><VerticalResolution>0</VerticalResolution></Print>')
    		.push('<Selected/>')
    		.push('<Panes><Pane><Number>3</Number><ActiveRow>2</ActiveRow><ActiveCol>5</ActiveCol></Pane></Panes>')
    		.push('<ProtectObjects>False</ProtectObjects>')
    		.push('<ProtectScenarios>False</ProtectScenarios>')
    		.push('</WorksheetOptions>')
    		.push('</Worksheet>');
    	return this;
    };
    
    /*添加结尾*/
    Excel.prototype.appendTail = function(){
    	this.blobArray.push('</Workbook>');
    	return this;
    };
    
    Excel.prototype._appendTableRows = function(){
    	//先添加已经有的 这个时候一定要注意如果td跨行了 那么少td的地方要设置ss:Index属性
    	var excel = this;
    	this.jTable.find(this.config.sheetRowGenerator ? 'tr.scroll-show': 'tr').each(function(){
    		var jTr = $(this);
    		excel.blobArray.push(excel._createExcelRowFromTr(jTr,jTr.is('.scroll-show') ? excel.HEAD_STYLE : excel.BODY_STYLE,false/*已经有的不需要删除*/));
    	});
    	//再添加缓存所剩下的data中的数据
    	//注意因为是根据tr生成的，所以得先由data生成tr
    	var render = this.render;
    	//如果有sheetRowGenerator的话 直接操作数据
    	if(this.config.sheetRowGenerator){
    		render.data.forEach(function(d){
    			excel.blobArray.push(excel._createExcelRowFromTr(d,excel.BODY_STYLE,false));
    		});
    	}else
	    	for(var i = render.dataCursor; i< render.data.length; i++){
	    		excel.blobArray.push(
	    				excel._createExcelRowFromTr(
	    						render.config.rowGenerator(render.data[i]),
	    						excel.BODY_STYLE,
	    						true
	    				)
	    		);
	    	}
    	return this;
    };
    
    
    
    /**
     * 
     * @param jTr
     * @param needRemoved
     * @returns {Excel}
     */
    Excel.prototype._createExcelRowFromTr = function(jTr/*或者是某行的数据*/,style,needRemoved/*考虑到由data生成时，使用后要remove掉*/){
    	//此处需要优化效率 不能采用生成tr的办法  而应直接操作data 但这样还是会有一个问题 即在data render的td中如果存在跨行 就不好操作了
    	//暂不考虑跨行问题
    	var arr = [];
    	
    	if(jTr.each/*判断 是不是jQuery包装的*/){
    		jTr.each(function(){
    			arr.push('\n<Row ss:AutoFitHeight="1">\n');
    			$(this).find('td').each(function(i){
    				var txt = $(this).text();
    				var colspan = $(this).attr('colspan') || 1;
    				var rowspan = $(this).attr('rowspan') || 1;
    				colspan = parseInt(colspan) - 1;
    				rowspan = parseInt(rowspan) - 1;
    				var ssIndex = parseInt($(this).attr('ss-index') || 0);
    				arr.push('<Cell ss:StyleID="'+style.id+'"'+/*colspan*/' ss:MergeAcross="'+colspan+'"'
    						+/*rowspan*/' ss:MergeDown="' +rowspan+'"'
    						+ (ssIndex ? (' ss:Index="'+ssIndex+'"') : '')
    						+'>');
    				arr.push('<Data ss:Type="'+(isNaN(txt) ? 'String' : 'Number')+'">'+txt+'</Data>');
    				arr.push('</Cell>');
    				console.log('ssIndex = ',ssIndex);
    			});
    			arr.push('\n</Row>\n');
    		});
    	}else{//考虑到使用直接使用data的情况
    		arr.push('\n<Row ss:AutoFitHeight="1">\n');
    		this.config.sheetRowGenerator(jTr).forEach(function(txt){
    			arr.push('<Cell ss:StyleID="'+style.id+'"'+/*colspan*/' ss:MergeAcross="'+0+'"'
						+/*rowspan*/' ss:MergeDown="' +0+'"'
						+'>');
				arr.push('<Data ss:Type="'+(isNaN(txt) ? 'String' : 'Number')+'">'+txt+'</Data>');
				arr.push('</Cell>');
    		});
    		arr.push('\n</Row>\n');
    	}
    	
    	needRemoved && jTr.remove();
    	return arr.join('');
    };
    
    /**
     * 入口函数
     */
    Excel.prototype.build = function(){
    	console.log('export excel start');
    	console.time('export excel');
    	this.appendHead().appendSheet().appendTail();
    	console.timeEnd('export excel');
    	return this;
    }
    /**
     * 导出
     */
    Excel.prototype.export = function(){
    	var blob = new Blob(this.blobArray.array,{type:'text/plain'});
    	var href = window.URL.createObjectURL(blob);//放到url_deleted_queue中待回收
    	var node = $('<a>').attr('download',this.config.download).attr('href',href)[0];
    	var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
            "click", true, false
        );
        node.dispatchEvent(event);
    	return this;
    }
    
    Excel.prototype.URL_DELETED_QUEUE = [];//object url 待回收队列
    
    $.extend({
    	Excel: Excel
    });
    
    window.addEventListener('unload',function(){
    	Excel.prototype.URL_DELETED_QUEUE.forEach(function(url){
    		console.log('回收',url);
    		window.URL.revokeObjectURL(url);
    	});
    },false);
    
    function IoArray(){
    	if(!(this instanceof IoArray))
    		return new IoArray();
    	this.array = [];
    	return this;
    }
    IoArray.prototype.push = function(ele){
    	this.array.push(ele);
    	return this;
    };
    
    //--------------------
    
    return LazyRenderTable;

})(window.jQuery);
