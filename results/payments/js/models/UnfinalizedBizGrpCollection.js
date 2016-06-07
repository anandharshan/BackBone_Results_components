define([
    "LegacyPagedCollection",
    "systemConfig",
    "GenericResultsModel",
    "q",
    "i18n"
], function(LegacyPagedCollection, systemConfig, GenericResultsModel, Q, i18n) {

    /**
     * A Backbone collection that holds and fetches unfinalized Business Groups.
     *
     * <p>Makes GET reuquest with following, optional, parameters
     * Returned list is consumed by {@link module:GenericResultsModel}
     *
     * @module UnfinalizedBizGrpCollection
     */
    var UnfinalizedBizGrpCollection = LegacyPagedCollection.extend({

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
        _url: systemConfig.appContext+"/api/results/finalizeinfo/business-groups",

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
            LegacyPagedCollection.prototype.initialize.call(this, options);
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

            this.params.currentPage = this.params.currentPage || 1;

            this.url = this._url + '/' + this.periodId + '?';
            this.countUrl = this._url + '/' + this.periodId + '/count?';

            queryParams = 'limit=' + this.params.limit +
                        '&offset=' + ((this.params.currentPage - 1) * this.params.limit) +
                        '&sortfield=name' +
                        '&order=' + this.params.sortOrder +
                        '&finalizable=true';

            var nameIndex = this.params.searchfield.indexOf('name');
            if(nameIndex > -1){
               queryParams += '&searchtext=' + this.params.searchtext[nameIndex];
            }
            
            this.url = this.url + queryParams;
            this.countUrl = this.countUrl + queryParams;

            Q.allSettled([
                this.getData(this.url, null),   
                this.getData(this.countUrl, null)
            ]).spread(function (results, countResults){
                self.processAllData(results, countResults, options);
            }).done();
        },

        updateCollection : function(results, countResults, options){
            var ready = i18n.get(this.namespace, 'finalizableStatus');
            if(results && results.length > 0){
                //finalizableStatus
                results = results.map(function(result){
                    result.finalizableStatus = ready || result.finalizableStatus;
                    return result;
                });
            }
            LegacyPagedCollection.prototype.updateCollection.call(this, results, countResults, options);     
        }
        
    });
    return UnfinalizedBizGrpCollection;
});