define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    'ResultsView',
    'PaymentCollection',
    'PaymentModel',
    'PaymentFormItems',
    'DownloadView',
    'LegacyPagedCollection',
    'ReleaseHoldsPopupView',
    'PaymentRowView',
    'ResultsSolrCollection',
    'PaymentModel',
    'loglevel',
    'userConfig',
    'CommentView'
], function($, _, Backbone, config, i18n, pageUtils, ResultsView, PaymentCollection, 
            PaymentModel, PaymentFormItems, DownloadView, LegacyPagedCollection, 
            ReleaseHoldsPopupView, PaymentRowView, ResultsSolrCollection, PaymentModel, Log, userConfig, CommentView){

    /**
    * A Backbone View to render Payments data
    *
    * @module PaymentsResultView
    */
    var PaymentsResultView = ResultsView.extend({

        /**
         * type of payment to display
         *
         * @type {String} 
         */
        type: 'payments', 

    	/**
	     * default header. Override this property in your view.
	     *
	     * @type {String} 
	     */
	    header : "Payments",

        primaryButtonKey : "",
    
        mixPanelTag : 'Results:Payments',


        rowExpandConfig :[
            {
                title: 'generalResultInfo',
                rows : [
                    ['status', 'paymentWithUnitType'],
                    ['participantName', 'paymentFXRate'],
                    ['positionName','businessGroupName'],
                    ['finalized','commissionResultName'],
                    ['paymentType','bonusResultName'],
                    ['creditName']
                ]
            },
            {
                title: 'paymentInformation',
                rows : [
                    ['businessPaymentWithUnitType', 'businessGroupPaymentWithUnitType'],
                    ['businessFXRate', 'businessGroupFXRate'],
                    ['itemPaymentWithUnitType', 'negativePaymentWithUnitType'],
                    ['itemPaymentFXRate']
                ]
            },
            {
                title: 'standardOrderInformation',
                rows: [
                    ['orderCode', 'customerName'],
                    ['orderItemCode', 'geoName'],
                    ['productName', 'incentiveDate'],
                    ['itemAmountWithUnitType','quantity'],
                    ['relatedOrderCode','discount'],
                    ['relatedItemCode','orderDate']
                ]
            }
        ],

        tableHeaders : [
            "status", "finalized", "paymentType", "participantName",
                "orderCode", "orderItemCode", "itemAmountWithUnitType", "creditName",
                "drawBalanceWithUnitType", "paymentBalanceWithUnitType", //"earningGroup", 
                "paymentWithUnitType", "paymentFXRate", "negativePaymentWithUnitType",
                "itemPaymentWithUnitType", "itemPaymentFXRate",
                "businessGroupPaymentWithUnitType", "businessGroupFXRate",
                "businessPaymentWithUnitType", "businessFXRate", "customerName",
                "productName", "incentiveDate", "positionName", "businessGroup", 
                "geoName","commissionResultName", "bonusResultName", "drawName"
        ],

        defaultSortIndex : 3,

        rowView : PaymentRowView,
        
        headerTemplate : _.template($('#held-header-template').html()),

        releaseItemType : 'Payment',

        paymentTypes : [],
        balanceTypes : [],

        sidebarPaymentTemplate : _.template(
            "<div class='subtype ' data-paymenttype='<%=name%>'>\
                <i class='fa fa-check-square'></i>\
                <span data-i18n='<%=name%>'><%=description%></span>\
            </div>"
        ),

        /**
         *
         */
        render : function(){
            if(!this.businessPaymentTypes){
                this.getPaymentTypes();
            }
            if(!this.businessBalanceTypes){
                this.getBalanceTypes();   
            }
            this.loadSettings();
        },
        
        /**
         *
         */
        renderResults : function(){
            this.sidebarInputs = [];
            this.renderResultSideBar( $('#payment-result-tmpl').html() );
            this.togglePaymentTypes();
            this.initCollection();
            this.enableItemsForWritePermission();
            this.populatePeriodInReleaseFlyDown();
        },
        
        /**
         *
         */
        populatePeriodInReleaseFlyDown : function(){
            $('#paymentPeriod').html(this.selectedPeriod.get('name'));
        },

        /**
         * call parents method and then update this period
         */
        periodChanged : function(selectedObject, isAsOfPeriod){
            ResultsView.prototype.periodChanged.call(this, selectedObject, isAsOfPeriod);
            this.populatePeriodInReleaseFlyDown();
        },

        /**
         *
         */
        renderBasicSearchView : function(){
            this.formGroupEl = this.$el.find('#list > .search-section');
            this.renderForm();
        },

        /**
         *
         */
        renderForm : function(){
            this.renderLandingSideBar( $('#payment-landing-tmpl').html() ); // render sidebar
            this.formGroups = PaymentFormItems.getPaymentFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.enableItemsForWritePermission();
            this.renderFormGroups();
        },

        /**
         *
         */
        updateSearchResults : function(){
            this.setPaymentTypes();
            ResultsView.prototype.updateSearchResults.call(this);
        },

        /**
         *
         */     
        togglePPAItems : function(){
            var ppaExcludeElements = this.$el.find('.no-ppa');
            if(this.ppaEnabled){ // solr data
                ppaExcludeElements.find('.arrow-box-container').addClass('hard-hide');
                ppaExcludeElements.addClass('disabled').prop('disabled', true);
            }else{ // incent data
                ppaExcludeElements.find('.arrow-box-container').removeClass('hard-hide');
                ppaExcludeElements.removeClass('disabled').prop('disabled', false);
            }

            if(this.ppaEnabled || (this.dataCollection && this.dataCollection.length === 0)){
                this.hideCheckboxes();
            }else{
                this.showCheckboxes();
            }
        },

        /**
         *
         */
        initCollection :function(){
            this.loadHeaders();
            this.updatePeriod();
            this.setPaymentTypes();
            if(this.ppaEnabled === true){
                this.dataCollection = new ResultsSolrCollection({
                    entityName : this.solrEntityMap[this.pageName],
                    objectType : this.pageName,
                    objectStatus : this.type,
                    filters : [],
                    model : PaymentModel
                });
            }else{
                this.dataCollection = new PaymentCollection();
                this.dataCollection.url =  config.appContext + "/api/v1/payments";
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
         *
         */
        includePeriodAndType :function(){
            this.updatePeriod();
            this.populatePeriodInReleaseFlyDown();
        },

        /**
         *
         */
        tertiaryMenuItemsConfig : function(){
            var paymentClass =  '', balanceClass = '', mpClass = '';
            if(this.type === 'payments'){
                paymentClass = 'activeLink';
            }else if(this.type === 'manualPayments'){
                mpClass = 'activeLink';
            }else if(this.type === 'balances'){
                balanceClass = 'activeLink';
            }

            /* jshint ignore:start */
            this.menuItems = [
                {
                  id: 'payments',
                  className : paymentClass,
                  label: i18n.get(this.namespace, 'payments') || "[Payments]",
                  hash : 'results/' + this.pageName + '/payments',
                  hashTrigger : true
                }
            ];

            if(config.balancesPermission && config.balancesPermission.value !== 'NONE'){
                this.menuItems.push({
                    id: 'balances',
                    className : balanceClass,
                    label: i18n.get(this.namespace, 'balances') || "[Balances]",
                    hash : 'results/' + this.pageName + '/balances',
                    hashTrigger : true
                });
            }

            if(config.mpPermissions && config.mpPermissions.value !== 'NONE'){
                this.menuItems.push({
                    id: 'manualPayments',
                    className : mpClass,
                    label: i18n.get(this.namespace, 'manualPayments') || "[Manual Payments]",
                    hash : 'results/' + this.pageName + '/manualpayments',
                    hashTrigger : true
                });
            }
            /* jshint ignore:end */    
        },

        downloadUrl : function(){
            return config.appContext + "/api/v1/payments/download";
        },

        /**
         *
         */
        download : function(){
            if(!(this.searchfields.indexOf('paymentType') > -1)){
                var initPaymentTypes = _.pluck(this.businessPaymentTypes, 'name');
                this.setTypesToSearchFieldsAndText('paymentType', initPaymentTypes);
            }
            if(!config.tempCache || !config.tempCache.payrollTemplates){
                this.getPayrollTemplates();
            }else{
                this.showDownloadForm();
            }
        },

        /**
         *payrolltemplates
         */
        getPayrollTemplates : function(){
            var self = this;
            
            $.ajax({
                type: 'GET',
                url: config.appContext + "/api/v1/reports/template",
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) {
                config.tempCache = config.tempCache || {};
                config.tempCache.payrollTemplates = response.items;
            }).fail(function(jqXHR, textStatus, errorThrown) {
                //Never fail silently. Always make noise
                Log.error("Payroll templates retrieval failed.");
            }).always(function(){
                self.showDownloadForm();
            })
        },

        /**
         *
         */
        showDownloadForm : function(){
            var downloadNameLabel = i18n.get(this.namespace, 'downloadName') || "[Download Name]",
                payrollTemplateLabel = i18n.get(this.namespace, 'payrollTemplate') || "[Payroll Template]",
                downloadFormatLabel = i18n.get(this.namespace, 'downloadFormatLabel') || "[Download Format]",
                successMessage = i18n.get(this.namespace, 'downloadSubmitted') || "Your download is currently processing. You can check the status by choosing Downloads in the user menu (at the top of the screen).";

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
                            cannotContain: "\"'\\/\r\n:{}()[]<>&%#~`!@$^*+=?|,.;"
                        }
                    },
                    className : ''
                },
                {
                    type: 'singleSelect',
                    label: payrollTemplateLabel,
                    required: false,
                    id: 'payrollTemplate',
                    defaultValue: 'No Template',    // value to be placed in text field
                    className : '',
                    userOptions : [],
                    templates : config.tempCache && config.tempCache.payrollTemplates
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
                formTemplate : $('#paymentTemplateDownload-tmpl').html(),
                searchfields : this.searchfields,
                searchtext : this.searchtext,

                // for solr download
                entityName : this.solrEntityMap[this.pageName],
                objectType : this.solrEntityMap[this.pageName],
                objectStatus : this.type,
                header : this.header,
                ppaEnabled : this.ppaEnabled
            });
            this.downloadView.render();
            this.listenToOnce(this.downloadView, 'cancel', this.cancelDownload);
            this.listenToOnce(this.downloadView, 'success', this.startDownload);
        },

        /**
         *
         */
        preview : function(){
            this.previewFinalize('preview');
        },

        /**
         *
         */
        finalize : function(){
            this.previewFinalize('finalize');
        },

        /**
         *
         */
        calcbalances : function(){
            this.previewFinalize('calcbalances');
        },

        /**
         *
         */
        previewFinalize : function(type){
            var options = Object.create(null);
            options.releaseType = type;
            options.successMessage = i18n.get(this.namespace, 'addedToQueue') || "[Added to Queue]";
            options.cancelBtnLabel = i18n.get(this.namespace, 'cancel') || "[Cancel]";
            options.sucessBtnLabel = i18n.get(this.namespace, 'addToQueue') || "[Add to Queue]";
            options.formElements = PaymentFormItems.getPreviewFinalizeFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.setMultiSelectRowTemplate(options.formElements); // for business group

            if(type === 'finalize'){
                options.title = i18n.get(this.namespace, 'finalize') || "[Finalize]";
                options.formTemplate = $('#finalize-popup-tmpl').html(); 
            }else if(type === 'calcbalances'){
                options.title = i18n.get(this.namespace, 'calcBalances') || "[Calculate Balances]";
                options.formTemplate = $('#calcbalances-popup-tmpl').html(); 
            }else{
                return;
            }
            this.showReleaseHoldPopup(options);
        },


        /** 
         *
         */
        showReleaseHoldPopup : function(options){
            if(this.resultActionPopup) this.resultActionPopup.cleanUp();

            options.el = $('#modalContainer');
            options.namespace = this.namespace;
            options.periodId = this.selectedPeriod.get('id');
            options.releaseItemType = this.releaseItemType;

            this.resultActionPopup = new ReleaseHoldsPopupView(options);
            this.resultActionPopup.render();
            this.listenToOnce(this.resultActionPopup, 'cancel', this.cancelAction);
            this.listenToOnce(this.resultActionPopup, 'success', this.sucessAction);
            Backbone.on('BasicInputSearchPopupView:rendered', this.popupRendered, this);
        }, 
        
        /**
         *
         */
        popupRendered : function(){
            var klassList = ['unfinalize-select', 'unfinalize-businessGroup',
                    'unfinalize-lastPeriod', 'unfinalize-status']; 
            $('#popupDiv').find('.list-item-header > span').each(function(index, span){
                $(span).addClass(klassList[index]);
            });          
        },

        /**
         *
         */
        releasePayments : function(releaseType){
            var options = Object.create(null);
            options.releaseType = releaseType;
            options.successMessage = i18n.get(this.namespace, 'addedToQueue') || "[Added to Queue]";
            options.cancelBtnLabel = i18n.get(this.namespace, 'cancel') || "[Cancel]";
            options.sucessBtnLabel = i18n.get(this.namespace, 'addToQueue') || "[Add to Queue]";
            options.formElements = [];
            options.rowsSelected = this.rowsSelected;

            if(releaseType === 'bizGroupId'){
                options.title = i18n.get(this.namespace, 'releaseByBusinessGroup') || "[Release by Business Group]";
                options.formTemplate = $('#paymentRelaseByBizGrp-tmpl').html(); 
                options.formElements = PaymentFormItems.getPaymentReleaseFromGroups(this.namespace, this.pageName, this.formInputValues, this.selectedPeriod);
            }else{
                options.title = i18n.get(this.namespace, 'confirmRelease') || "[Confirm Release]";
                options.formTemplate = $('#paymentRelaseAll-tmpl').html();
            }
            this.setMultiSelectRowTemplateForBizGrpWithPayment(options.formElements); // for business group
            this.showReleaseHoldPopup(options);
        },

        /**
         *sorry for long function name. i cud not think of anything better
         *this is to override popup template in release payment , business grp feild pop up.
         */
        setMultiSelectRowTemplateForBizGrpWithPayment : function(formElements){
            if(!formElements) return;
            var businessGroup = _.findWhere(formElements, {id : 'businessGroup'});
            if(businessGroup){
                businessGroup.rowTemplate = _.template($('#bizgrp-popup-withpayment-row-template').html());
            }
        }, 

        /**
         *
         */
        setMultiSelectRowTemplate : function(formElements){
            if(!formElements) return;
            var businessGroup = _.findWhere(formElements, {id : 'businessGroup'});
            if(businessGroup){
                businessGroup.rowTemplate = _.template($('#unfinalized-bizgrp-popup-row-template').html());
            }
        },        

        /**
         *Needs to remove the  add, delete and add comment options if its read-only
         */
        enableItemsForWritePermission : function(){ 
            
            if(config.paymentsPermissions && config.paymentsPermissions.value === 'READ_WRITE'){
                //Any actions if needed to be enabled
                this.$el.find('.calcbalances').addClass('enabled').prop('disabled', false);
                this.$el.find('.finalize').addClass('enabled').prop('disabled', false);
                this.$el.find('.release-payments').addClass('enabled').prop('disabled', false);
            }else {
                // remove the flyover menu
                this.$el.find('.release-payments > .menu-popup-container').remove();
                this.$el.find('.calcbalances').remove();
                this.$el.find('.finalize').remove();
                this.$el.find('.release-payments').remove();
            }
        },
        
        /**
         *
         */
        setPaymentTypes : function(){
            this.clearTypesFromSearchFieldsAndText('paymentType');
            this.setTypesToSearchFieldsAndText('paymentType', this.paymentTypes);
        },

        /**
         *type :: paymentType or balanceType
         *clear the types from search text and field 
         */
        clearTypesFromSearchFieldsAndText : function(type){
            var keyIndexs = this.getAllIndexes(this.searchfields, type);
            for(var i=0; i < keyIndexs.length; i++){
                var keyindex = this.searchfields.indexOf(type);
                this.searchfields.splice(keyindex, 1);
                this.searchtext.splice(keyindex, 1);
            }
        },

        /**
        *type :: paymentType or balanceType
        *set the types from search text and field 
        */
        setTypesToSearchFieldsAndText : function(type, arrayOfTypes){
            for(var i = 0; i < arrayOfTypes.length; i++){
                this.searchfields.push(type);
                this.searchtext.push(arrayOfTypes[i]);
            }
        },

        /**
         *
         */
        setSelectedType : function(paymentTypes){
             this.paymentTypes = paymentTypes;
        },

        /**
         *
         */
        getPaymentTypes : function(){
            var self = this;
            self.businessPaymentTypes = null;
            $.ajax({
                type: 'GET',
                url: config.appContext + "/api/v1/payments/type",
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) { 
                self.businessPaymentTypes = response;
                if(userConfig.getPreferences().isPPAEnabled !== true){
                    self.businessPaymentTypes = _.without(self.businessPaymentTypes, _.findWhere(self.businessPaymentTypes, {'name': 'PPA'}));
                    self.businessPaymentTypes = _.without(self.businessPaymentTypes, _.findWhere(self.businessPaymentTypes, {'name': 'PPA_BCF'}));
                }
                if(userConfig.getPreferences().isBCFEnabled !== true){
                   self.businessPaymentTypes = _.without(self.businessPaymentTypes, _.findWhere(self.businessPaymentTypes, {'name': 'BCF'}));
                }
                //self.PaymentTypes = _.clone(self.businessPaymentTypes);
                Log.info("PaymentTypes are :: " + self.businessPaymentTypes);         
            }).fail(function(jqXHR, textStatus, errorThrown) {
                // fail silently
            });
        },

        /**
         *
         */
        getBalanceTypes : function(){
            var self = this;
            self.businessBalanceTypes = null;
            $.ajax({
                type: 'GET',
                url: config.appContext + "/api/v1/balances/type",
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) {
                self.businessBalanceTypes = response;
                if(userConfig.getPreferences().isPPAEnabled !== true){
                    self.businessBalanceTypes = _.without(self.businessBalanceTypes, _.findWhere(self.businessBalanceTypes, {'name': 'Prior_Period'}));
                }
                //Removing draws for April release (This shud have been done from backend)
                self.businessBalanceTypes = _.without(self.businessBalanceTypes, _.findWhere(self.businessBalanceTypes, {'name': 'Draw'}));
                Log.info("BalanceTypes are :: " + self.businessBalanceTypes);     
            }).fail(function(jqXHR, textStatus, errorThrown) {
                // fail silently
            });
        },

        
        /**
         *
         */
        togglePaymentTypes : function(){
            var self = this;
            if(self.businessPaymentTypes === null){
                return;
            }
            else {
                self.paymentTypes =[];
                for(var i=0; i<self.businessPaymentTypes.length; i++){
                    this.$el.find('.subtypes').append(this.sidebarPaymentTemplate(self.businessPaymentTypes[i]));
                    self.paymentTypes.push(self.businessPaymentTypes[i].name);
                }
            }
        },

        addComment : function(fromBubble){
            if(this.commentView) this.commentView.cleanUp();
            
            var options = Object.create(null);
            options.el = $('#modalContainer');
            options.type = 'release';

            options.formTemplate = $('#add-view-comment-tmpl').html();
            if(fromBubble){
                options.title = i18n.get(this.namespace, 'commentsTitle') || "[Comments]";
                options.heldObjId = this.currentSelectedRow.id;
                options.selectedRows = [this.currentSelectedRow];
                if(this.ppaEnabled === true){
                    options.heldObjId = this.currentSelectedRow.PAYMENT_ID;
                }
            }else{
                options.selectedRows = _.clone(this.rowsSelected);
                options.title = i18n.get(this.namespace, 'addComment') || "[Add Comment]";
            }
            options.successMessage = i18n.get(this.namespace, 'commentAdded') || "Comments added";
            options.cancelBtnLabel = i18n.get(this.namespace, 'cancel') || "[Cancel]";
            options.sucessBtnLabel = i18n.get(this.namespace, 'addComment') || "[Add Comment]";
            options.comments = this.comments;
            options.namespace = this.namespace;
            options.heldObjType = this.type;
            options.resourceName = userConfig.getUserInfo().userName;
            
            this.commentView = new CommentView(options);
            this.commentView.render();
            
            this.listenToOnce(this.commentView, 'cancel', this.cancelAction);
            this.listenToOnce(this.commentView, 'success', this.commentsAdded);
        },

        /** 
         * Fired when comments are successfully added.
         */ 
        commentsAdded : function(view){
            view.selectedRows.forEach(function(row){
                $('[data-id="'+row.id+'"]').find('.row-comment').removeClass('no-comments').addClass('comment-added');
            });
            this.sucessAction();
        },

        /**
         *
         */
        cancelAction : function(){
            this.cleanPopup();
        },

        /**
         *
         */
        cleanPopup : function(){
            if(this.commentView) this.commentView.cleanUp();
        },

        /**
         *
         */
        cleanUp : function(){
            ResultsView.prototype.cleanUp.call(this);
        }
    });
    
    return PaymentsResultView;
});
