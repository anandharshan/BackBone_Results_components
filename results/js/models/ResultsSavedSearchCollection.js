define([ 
    "SearchModel",
    "PagedCollection"
], function(SearchModel, PagedCollection) {
    var ResultsSavedSearchCollection = PagedCollection.extend({
        model : SearchModel,

        sortMap :{
            'type' : 'savedSearchType',
            'owner' : 'icmUser'
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
    return ResultsSavedSearchCollection;
});
