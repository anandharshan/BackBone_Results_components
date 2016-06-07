define([
	"backbone",
	"filterModel"
], function(Backbone, Filter){
	/*
	 *	Collection to hold filter models
	 */
	return Backbone.Collection.extend({
		model : Filter
	});
});
