
define([
    "LegacyPagedCollection",
    "systemConfig",
    "GenericResultsModel"
], function(LegacyPagedCollection, systemConfig, GenericResultsModel) {

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
	 * @module GenericResultsLegacyCollection
	 */
    var GenericResultsLegacyCollection = LegacyPagedCollection.extend({

        /**
         * A Backbone model representing each object in this collection.
         *
         * @type {Backbone.Model} {@link module:GenericResultsModel}
         */
        model: GenericResultsModel,

        /**
         * Mapping for header
         *
         * @type {Object}
         */
        sortMap :{
            'customerName' : 'name',
            'earningGroup': 'name',
            'ruleName' : 'name',
            'geographyName' : "name",
            'productName': 'name',
            'rateTableName': 'name',
            'quotaName' : 'name',
            'personName' : 'name',
            'positionName' : 'name'
        },

         /**
         * Mapping for searchfield element when collection to making a call to API
         *
         * @type {Object}
         */
        searchFieldMap :{
            'orderItemCode' : 'itemCode'
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
            LegacyPagedCollection.prototype.setSort.call(this, clonedSort, sortOrder);
        },

        /**
         * This method maps searchfield names to your custom types
         *
         *
         */
        fetch: function(options){
            var self = this;
            this.params.searchfield = _.map(this.params.searchfield, function(field){
                return self.searchFieldMap[field] || field;
            });
            LegacyPagedCollection.prototype.fetch.call(this, options);
        },

        /*
         * Massage data before sending to parent
         *
         */
        updateCollection : function(result, count, options){
            if(this.url.indexOf('earninggroups')> -1){
                // we dont want to show 'Earning Group Not Defined'
                result = _.reject(result, function(res){
                    return (res.id === -99999);
                });
            }
            LegacyPagedCollection.prototype.updateCollection.call(this, result, count, options);
        }
    });
    return GenericResultsLegacyCollection;

});