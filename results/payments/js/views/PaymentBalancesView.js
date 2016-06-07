define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    'PaymentCollection',
    'PaymentBalanceModel',
    'PaymentFormItems',
    'DownloadView',
    'PaymentsResultView',
    'ResultsSolrCollection',
    'userConfig'
], function($, _, Backbone, config, i18n, pageUtils, PaymentCollection, PaymentBalanceModel,
            PaymentFormItems, DownloadView, PaymentsResultView, ResultsSolrCollection, userConfig){

    /**
    * A Backbone View to render Payment Balances data
    *
    * @module PaymentBalancesView
    */
    var PaymentBalancesView  = PaymentsResultView.extend({

        /**
         * type of payment to display
         *
         * @type {String} 
         */
        type: 'balances', 
  
        header : "Payments",
  	
    	/**
	     * default primaryButtonKey. Override this property in your view.
	     *
	     * @type {String} 
	     */
	    primaryButtonKey : "",

        mixPanelTag : 'Results:Payment Balances',

        rowExpandConfig : null,
        
        tableHeaders : [
            'participantName', 'positionName', 'balanceType', //'earningGroup',
            'periodBalanceWithUnitType', 'prevBalanceWithUnitType', 
            'recoveredBalanceWithUnitType', 'remainingBalanceWithUnitType'
        ],

        defaultSortIndex : 0,

        amountMapForSort : {
            'totalBalance' : 'remainingBalanceWithUnitType', 
            'balance' : 'periodBalanceWithUnitType', 
            'paymentAmount' : 'recoveredBalanceWithUnitType', 
            'bcfPreviousBalance' : 'prevBalanceWithUnitType',
            'balanceOwed' : 'balanceOwedWithUnitType'
        },        

        /**
         *
         */
        renderResults : function(){
            this.renderResultSideBar( $('#payment-balances-result-tmpl').html() );
            this.toggleBalanceTypes();
            this.initCollection();
            this.enableItemsForWritePermission();
        },

        /**
         *
         */
        renderBasicSearchView : function(){
            this.formGroupEl = this.$el.find('#list > .search-section');
            this.renderForm();
        },

        renderForm : function(){
            this.renderLandingSideBar( $('#relased-landing-tmpl').html() ); // render sidebar for balances page
            this.formGroups = PaymentFormItems.getPaymentBalancesFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.renderFormGroups();
        },

        /**
         *clearing all the existing 
         */
        setBalanceTypes : function(){
            this.clearTypesFromSearchFieldsAndText('balanceType');
            this.setTypesToSearchFieldsAndText('balanceType', this.balanceTypes);
        },

        /**
         *
         */
        setSelectedType : function(balanceTypes){
             this.balanceTypes = balanceTypes;
        },

        /**
         *
         */
        toggleBalanceTypes : function(){
            var self = this;
            if(self.businessBalanceTypes === null){
                return;
            }
            else {
                self.balanceTypes =[];
                for(var i=0; i<self.businessBalanceTypes.length; i++){
                    this.$el.find('.subtypes').append(this.sidebarPaymentTemplate(self.businessBalanceTypes[i]));
                    self.balanceTypes.push(self.businessBalanceTypes[i].name);
                }
                //If only one option, then dont show it.
                if(self.businessBalanceTypes.length === 1){
                    this.$el.find('.options-types').hide();
                }
            }
        },

        /**
         *
         */
        loadHeaders : function(){
            if(userConfig.getPreferences().isPPAEnabled){
                var balanceOwedIndex = this.tableHeaders.indexOf('balanceOwedWithUnitType');
                if(balanceOwedIndex === -1 && !this.settingsId){
                    this.tableHeaders.push('balanceOwedWithUnitType');
                }
            }
            PaymentsResultView.prototype.loadHeaders.call(this);
            var column = _.findWhere(this.headerCols, {'name' : 'balanceOwedWithUnitType'});
            if(column && this.ppaEnabled === true){
                column.sortable = false;
            }
        },

        /**
         *
         */
        initCollection :function(){
            this.loadHeaders();
            this.updatePeriod();
            this.setBalanceTypes();

            if(this.ppaEnabled === true){
                this.dataCollection = new ResultsSolrCollection({
                    entityName : 'balances',
                    objectType : 'balances',
                    objectStatus : 'balances',
                    filters : [],
                    model : PaymentBalanceModel
                });
            }else{
                this.dataCollection = new PaymentCollection();
                this.dataCollection.url =  config.appContext + "/api/v1/balances";
                this.dataCollection.model = PaymentBalanceModel;
            }

            this.dataCollection.params.sortBy = config.sortBy;
            this.dataCollection.params.sortOrder = config.sortOrder;
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
         *Download for the template, again this function is written because paymentResultView.js has another version of it.
         */
        downloadUrl : function(){
            return config.appContext + "/api/v1/balances/download";
        },

        /**
         *
         */
        download : function(){
            if(!(this.searchfields.indexOf('balanceType') > -1)){
                var initBalanceTypes = _.pluck(this.businessBalanceTypes, 'name');
                this.setTypesToSearchFieldsAndText('balanceType', initBalanceTypes);
            }
            this.showDownloadForm();
        },

        /**
         *Download for the template, again this function is written because paymentResultView.js has another version of it.
         */
        showDownloadForm : function(){
            var downloadNameLabel = i18n.get(this.namespace, 'downloadName') || "[Download Name]",
                downloadFormatLabel = i18n.get(this.namespace, 'downloadFormatLabel') || "[Download Format]",
                successMessage = i18n.get(this.namespace, 'downloadSubmitted') || "Sent to Downloads";

            var formElements = [
                {
                    type: 'textField',
                    label: downloadNameLabel,
                    required: true,
                    id: 'downloadName',
                    defaultValue: '',    // value to be placed in text field
                    validation: {
                        downloadName : {    // should be same as id
                            required: true,
                            maxLength : 128,
                            cannotContain: "\"'\\/\r\n:{}()[]<>&%#~`!@$^*+=?|,."
                        }
                    },
                    className : ''
                }
            ];
            this.includePeriodAndType();

            this.downloadView = new DownloadView({
                el : $('#modalContainer'),
                // the reason following line "sucessBtnLabel" is not "downloadBtnLabel" is because, 
                // I'm forcing you to think in terms that user is done with completing form
                // and all is validated and success event triggered for you to do your logic
                sucessBtnLabel: i18n.get(this.namespace, 'downloadButtonLabel') || "[Download]",
                title : i18n.get(this.namespace, 'downloadTitle') || "[Download]",
                cancelBtnLabel: i18n.get(this.namespace, 'cancel') || "[Cancel]",
                formElements : formElements,
                downloadUrl : this.downloadUrl(),
                successMessage: successMessage,
                namespace : this.namespace,
                formTemplate : $('#downloadAndTemplateDownload-tmpl').html(),
                searchfields : this.searchfields,
                searchtext : this.searchtext,

                // for solr download
                entityName : 'balances',
                objectType : 'balances',
                objectStatus : 'balances',
                header : this.header,
                ppaEnabled : this.ppaEnabled
            });
            this.downloadView.render();
            this.listenToOnce(this.downloadView, 'cancel', this.cancelDownload);
            this.listenToOnce(this.downloadView, 'success', this.downloadDone); 
        },

        /**
         *
         */
        cleanUp : function(){
            PaymentsResultView.prototype.cleanUp.call(this);
        }
    });
    
    return PaymentBalancesView;
});
