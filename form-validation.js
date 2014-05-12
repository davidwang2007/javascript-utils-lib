/**
 * 表单前台验证
 * mt-input 必须添加的属性
 * mt-required  class|attribute
 * mt-regexp  attribute(String)
 * mt-empty-tooltip attribute(String) 可以placeholder代替
 * mt-invalid-tooltip attribute(String)
 * 
 * @author David Wang
 * @date 2014-5-9 15:00:13
 * @email davidwang2006@outlook.com
 */
;(function($){
	'use strict';
	
	//将每一个具有mt属性的html element包装成一个类
	function MtInputEle(jEle){
		if((!jEle.is('input')) && (!jEle.is('textarea'))) return;
		if(!(this instanceof MtInputEle)) return new MtInputEle(jEle);
		jEle.$mt = this;
		this.$ele = jEle;
		this.$form = jEle.parents('form');
		this.$submitBtn = this.$form.find('input[type=submit]');
		this.required = typeof jEle.attr('mt-required') != 'undefined';
		this.regexp = jEle.attr('mt-regexp') ? new RegExp(jEle.attr('mt-regexp')) : undefined;
		this.emptyTooltip = jEle.attr('placeholder');
		this.invalidTooltip = jEle.attr('mt-invalid-tooltip');
		this.init();
	}
	/**
	 * 初始化操作
	 * @returns {MtInputEle}
	 */
	MtInputEle.prototype.init = function(){
		var ele = this.$ele;
		if(this.required){
			this.$emptyTooltip = $('<div>',{
				class: 'empty-tooltip mt-tooltip mt-tooltip-warning text-center ms-yahei f-bold',
				text: this.emptyTooltip
			}).hide();
			ele.after(this.$emptyTooltip);
		}
		if(this.invalidTooltip){
			this.$invalidTooltip = $('<div>',{
				class: 'empty-tooltip mt-tooltip mt-tooltip-error text-center ms-yahei f-bold',
				text: this.invalidTooltip
			}).hide();
			ele.after(this.$invalidTooltip);
		}
		var me = this;
		
		ele.bind('blur',function(){
			me.$emptyTooltip && me.$emptyTooltip.fadeOut();
			me.$invalidTooltip && me.$invalidTooltip.fadeOut();
		})
		
		//绑定键盘事件以验证
		ele.bind('propertychange keyup input paste'/*focus keyup click*/,function(){
			me.judgeEmpty();
			me.judgeValid();
			var flag = typeof me.$ele.attr('mt-invalid-required') != 'undefined'
					|| typeof me.$ele.attr('mt-invalid-regexp') != 'undefined';
			if(flag){
				me.$ele.removeClass('mt-valid').addClass('mt-invalid');
			}else
				me.$ele.removeClass('mt-invalid').addClass('mt-valid');
			me.judgeSubmit();
		});
		
		return this;
	};
	/**
	 * 判断是否为空
	 */
	MtInputEle.prototype.judgeEmpty = function(){
		var me = this;
		if(me.required && me.$ele.val() == '')
			me.$emptyTooltip && me.$emptyTooltip.fadeIn() && me.$ele.attr('mt-invalid-required','true');
		else
			me.$emptyTooltip && me.$emptyTooltip.hide() && me.$ele.removeAttr('mt-invalid-required');
		return this;
	};
	/**
	 * 判断内容是否符合正则表达式
	 * */
	MtInputEle.prototype.judgeValid = function(){
		if(!this.regexp) return this;
		if(this.regexp.test(this.$ele.val()) || this.$ele.val() == ''){
			this.$invalidTooltip && this.$invalidTooltip.fadeOut() && this.$ele.removeAttr('mt-invalid-regexp');
		}else
			this.$invalidTooltip && this.$invalidTooltip.fadeIn() && this.$ele.attr('mt-invalid-regexp','true');
		return this;
	};
	/***
	 * 判断是否要使提交按钮不可用
	 */
	MtInputEle.prototype.judgeSubmit = function(){
		if (this.$submitBtn.length == 0) return this;
		var disabled = this.$form.find('[mt-input],.mt-input').toArray().some(function(ele){
			var jEle = $(ele);
			return jEle.hasClass('mt-invalid');
		});
		disabled && this.$submitBtn.attr('disabled','disabled') || this.$submitBtn.removeAttr('disabled');
		
		return this;
	};
	
	
	$(document).ready(function(){
		$('[mt-input],.mt-input').each(function(){
			MtInputEle($(this));
		});
	});
	
})(window.jQuery);