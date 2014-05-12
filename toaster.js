/**
 * make toaster plugin
 * @author David Wang
 * @date 2014-5-9 13:48:39
 * */
;(function($){
	'use strict';
	var id = '#toast-container';
	var DEFAULT_TIMEOUT = 2000;//3秒钟
	
	var cArr = ['toast-info','toast-error','toast-warning','toast-success'].join(' ');
	
	var tid = null;
	
	function show(type,msg){
		$(id).fadeIn()
			.find('.toast').removeClass(cArr).addClass('toast-'+type)
			.find('div div').text(msg);
		if(tid) clearTimeout(tid);
		tid = setTimeout(function(){
			$(id).fadeOut();
		},DEFAULT_TIMEOUT);
	}
	
	var toaster = {
		i: function(msg){
			show('info',msg);
		},
		w: function(msg){
			show('warning',msg);
		},
		e: function(msg){
			show('error',msg);
		},
		s: function(msg){
			show('success',msg);
		}
	};
	
	$.extend({
		toaster: toaster
	});
	
	$(document).ready(function(){
		if(typeof $error != 'undefined')
			$.toaster.e($error.reason);
		$(id).bind('click',function(){
			if(tid) clearTimeout(tid);
			$(this).hide();
		});
	});
})(window.jQuery);
