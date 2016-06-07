define([
	"backbone"
], function(Backbone){
	/*
	 * Model to hold filter data selected by user
	 */
	return Backbone.Model.extend({
		addValues :  function(value, displayValue){
			// add data to this model by using this keyword
			this.get('filterValues').push(value);
			this.get('displayValues').push(displayValue);
			//console.log(this);
		}
	});
});
