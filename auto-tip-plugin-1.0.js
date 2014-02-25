/*
auto-tip jQuery plugin for check ticket platform system
//required attributes, as follows
//<input type="text" class="auto-tip" tip-entity="driver"/>
@author www
@date 2013-12-24 23:29:59
@finished 2013-12-25 0:23:41
*/

(function($){
	
	var ARROW_UP_KEYCODE = 38;//arrow up
	var ARROW_DOWN_KEYCODE = 40;//arrow down
	var ENTER_KEYCODE = 13;//enter
	
	/*Hide the ul tip, and remove the li.active class name*/
	function hide(jUl){
		jUl.hide();
		jUl.find('li.active').removeClass('active');
		return true;
	}

	//config for convenient usage
	var config = {
		driver:{
			url: 'autoTip.action?entity=driver',
			filterFields : ['realName','shortName'],
			displayField : 'realName'
		},
		vehicle:{
			url:'autoTip.action?entity=vehicle',
			filterFields : ['realName','shortName'],
			displayField : 'realName'
		},
		protocolUnit:{
			url: 'autoTip.action?entity=protocolUnit',
			filterFields : ['realName','shortName','appendixName'],
			displayField : 'realName'
		},
		user:{
			url: 'autoTip.action?entity=user',
			filterFields : ['realName','shortName'],
			displayField : 'realName'
		}
	}
	

	$.fn.extend({
		initAutoTip:function(){
			$(this).each(function(i,ele){
				//required attributes, as follows
				//<input type="text" class="auto-tip" tip-entity="driver"/>
				//1. validate the attribute
				var it = $(ele);
				if(!it.attr('tip-entity')){
					console.error('You show specify the "driver" attribute to auto-tip ele');
					return this;
				}else if(!it.attr('tip-entity') in config){//judge if the tip-entity name in the config
					console.error('Please add the "'+it.attr('tip-entity')+'" entity configuration to the config object...');
					return this;
				}
				//generate the auto-tip unique id for ul
				var ulId = 'auto-tip-'+Date.now();
				//it confit
				var itConfig = config[it.attr('tip-entity')];
				
				it.data('ulId',ulId);
				/*it.parents('form').length && 
					it.keydown(function(evt){
						if(evt.keyCode == ENTER_KEYCODE){
							evt.preventDefault();
						}
					});*/
				//register keyup event listener
				it.keyup(function(evt){
					//evt.stopImmediatePropagation();
					it.css('background',it.data('originalBackground'));
					switch(evt.keyCode){
						case ARROW_UP_KEYCODE:
							$('#'+ulId).find('li.active').removeClass('active').prev().addClass('active');
							$('#'+ulId).find('li.active').length == 0 && $('#'+ulId).find('li:last').addClass('active');
							judgeItemScroll(ulId);
							break;
						case ARROW_DOWN_KEYCODE:
							//if ul is hidden, render it
							($('#'+ulId).is(':hidden') 
								&& $('#'+ulId).find('li').length)
								&& $('#'+ulId).show();
							$('#'+ulId).find('li.active').length 
								? $('#'+ulId).find('li.active').removeClass('active').next().addClass('active')
								: $('#'+ulId).find('li:first').addClass('active');
							judgeItemScroll(ulId);
							break;
						case ENTER_KEYCODE:
							$('#'+ulId).find('li.active').length 
								? $(this).val($('#'+ulId).find('li.active').text().trim()) && hide($('#'+ulId)) && focusNext(ele) 
								: 0;
							break;
						default:
							//render rows
							
							renderRows(it,filter(it,it.data('rows') || [] ,config[it.attr('tip-entity')]),ulId);
							break;
					}
				});
				
				//when blur validate it
				it.data('originalBackground',it.css('background'));
				it.blur(function(){
					return;
					if(it.parents('form').length){
						it.data('rows').some(function(row){
							return row[itConfig.displayField] == it.val().trim();
						}) ? it.css('background',it.data('originalBackground')) 
							:  $.messager.confirm('输入有误','请输入有效值!',function(){it.focus();});
					}
				});
				
				$(document).click(function(evt){//when click outside hide the auto-tip ul
					if(!it.is(evt.target))
						hide($('#'+ulId));
				});
				
				$.get(itConfig.url,function(data){
					it.data('rows',data)
				}).error(function(err){
					console.error('error occurred! when post request to ' + itConfig.url + ', so set the rows to []');
					it.data('rows',[]);
				});
			});
			return this;
		}
	});
	
	/*
	filter the original row
	@ele
	@data original data
	@option {filterFields:['vehicleCode','selfCode'],displayField:'vehicleCode'}
	@return string array
	*/
	function filter(jEle,data,option){
		option = !option ? {filterFields:['all']} : option;
		typeof option.filterFields == 'string' ? option.filterFields = [option.filterFields] : (!option.filterFields ? option.filterFields=['all'] : 0);
		if(!option.displayField) return console.error('Please specify the displayField options');
		var result = [];
		var val =jEle.val().trim().toLowerCase();
		data.forEach(function(d){
			if(~option.filterFields.indexOf('all')){
				for(var prop in d){
					if(~d[prop].toString().toLowerCase().indexOf(val)){
						result.push(d[option.displayField]);
						break;
					}
				}
			}else{//filter by filterFields
				option.filterFields.some(function(prop){
					//console.log('some ---- ' + (~d[prop].toString().toLowerCase().indexOf(val)));
					return ~d[prop].toString().toLowerCase().indexOf(val);
				}) ? result.push(d[option.displayField]): 0;
			}
		});
		return result;
	}
	
	/*
	render rows with arr, we construct the choices with ul,li elements
	@fieldsShown the item to be shown, it should be string array
	@author www
	*/
	function renderRows(jEle,fieldsShown,ulId){
		//console.log(fieldsShown);
		//judge if ul exists
		var ul = $('#'+ulId);
		//empty it, and append li elements contents with arr members
		//console.log(!!ul.length);
		//console.log(ul);
		ul.length ? ul.empty() : ul = $('<ul></ul>').attr('id',ulId).addClass('auto-tip').css({
			width: jEle.outerWidth()+'px',
			zIndex: 20000
		}).appendTo($(document.body));
		ul.css({
			top: (jEle.offset().top+jEle.outerHeight())+'px',
			left: jEle.offset().left+'px'
		});
		//计算max-height
		ul.css('max-height',Math.min(300,$(window).height() - ul.offset().top - 50)+'px');
		//append li
		fieldsShown.forEach(function(str,index,arr){
			ul.append($('<li></li>').text(str).click(function(){
				jEle.val(str);//when click it, set the input value=str
			}).hover(function(){
				ul.find('li.active').removeClass('active');
				$(this).addClass('active');
			},function(){
				$(this).addClass('active');
			}).css('font',jEle.css('font')));
		});
		//if fieldsShown is empty,hide the ul
		fieldsShown.length ? ul.show() : ul.hide();
	}
	/**
	 * 设置列表的滚动 即单击向下或向上箭头时，如果当前active不在可视范围内则滚动
	 * @author www
	 */
	function judgeItemScroll(ulId){
		var ul = $('#'+ulId);
		//if no active return
		if(!ul.find('li.active').length) return;
		//get the li.active position
		var activePositionTop = ul.find('li.active').position().top;//offset to his parent
		var ulHeight = ul.height();
		var scrollTop = ul.scrollTop();
		var itemHeight = ul.find('li').first().outerHeight();
		//console.log('posTop = '+activePositionTop+', ulHeight = ' + ulHeight+', scrollTop = ' + scrollTop);
		if(activePositionTop < 0)
			ul.scrollTop(ul.find('li').first().position().top*-1 + activePositionTop);
		else if(activePositionTop > ulHeight-itemHeight){
			ul.scrollTop(ul.find('li').first().position().top*-1 + activePositionTop+itemHeight - ulHeight);
		}
	}
	
	//when ready, initialize the input auto-tip by default
	$(document).ready(function(){
		//autocomplete="off"  关闭自动提示
		$('input.auto-tip').initAutoTip().attr('autocomplete','off');
	});
})(window.jQuery);