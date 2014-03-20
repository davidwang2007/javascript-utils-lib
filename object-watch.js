//firefox support Object.watch method
//But google chrome does not
//So I made one by myself

if(!Object.prototype.watch){
	Object.prototype.watch = function(prop,handler){
		var me = this;
		Object.defineProperty(this,prop,new (function(){
			var ov = me[prop];
			this.get = function(){
				return ov;
			};
			this.set = function(newValue){
				ov = handler(prop,ov,newValue);
			};
		}));
	};
}
