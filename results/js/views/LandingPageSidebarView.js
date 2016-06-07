define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'PeriodDropdownView',
], function($, _, Backbone, config, i18n, PeriodDropdownView){

    /**
    * A Backbone View to render sidebar for landing pages
    * 
    * @module LandingPageSidebarView
    */
    var LandingPageSidebarView = Backbone.View.extend({

        /*
        *these events are being listened for in ReleasedResultSidebarView.js
        */
        events: {
            // as of period selection
            'click .download-button' : 'download',  // download 
            'click .search-button' : 'search',      // search
            'click .search-sidebar' : 'search',      // search
            'click .save-search' : 'saveSearch',      
 
            'click .generate-template-all' : 'generateTemplateAll',      // to get template for all results
            'click .generate-template-selected' : 'generateTemplateSelected',      // get for selected results
            'click .add-comment' : 'addComment',      // add comment popup
            'click .release-by-template' : 'releaseHoldsByTemplate',      // release holds popup
            'click .release-by-selected' : 'releaseHoldsBySelected',      // release holds popup
            'click .release-all-in-search' : 'releaseHoldsBySearch',      // release holds popup

            'click .finalize' : 'finalize',      // finalize payments
            'click .calcbalances' : 'calcbalances',      // calcbalances 
            'click .release-payment-by-selected' : 'releasePaymentBySelected',      // for payments
            'click .release-payment-by-period' : 'releasePaymentsByPeriod',      // for payments
            'click .release-payment-by-bizgroups' : 'releasePaymentsByBizGroup',      // for payments
            
            'change input[type="radio"]' : 'setType',      // release holds popup
            'click .subtype' : 'setSelectedType',      // release holds popup

            'click .delete-payment' : 'deletePayment',       // delete payment
            'click .download-payment' : 'downloadPayment',      // download payments
            'click .add-manual-payment' : 'addManualPayment',  //add Manual Payment
            'click .upload-button' : 'uploadManualPayment',      // add Manual Payment in Manual Payment Page
        },

        /**
        *
        */
        initialize: function(options){
            $.extend(this, options);
            this.pageName = this.header.toLowerCase();
            this.generatei18nLabels();
            this.render();
        },

        /**
        *
        */
        render: function(){
            this.$el.empty();
            this.renderSideBar();
            this.renderPeriodDropdownView();
        },

        renderSideBar : function(){
            var template = _.template(this.template);
            //label: 
            this.$el.html(template({
                primaryLabel : this.primaryLabel,
                secondaryLabel: this.secondaryLabel,
                pageName: this.pageName
            }));
            this.$el.xlate({
                namespace: this.namespace 
            });
        },

        /**
        *
        */
        generatei18nLabels : function(){
            if(this.type === 'held'){
                this.primaryLabel = i18n.get(this.namespace, 'searchHolds') || "[Search Holds]";
            }else if(this.primaryButtonKey === ''){
                this.primaryLabel = i18n.get(this.namespace, 'search') || "[Search]";
                this.secondaryLabel =  i18n.get(this.namespace, 'download') || "[Download]";
            }else{
                this.primaryLabel = i18n.get(this.namespace, 'search'+this.header) || "[Search "+this.header+"]";
                this.secondaryLabel =  i18n.get(this.namespace, 'download'+this.header) || "[Download "+this.header+"]";    
            }
        },

        /**
        *
        */
        renderPeriodDropdownView : function(){
            var showPeriod = true,
                showAsOfPeriod = true;
            if(this.type === 'held'){
                showPeriod = false;
            }
            if(this.type === 'manualPayments'){
                showAsOfPeriod = false;
            }
            // call view...may be extended to handle custom events
            this.periodDropdownView = new PeriodDropdownView({
                el : ('#periodFilter'),
                showPeriod : showPeriod,
                showAsOfPeriod: showAsOfPeriod
            });
            this.listenTo(this.periodDropdownView, "change", this.processPeriodFilterEvent);
            this.listenToOnce(this.periodDropdownView, "defaultPeriod", this.setDefaultPeriod);
        },

        /**
        * Backbone model of default period
        */
        setDefaultPeriod : function(period){
            this.trigger('defaultPeriod', period);
        },

        /**
        *
        */
        resetAsOfPeriod : function(){
            this.periodDropdownView.resetAsOfPeriod();
        },

        /**
        *
        */
        processPeriodFilterEvent : function(selectedObject, isAsOfPeriod){
            this.trigger('periodChange', selectedObject, isAsOfPeriod);
        },

        /**
        *
        */
        search : function(){
            this.trigger('search');
        },

        /**
        *
        */     
        sidebarSearch : function(){
            this.trigger('sidebarSearch');
        },

        /**
        *
        */
        download : function(){
            this.trigger('download');
        },
        
        /**
        *
        */
        saveSearch : function(){
            this.trigger('saveSearch');
        },

        /**
        *
        */
        finalize : function(){
            this.trigger('finalize');
        },

        /**
        *
        */
        calcbalances : function(){
            this.trigger('calcbalances');
        },

        /**
        *
        */
        releasePaymentsByPeriod : function(){
            this.releasePayments('periodId');
        },

        /**
        *
        */
        releasePaymentsByBizGroup : function(){
            this.releasePayments('bizGroupId');
        },

        /**
        *
        */
        releasePaymentBySelected : function(){
            this.releasePayments('paymentId');
        },

        /**
        *
        */
        releasePayments : function(type){
            this.trigger('releasePayments', type);
        },

        /** 
         *
         */        
        addManualPayment : function(){
            this.trigger('addManualPayment');
        },
        
        /** 
         *These events are triggered from LandingPageSideBarView
         */
        uploadManualPayment : function(){
            this.trigger('uploadManualPayment');
        },
 
        /**
        *
        */
        cleanUp : function(){
            if(this.periodDropdownView) this.periodDropdownView.cleanUp();// period filer
            this.undelegateEvents();// this view
        }
    });
    return LandingPageSidebarView;
});