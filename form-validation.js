/**
 * 表单前台验证
 * dw-input 必须添加的属性
 * dw-required  class|attribute
 * dw-regexp  attribute(String)
 * dw-empty-tooltip attribute(String) 可以placeholder代替
 * dw-invalid-tooltip attribute(String)
 * 
 * @author David Wang
 * @date 2014-5-9 15:00:13
 * @email davidwang2006@outlook.com
 */
;(function($){
	'use strict';
	
	//将每一个具有dw属性的html element包装成一个类
	function DwInputEle(jEle){
		if((!jEle.is('input')) && (!jEle.is('textarea'))) return;
		if(!(this instanceof DwInputEle)) return new MtInputEle(jEle);
		jEle.$dw = this;
		this.$ele = jEle;
		this.$form = jEle.parents('form');
		this.$submitBtn = this.$form.find('input[type=submit]');
		this.required = typeof jEle.attr('dw-required') != 'undefined';
		this.regexp = jEle.attr('dw-regexp') ? new RegExp(jEle.attr('mt-regexp')) : undefined;
		this.emptyTooltip = jEle.attr('placeholder');
		this.invalidTooltip = jEle.attr('dw-invalid-tooltip');
		this.init();
	}
	/**
	 * 初始化操作
	 * @returns {DwInputEle}
	 */
	DwInputEle.prototype.init = function(){
		var ele = this.$ele;
		if(this.required){
			this.$emptyTooltip = $('<div>',{
				class: 'empty-tooltip dw-tooltip mt-tooltip-warning text-center ms-yahei f-bold',
				text: this.emptyTooltip
			}).hide();
			ele.after(this.$emptyTooltip);
		}
		if(this.invalidTooltip){
			this.$invalidTooltip = $('<div>',{
				class: 'empty-tooltip dw-tooltip mt-tooltip-error text-center ms-yahei f-bold',
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
			var flag = typeof me.$ele.attr('dw-invalid-required') != 'undefined'
					|| typeof me.$ele.attr('dw-invalid-regexp') != 'undefined';
			if(flag){
				me.$ele.removeClass('dw-valid').addClass('mt-invalid');
			}else
				me.$ele.removeClass('dw-invalid').addClass('mt-valid');
			me.judgeSubmit();
		});
		
		return this;
	};
	/**
	 * 判断是否为空
	 */
	DwInputEle.prototype.judgeEmpty = function(){
		var me = this;
		if(me.required && me.$ele.val() == '')
			me.$emptyTooltip && me.$emptyTooltip.fadeIn() && me.$ele.attr('dw-invalid-required','true');
		else
			me.$emptyTooltip && me.$emptyTooltip.hide() && me.$ele.removeAttr('dw-invalid-required');
		return this;
	};
	/**
	 * 判断内容是否符合正则表达式
	 * */
	DwInputEle.prototype.judgeValid = function(){
		if(!this.regexp) return this;
		if(this.regexp.test(this.$ele.val()) || this.$ele.val() == ''){
			this.$invalidTooltip && this.$invalidTooltip.fadeOut() && this.$ele.removeAttr('dw-invalid-regexp');
		}else
			this.$invalidTooltip && this.$invalidTooltip.fadeIn() && this.$ele.attr('dw-invalid-regexp','true');
		return this;
	};
	/***
	 * 判断是否要使提交按钮不可用
	 */
	DwInputEle.prototype.judgeSubmit = function(){
		if (this.$submitBtn.length == 0) return this;
		var disabled = this.$form.find('[dw-input],.mt-input').toArray().some(function(ele){
			var jEle = $(ele);
			return jEle.hasClass('dw-invalid');
		});
		disabled && this.$submitBtn.attr('disabled','disabled') || this.$submitBtn.removeAttr('disabled');
		
		return this;
	};
	
	
	$(document).ready(function(){
		$('[dw-input],.mt-input').each(function(){
			DwInputEle($(this));
		});
	});
	
})(window.jQuery);