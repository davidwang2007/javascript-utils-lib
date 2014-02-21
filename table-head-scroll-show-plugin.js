/**
 * WHEN THE DOCUMENT SCROLL, THE TABLE HEAD MAYBE DISAPEAR
 * THIS PLUGIN SOLVE THE PROBLEM
 * 
 * USAGE:
 * 
 * <table class="scroll-show">
 * 	<tr class="scroll-show"><tr>
 * </table>
 * 
 * @AUTHOR: DAVID WANG
 * @EMAIL: davidwang2006@qq.com
 * @TIME: 2014-2-19 17:25:17
 */

(function($){
	'use strict';
	
	/**
	 * register
	 */
	function _initScrollShow(jTable){
		//ADD EVENT LISTENER TO DOCUMENT SCROLL EVENT
		$(document).scroll(function(){
			var jDoc = $(this);
			//1. WHEN THE DOCUMENT SCROLL TOP MATCHES THE TABLE'S OFFSET TOP
			//2. APPEND THE JDIV TO THE DOCUMENT BODY
			var tableTop = jTable.offset().top;
			var cloneTable = jTable.data('clone-table');
			if(!cloneTable){
				cloneTable = createCopyTable(jTable);
				jTable.data('clone-table',cloneTable);//CREATE AND STORE IT
			}
			
			if(jDoc.scrollTop() >= tableTop){
				//ISSUE: THE TD WIDTH DOES NOT MATCHES THE ORIGINAL, BECAUSE THE TABLE TD WIDTH CHANGES WHEN NEW ROW DATA FILLED
				//JUST CACULATE ONCE
				/*
				cloneTable.is(':hidden') && cloneTable.find('tr:first td').each(function(i){
					$(this).width(jTable.find('tr.scroll-show:first td').eq(i).width());
					console.log('recalculate');
				});
				*/
				//FIX THE COLSPAN PROBLEM, AS FOLLOWES
				cloneTable.is(':hidden') && cloneTable.find('tr').each(function(i){
					$(this).find('td').each(function(j){
						$(this).width(jTable.find('tr.scroll-show').eq(i).find('td').eq(j).width());
					});
				}).end().show() && getBack2TopBtn().show();/*显示返回顶部按键*/;
			}else{
				cloneTable.remove();
				jTable.data('clone-table',null);
				getBack2TopBtn().hide();
			}
		});
	}
	/**
	 * PREPARE FOR THE CLONE TABLE, AND SET IT'S PROPERTIES DONE
	 * return jDIV
	 * @AUTHOR DAVID WANG
	 */
	function createCopyTable(jTable){
		var offset = jTable.offset();
		var jDiv = $('<div>').width(/* THE DIV WIDTH MATCHES THE TABLE'S WIDTH */jTable.outerWidth())
			.css({/*SET POSITION, LEFT IS IMPORTANT, TOP IS ZERO*/
				position: 'fixed',
				left: offset.left + 'px',
				top: 0,
				background:'white',
				display: 'none'//HIDDEN AT FIRST
			});
		//CLONE OLD TABLE
		var cloneTable = jTable.clone().empty().removeAttr('id')//PREVENT THE ORIGINAL ID EFFECT BY REMOVING THE CLONE'S ID ATTRIBUTE
								.append(jTable.find('.scroll-show').clone().removeAttr('id'))
								.css({
									width: '100%'
								});
		jDiv.append(cloneTable).appendTo(document.body);
		return jDiv;
	}
	
	/**
	 * 创建返回顶部按钮
	 * @returns
	 */
	function getBack2TopBtn(){
		var jBtn = $('#back2top-btn').length ? $('#back2top-btn') :
				$('<a>').text('顶部').attr('id','back2top-btn').attr('href','javascript:void(0);').css({
					height: '40px',
					width:'40px',
					'border-radius':'40px',
					'font-family':'"黑体",sans-serif',
					position:'fixed',
					right: '10px',
					'text-decoration':'none',
					'background-color':'#ECF5F9',
					'border':'1px solid #9cf',
					'line-height':'40px',
					'text-align':'center',
					'color':'#1D2161',
					'font-size':'14px'
				}).click(function(){
					$(document).scrollTop(0);
				}).appendTo(document.body);
		jBtn.css('bottom',($(window).height()/2 - 20)+'px');
		return jBtn;
	}
	
	$(document).ready(function(){
		//ITERATE ALL SCROLL TABLE AND INITIALIZE THEM
		$('table.scroll-show').each(function(){
			_initScrollShow($(this));
		});
	});
	
})(window.jQuery);