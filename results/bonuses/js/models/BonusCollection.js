
define([
    "PagedCollection",
    "systemConfig",
   	"BonusModel"
], function(PagedCollection, systemConfig, BonusModel) {

	/**
	 * A Backbone collection that holds and fetches Bonus data.
	 *
	 * <p>Makes GET reuquest with following, optional, parameters
	 * <pre>
	 {
		sortby: "[The field to sort by]",
		sortorder: "[asc or desc]",
		limit: [The maximum number of items returned],
		offset:[The starting index/page number of the search results (0-indexed)],
		searchfield:name
		searchtext: "[The value of text input field]",
	 }
	 * </pre>
	 * </p>
	 *
	 * <p> Ideal response from server should be in following structure.
	 * <pre>
	 {
	    "items": [An Array containing the objects returned],
	    "offset": [The starting index of the search results (0-indexed)],
	    "limit": [The maximum number of items returned],
	    "totalCount": [The total number of items (limited by search criteria, if any)],
	    "sortOrder": "[asc or desc]",
	    "sortBy": "[The field to sort by]",
	    "lastPage": [The index of the last page],
	    "items": [An Array containing object to be consumed by A Backbone Model ]
	 }
	 * </pre>
	 * </p>
	 *
	 * Returned list is consumed by {@link module:BonusModel}
	 *
	 * @module BonusCollection
	 */
    var BonusCollection = PagedCollection.extend({

    	 /**
         * A Backbone model representing each object in this collection.
         *
         * @type {Backbone.Model} {@link module:BonusModel}
         */
        model: BonusModel,

        /**
         * An REST API endpoint URL accepting GET method.
         *
         * @type {String}
         */
        url: systemConfig.appContext+"/api/bonuses/v1",

        /**
         * Mapping for header
         *
         * @type {String}
         */
        sortMap :{
            'amountWithUnitType' : 'amount',
            'originaAmountWithUnitType' : 'amount',
            'rateWithUnitType': 'rateAmount',
            'held' : 'isHeld',
            'creditAmountWithUnitType': 'creditAmount',
            'releaseAmountWithUnityType' : 'releasedAmount',
            'heldAmountWithUnityType' : 'heldAmount',
            'businessGroup' : 'businessGroupName',
            'earningGroup' : 'earningGroupName'
        },

        /**
         * Sets sortBy and sortOrder periperties for this collection and then
         * emits sortCollection event. So in your implementation listen for this
         * event.
         *
         * NOTE: "sortCollection" instead of "sort" event is used because Backbone has
         * built in sort event.
         *
         */
        setSort: function(sortBy, sortOrder){
            var clonedSort = _.clone(sortBy);
            if(typeof clonedSort === 'object' && this.sortMap[clonedSort.name]){
                clonedSort.name = this.sortMap[clonedSort.name];
            }else if(typeof clonedSort === 'string' && this.sortMap[sortBy]){
                clonedSort = this.sortMap[clonedSort];
            }
            PagedCollection.prototype.setSort.call(this, clonedSort, sortOrder);
        },
        

    });
    return BonusCollection;

});