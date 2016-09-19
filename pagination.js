/**
 * 分页插件
 * @author davidwang2006@aliyun.com
 */
;(function($){
	
	'use strict';
	
	/**
	 * copy b's props to a
	 */
	function merge(a,b){
		b && Object.keys(b).forEach(function(key){
			a[key] = b[key];
		});
		return a;
	}
	
	/**
	 * table's attr should have: url
	 * 
	 */
	function Paginator(jTable,jPageContainer,paramGenerator,rowGenerator,jEmptyRowEle){
		if(!(this instanceof Paginator)) return new Paginator(jTable,jPageContainer,paramGenerator,rowGenerator,jEmptyRowEle);
		this.jTable = jTable;
		this.jPageContainer = jPageContainer;
		this.paramGenerator = paramGenerator || function(){return {};}
		this.rowGenerator = rowGenerator;
		this.jEmptyRowEle = jEmptyRowEle;
		this.url = jTable.attr('url');
		this.pageIndex= 1;
		this.pageSize = 10;
        this.items = [];
        this.count = 0;
        this.pageCount = 0;
		this.boxes = [];
		jTable.data('paginator', this);
		return this;
	}
	
	Paginator.prototype.load = function(_pageIndex){
		_pageIndex = parseInt(_pageIndex);
        if(this.pageCount != 0 && (_pageIndex > this.pageCount || _pageIndex < 1)){
            console.debug('Can not load page ' + _pageIndex + ', because it\'s out of range');
            return;
        }
        this.pageIndex = _pageIndex;
        var self = this;
        var param = this.paramGenerator();
        merge(param,{pageIndex: this.pageIndex,pageSize: this.pageSize});
        $.get(this.url,param).done(function(data){
        	self._handleData(data);
        }).fail(function(){
        	console.error(arguments);
        }).always($.noop);
        
		
		return this;
	};
	
	Paginator.prototype._handleData = function(data){
		this.jTable.find('.dynamic-row').remove();
		this.jPageContainer.empty();
		var self = this;
		this.count = data.count;
		this.items = data.items;
		 //计算总页数
        self.pageCount = Math.ceil(data.count/this.pageSize);
        //console.debug('count',data.count,'pageCount',self.pageCount);
        self.boxes = [];
        if(self.count == 0) {
        	this.jTable.find('tbody').append(self.jEmptyRowEle.addClass('dynamic-row'));
        	this.jPageContainer.hide();
        	return this;
        }else{
        	data.items.forEach(function(row,i,data){
        		self.jTable.find('tbody').append(self.rowGenerator(row,i,data).addClass('dynamic-row'));
        	});
        	this.jPageContainer.show();
        }
        
        //计算要显示哪些按钮 以当前pageIndex按钮为中心,最多5个
        var right = Math.min(self.pageCount,self.pageIndex+3);
        var left = Math.max(1,right-6);
        self.boxes.push({
            text: 'First',
            val: 1,
            title: '首页',
            enabled: (self.pageIndex != 1)
        });
        self.boxes.push({
            text: 'Prev',
            title: '上页',
            val: (self.pageIndex-1),
            enabled: (self.pageIndex != 1)
        });
        /*
        for(var i = left; i<=right; i++){
            self.boxes.push({
                text: i,
                num: true,
                val: i,
                title: ['第',i,'页'].join(''),
                enabled: (i != self.pageIndex && i <= self.pageCount)
            });
        }
        */
        self.boxes.push({
            text: 'Next',
            val: (self.pageIndex+1),
            title: '下页',
            enabled: (self.pageIndex < self.pageCount)
        });
        self.boxes.push({
            text: 'Last',
            title: '末页',
            val: self.pageCount,
            enabled: (self.pageIndex < self.pageCount)
        });
        //create button
        //前面的文字，符合样式
        self.jPageContainer.append($('<span>',{text: ['Total ',data.count,' records'].join('')}));
        self.jPageContainer.append($('<span>',{text: [this.pageIndex,'/',this.pageCount].join('')}).css({
        	'margin': 'auto 5px auto 5px'
        }));

        
        self.boxes.forEach(function(box){
        	var btn = $('<a>',{text:box.text,title:box.title});
        	if(!box.enabled) btn.attr('disabled','disabled');
        	btn.click(function(){
        		self.load(box.val);
        	});
        	self.jPageContainer.append($('<span>').append(btn));
        });
        //go page
        var goInput = $('<input type="text" size="3" style="width:20px">').val(this.pageIndex);
        var goBtn = $('<a>',{text: 'Go',href:'javascript:void(0)'}).addClass('pageSel').css({
        	'font-size': '13px',
        	'font-weight': 'bold'
        }).click(function(){
        	var iv = parseInt(goInput.val());
        	if(iv == self.pageIndex || iv < 1 || iv > self.pageCount) return;
        	self.load(iv);
        });
        
        self.jPageContainer.append($('<span>').append(goInput));
        self.jPageContainer.append($('<span>').append(goBtn));
        
		return this;
	};
	
	Paginator.prototype.hasNext = function(){
		return this.pageIndex < this.pageCount;
	};
	
	Paginator.prototype.hasPrevious = function(){
		return this.pageIndex > 1;
	};
	
	Paginator.prototype.next = function(){
		if(!this.hasNext()){
			console.debug('Has no next page');
		}else{
			this.load(this.pageIndex - 1);
		}
		return this;
	}
	
	Paginator.prototype.first = function(){
		this.load(1);
		return this;
	};
	
	Paginator.prototype.last = function(){
		this.load(this.pageCount);
		return this;
	};
	
	Paginator.prototype.reload = function(){
		this.pageCount = 1;
		this.load(1);
		return this;
	};
	
	window.Paginator = Paginator;
	
	$(document).ready(function(){
		$('input[enter-trigger]').keydown(function(evt){
			var self = $(this);
			if(evt.keyCode == 13){
				var target = self.attr('enter-trigger');
				$(target).click();
			}
		});
	});
	
})(window.jQuery);
