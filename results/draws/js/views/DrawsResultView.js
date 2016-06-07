define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    'ResultsView',
    'loglevel',
    'dialogView',
    'DrawFormItems',
    'DrawRowView',
    'DownloadView',
    'ResultsSolrCollection',
    'DrawModel',
    'DrawCollection'
], function($, _, Backbone, config, i18n, pageUtils, ResultsView, Log, DialogView, 
    DrawFormItems, DrawRowView, DownloadView, ResultsSolrCollection, DrawModel, DrawCollection){

    /**
    * A Backbone View to render Credits data
    *
    * @module DrawsResultView
    */
    var DrawsResultView = ResultsView.extend({

    	/**
	     * default header. Override this property in your view.
	     *
	     * @type {String} 
	     */

        type: 'draw', 

	    header : "Draws",

        /**
         * default primaryButtonKey. Override this property in your view.
         *
         * @type {String} 
         */

        rowExpandConfig :[
            {
                title: '',
                rows : [
                    ['drawName', 'participantName'],
                    ['drawType', 'positionName'],
                    ['eligibleAmountWithUnitType', 'businessGroup'],
                    ['payAmountWithUnitType', 'finalizedDate'],
                    ['balanceWithUnitType','earningGroup']
                ]
            },
        ],

        primaryButtonKey : "",

        mixPanelTag : 'Results:Draws',

        tableHeaders : ["drawName","participantName","positionName","drawType", "eligibleAmountWithUnitType", 
            "payAmountWithUnitType","balanceWithUnitType","finalizedDate","earningGroup", "businessGroup", "periodName" ,"createdDate"],

        defaultSortIndex : 0,

        amountMapForSort : {
            'projectedAmount' : 'eligibleAmountWithUnitType',
            'payAmount' : 'payAmountWithUnitType',
            'balance' : 'balanceWithUnitType'
        },

        rowView : DrawRowView,

        headerTemplate : _.template($('#header-template-withoutActionCell').html()),

        releaseItemType : 'Credit',

        /**
         *
         */
        tertiaryMenuItemsConfig : function(){
            /* jshint ignore:start */
            this.menuItems = [
            ];
            /* jshint ignore:end */
        },

        render : function(){
            this.loadSettings();
        },

         /**
         *This function is used when we hit search and second page loads
         */
        renderResults : function(){
            this.sidebarInputs = [];
            this.renderResultSideBar( $('#relased-result-tmpl').html() );
            this.initCollection();
        },

        /**
         *
         */
        renderBasicSearchView : function(){
            this.formGroupEl = this.$el.find('#list > .search-section');
            //Depends on primaryButtonKey which is set to  "".
            this.renderLandingSideBar( $('#relased-landing-tmpl').html() ); // render sidebar
            this.renderForm();
        },

        renderForm : function(){
            this.formGroups = DrawFormItems.getDrawsFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.renderFormGroups();
        },

        /**
         *Download for the template, again this function is written because paymentResultView.js has another version of it.
         */
        downloadUrl : function(){
            return config.appContext + "/api/v1/draws/download";
        },

        /**
         *
         */
        initCollection :function(){
            this.loadHeaders();
            this.includePeriodAndType();
            if(this.ppaEnabled === true){
                this.dataCollection = new ResultsSolrCollection({
                    entityName : this.solrEntityMap[this.pageName],
                    objectType : this.solrEntityMap[this.pageName],
                    objectStatus : this.type,
                    filters : [],
                    model : DrawModel
                });
            }else{
                this.dataCollection = new DrawCollection();
                this.dataCollection.url =  config.appContext + "/api/v1/draws";
            }

            this.dataCollection.params.sortBy = config.sortBy;
            this.dataCollection.params.sortOrder = config.sortOrder;
            this.dataCollection.model = DrawModel;
            this.dataCollection.params.limit = 50;
            this.dataCollection.params.offset = 0;
            this.dataCollection.params.searchfield = this.searchfields;
            this.dataCollection.params.searchtext = this.searchtext;
            this.dataCollection.params.currentPage = 1;
            this.dataCollection.objectType = this.type;

            this.listenTo(this.dataCollection, 'error', this.error);
            this.listenToOnce(this.dataCollection, 'sync', this.renderBreadCrumView);    // optimize to update table only           
            this.listenTo(this.dataCollection, 'sortCollection', this.updateSort);
            this.renderTableView(); // in ResultView.js
        },

         /**
         *This function updates the search Parameters
         */
        includePeriodAndType :function(){
            this.updatePeriod();
        },

    });
    
    return DrawsResultView;
});
