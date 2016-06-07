
define([
    "PagedCollection",
    "systemConfig",
    "GenericResultsModel"
], function(PagedCollection, systemConfig, GenericResultsModel) {

	/**
	 * A Backbone collection that holds and fetches commission data.
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
	 * Returned list is consumed by {@link module:GenericResultsModel}
	 *
	 * @module GenericResultsCollection
	 */
    var GenericResultsCollection = PagedCollection.extend({

        /**
         * A Backbone model representing each object in this collection.
         *
         * @type {Backbone.Model} {@link module:GenericResultsModel}
         */
        model: GenericResultsModel,

        /**
         * Mapping for header
         *
         * @type {String}
         */
        sortMap :{
            'customerName' : 'name',
            'businessGroup' : 'name',
            'resultName' : 'name',
            'reasonCode' : 'name'
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
    return GenericResultsCollection;

});