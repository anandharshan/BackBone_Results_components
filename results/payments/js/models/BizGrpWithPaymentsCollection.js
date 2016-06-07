define([
    "GenericResultsCollection",
    "systemConfig",
    "GenericResultsModel",
    "q",
    "i18n"
], function(GenericResultsCollection, systemConfig, GenericResultsModel, Q, i18n) {

    /**
     * A Backbone collection that holds and fetches unfinalized Business Groups.
     *
     * <p>Makes GET reuquest with following, optional, parameters
     * Returned list is consumed by {@link module:GenericResultsModel}
     *
     * @module BizGrpWithPaymentsCollection
     */
    var BizGrpWithPaymentsCollection = GenericResultsCollection.extend({

        /**
         * A Backbone model representing each object in this collection.
         *
         * @type {Backbone.Model} {@link module:GenericResultsModel}
         */
        model: GenericResultsModel,

        /**
         * An REST API endpoint URL accepting GET method.
         *
         * @type {String}
         */
        _url: systemConfig.appContext+"/api/v1/payments/business-groups",

        /**
         * periodId used to determine unprocessed periods for business groups
         *
         * @type {Integer}
         */
        periodId : null,

        /**
         * Initilize listener for period selection. 
         * Event is emmitted by PeriodDropDownView.js
         *
         */        
        initialize: function(options) {
            if(!options.periodId){
                throw Error("Period ID is required to initialize collection");
            }
            this.namespace = options.namespace;
            this.periodId = options.periodId;
            Backbone.on('change:period', this.updatePeriod, this);
            GenericResultsCollection.prototype.initialize.call(this, options);
        },

        /**
         * update periodId
         *
         */
        updatePeriod : function(period){
            this.periodId = period.id;
        },

        /**
         * We're updating API URL with selected period and adding/settoing 
         * required params. 
         *
         */
        fetch: function(options){
            var self = this,
                queryParams;

            this.url = this._url + '/' + this.periodId + '?';
            GenericResultsCollection.prototype.fetch.call(this, options);
        },

        // updateCollection : function(results, countResults, options){
        //     var ready = i18n.get(this.namespace, 'finalizableStatus');
        //     if(results && results.length > 0){
        //         //finalizableStatus
        //         results = results.map(function(result){
        //             result.finalizableStatus = ready || result.finalizableStatus;
        //             return result;
        //         });
        //     }
        //     LegacyPagedCollection.prototype.updateCollection.call(this, results, countResults, options);     
        // }
        
    });
    return BizGrpWithPaymentsCollection;
});