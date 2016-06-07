define([
    'i18n',
    'LandingPageSidebarView',
    'SidebarFormGroupView',
    'CommissionFormItems',
    'BonusFormItems',
    'CreditFormItems',
    'PaymentFormItems',
    'DrawFormItems'
], function(i18n, LandingPageSidebarView, SidebarFormGroupView, CommissionFormItems,
                BonusFormItems, CreditFormItems, PaymentFormItems, DrawFormItems){

    /**
    * A Backbone View to render sidebar for released results pages
    * 
    * @module ReleasedResultSidebarView
    */
    var ReleasedResultSidebarView = LandingPageSidebarView.extend({

        sideBarFormGrpFxn :{
            // this.header : function in respective form objects
            'Commissions' : CommissionFormItems.getReleasedCommSidebarFromGroup,
            'Bonuses' : BonusFormItems.getReleasedBonusesSidebarFromGroup,
            'Credits' : CreditFormItems.getReleasedCreditsSidebarFromGroup,
            'Payments' : PaymentFormItems.getPaymentsSidebarFromGroup,
            'manualPayments' : PaymentFormItems.getManualPaymentsSidebarFromGroup,
            'balances' : PaymentFormItems.getBalanceResultSidebarFromGroup,
            'Draws' : DrawFormItems.getDrawsSidebarFromGroup
        },
        
        heldSidebarFromGrpFxn : {
            'Commissions' : CommissionFormItems.getHeldCommSidebarFromGroup,
            'Bonuses' : BonusFormItems.getHeldBonusesSidebarFromGroup,
            'Credits' : CreditFormItems.getHeldCreditsSidebarFromGroup 
        },

        inputGeneratingObjects : {
            'Commissions' : CommissionFormItems,
            'Bonuses' : BonusFormItems,
            'Credits' : CreditFormItems,
            'Payments' : PaymentFormItems,
            'Draws' : DrawFormItems,
            'Payment Balances' : PaymentFormItems
        },

        // these inputs are locked based on key and defaultvalue existance
        inputLockMap : {
            'erdTab' : ['estReleaseDate-fromDate', 'estReleaseDate-toDate', 'estReleaseDate-fromDatePrimary', 'estReleaseDate-toDatePrimary'],
            'ordersTab' : ['orderCode'],
            'personTab' : ['participantName'],
            'processedPeriodTab' : ['processedPeriod'],
        },

        /**
         *
         */
        render: function(){
            this.$el.empty();
            this.renderSideBar();
            this.renderPeriodDropdownView();
            this.renderInputs();
        },
        
        /**
         *
         */        
        renderInputs : function(){
            var self = this;
            this.formGroupEl = this.$el.find('.sidebar-inputs');
            
            var adminDefinedInputs = null;
            if(this.settingsSavedSearchModel &&
                this.settingsSavedSearchModel.get('searchFilters') &&
                    this.settingsSavedSearchModel.get('searchFilters').length > 0){
                // get columnIds
                adminDefinedInputs = _.pluck(this.settingsSavedSearchModel.get('searchFilters'), 'columnId');
            }

            if(this.selectedTab === 'erdTab'){
                this.inputLockMap[this.selectedTab].forEach(function(input){
                    var targetInput = input+'Primary';
                    if(self.inputValues[targetInput]){
                        self.inputValues[input] = self.inputValues[targetInput];
                    }
                });
            }

            // we'll use page header to get function in respective ...FormItems
            // this function will be used to get sidebar inputs fields
            var formItemFunction = this.sideBarFormGrpFxn[this.header]; // function

            if(this.type === 'held'){
                formItemFunction = this.heldSidebarFromGrpFxn[this.header]; 
            }else if(this.type === 'manualPayments' || this.type === 'balances'){
                formItemFunction = this.sideBarFormGrpFxn[this.type];
            }

            var formContext = this.inputGeneratingObjects[this.header];
            this.formGroups = formItemFunction.call(formContext, this.namespace, this.pageName, this.inputValues, adminDefinedInputs);
            
            this.renderFormGroups();

            // locked down inputs
            if(this.type === 'held' && this.inputLockMap[this.selectedTab]){
                this.inputLockMap[this.selectedTab].forEach(function(input){  
                    inputObject = _.findWhere(self.formGroups[0].formElements, {id: input});   
                    if(!inputObject) return;

                    if( (inputObject.defaultValue && inputObject.defaultValue.length > 0) ||
                         (inputObject.defaultValue && inputObject.id === input) ){
                        self.formGroupEl.find('#'+input+'Input').addClass('locked-input');
                    }
                });
            }
        },

        /**
         *
         */
        renderFormGroups : function(){
            this.formGroupView = new SidebarFormGroupView({
                formGroups : this.formGroups,
                el : this.formGroupEl,
                pageName : this.pageName,
                type: this.type,
                namespace : this.namespace
            });
        },
        
        /**
         *
         */
        generatei18nLabels : function(){
            if(this.type === 'held'){
                this.primaryLabel = i18n.get(this.namespace, 'searchHolds') || "[Search Holds]";
            }else{
                this.primaryLabel =  i18n.get(this.namespace, 'download') || "[Download]";    
            }
        },

        /**
         *
         */
        clearInput : function(id){
            if(this.formGroupView){
                this.formGroupView.clearInput(id);
            }
        },

        /**
         *
         */        
        getData : function(){
            return this.formGroupView.getData();
        },

        /** 
         *
         */        
        addComment : function(){
            this.trigger('addComment');
        },

        /** 
         *
         */        
        deletePayment : function(){
            this.trigger('deletePayment');
        },

        /** 
         *
         */        
        releaseHoldsBySelected : function(){
            this.trigger('releaseHolds', 'selected');
        },
        
        /** 
         *
         */        
        releaseHoldsByTemplate : function(){
            this.trigger('releaseHolds', 'template');
        },
        
        /** 
         *
         */        
        releaseHoldsBySearch : function(){
            this.trigger('releaseHolds', 'search');
        },

        /** 
         *
         */        
        generateTemplateAll : function(){
            this.trigger('generateTemplate', 'all');
        },

        /** 
         *
         */        
        generateTemplateSelected : function(){
            this.trigger('generateTemplate', 'selected');
        },

        /**
        *
        */
        setType : function(e){
            var target = $(e.currentTarget),
                id = target.attr('id');

            if(id === 'selectedType'){
                this.$el.find('.disable-over').addClass('hide');
                this.getSelectedPaymentTypes();
            }else{
                this.$el.find('.disable-over').removeClass('hide');
                //this.paymentTypes = [];
                this.paymentTypes = _.map(this.$el.find('.subtype'), function (subtype){
                    return $(subtype).data('paymenttype');
                });
            }
            this.trigger('setSelectedType', this.paymentTypes);
        },

        /**
        *
        */
        setSelectedType : function(e){
            var target = $(e.currentTarget),
                icon = target.find('.fa');

            this.paymentTypes = this.paymentTypes || [];

            if(icon.hasClass('fa-check-square')){
                icon.removeClass('fa-check-square').addClass('fa-square-o');
            }else{
                icon.addClass('fa-check-square').removeClass('fa-square-o');
            }
            this.getSelectedPaymentTypes();
            this.trigger('setSelectedType', this.paymentTypes);
       },

       /**
        *
        */
        getSelectedPaymentTypes : function(){
            var self = this,
                subtype;

            this.paymentTypes = [];
            
            this.$el.find('.subtype').each(function(){
                subtype = $(this);
                if(subtype.find('.fa').hasClass('fa-check-square')){
                    self.paymentTypes.push(subtype.data('paymenttype'));
                }
            });
        },
        /**
        *
        */
        preview : function(){
            this.trigger('preview');
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
        cleanUp : function(){
            if(this.periodDropdownView) this.periodDropdownView.cleanUp();// period filer
            if(this.formGroupView) this.formGroupView.cleanUp(); // clean up inputs
            this.undelegateEvents();// this view
        },
    });
    return ReleasedResultSidebarView;
});