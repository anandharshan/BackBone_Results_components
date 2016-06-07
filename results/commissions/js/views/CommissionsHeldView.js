define([
    'PeriodModel',
    'config',
    'CommissionsResultView',
    'CommissionFormItems',
    'ResultActionPopupView',
    'ReleaseHoldsPopupView',
    'i18n',
    'HeldRowView',
    'pageUtils'
], function(PeriodModel, config, CommissionsResultView, CommissionFormItems, ResultActionPopupView, 
            ReleaseHoldsPopupView, i18n, HeldRowView, pageUtils){

    /**
    * A Backbone View to render Commissions held data
    *
    * @module CommissionsHeldView
    */
    var CommissionsHeldView = CommissionsResultView.extend({

    	/**
         * type of commission to display
         *
         * @type {String} 
         */
        type: 'held', 

        rowExpandConfig :[
            {
                title: 'generalResultInfo',
                rows : [
                    ['reasonCodeName', 'name'],
                    ['earningGroupName', 'ruleName'],
                    ['estimatedReleaseDate']
                ]
            },
            {
                title: 'personInformation',
                rows : [
                    ['participantName', 'employeeStatus'],
                    ['positionName', 'businessGroupName']
                ]
            },
            {
                title: 'orderInformation',
                rows: [
                    ['orderCode', 'customerName'],
                    ['orderItemCode', 'geoName'],
                    ['productName', 'incentiveDate']
                ]
            },
            {
                title: 'commissionInformation',
                rows: [
                    ['originaAmountWithUnitType', 'measureValue'],
                    ['releaseAmountWithUnitType', 'rollingMeasureValue'],
                    ['heldAmountWithUnitType', 'attainmentValue'],
                    ['rateWithUnitType', 'rollingAttainmentValue'],
                    ['rateTableName', 'creditAmountWithUnitType'],
                    ['quotaName', 'actualReleaseDate'],
                    ['quotaPeriodType', 'rateTableTier'],
                    ['paymentFX', 'creditApplied']
                ]
            }
        ],

        tableHeaders : ["reasonCodeName", "name", "participantName","positionName",
                        "originaAmountWithUnitType", "releaseAmountWithUnitType", "heldAmountWithUnitType",
                        "orderCode","orderItemCode", "rateWithUnitType",
                        "held", "earningGroupName", "ruleName","paymentFX", "creditAmountWithUnitType"],

        defaultSortIndex : 0,

        amountMapForSort : {
            'amount' : 'originaAmountWithUnitType',
            'releasedAmount' : 'releaseAmountWithUnitType',
            'heldAmount' : 'heldAmountWithUnitType',
            'rateAmount' : 'rateWithUnitType',
            'creditAmount' : 'creditAmountWithUnitType'
        },

        rowView : HeldRowView,

        headerTemplate : _.template($('#held-header-template').html()),

		renderForm : function(){
            this.renderLandingSideBar( $('#held-landing-tmpl').html() ); 
            this.formGroupEl = this.$el.find('#list > .search-section');
            var heldInputObject = CommissionFormItems.getCommHeldFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.formGroups = heldInputObject.hiddenFormInputs;
            this.tabFormInputs = heldInputObject.tabFormInputs;
            this.renderFormGroups();
        },

        /**
         *
         */
        renderResults : function(){
            this.renderResultSideBar( $('#held-result-tmpl').html() );
            this.updateCachedPeriod();
            this.initCollection();
            this.enableItemsForWritePermission();
        },
        
        /** 
         *
         */        
        generateTemplate : function(templateType){
            if(this.rowsSelected.length > 1000 && templateType === 'selected'){
                var labels = {
                    header_i18n: "errorMessage"
                };
                labels.message = i18n.get(this.namespace, 'generateTemplate1000RecsSelected') || "[A maximum of 1000 records can be selected when generating a release template for selected holds.]";
                this.showNotification(labels, this.namespace);
                return;
            }
            this.generateTemplateConfig(templateType);
        },

        /** 
         *
         */ 
        generateTemplateConfig : function(templateType){
            var options = Object.create(null),
                downloadNameLabel = i18n.get(this.namespace, 'downloadName') || "[Download Name]";
            
            options.templateType = templateType;
            options.formTemplate = $('#downloadAndTemplateDownload-tmpl').html();
            options.title = i18n.get(this.namespace, 'generateTemplate') || "[Generate Template]";
            options.successMessage = i18n.get(this.namespace, 'downloadSubmitted') || "Sent to Downloads";
            options.cancelBtnLabel = i18n.get(this.namespace, 'cancel') || "[Cancel]";
            options.sucessBtnLabel = i18n.get(this.namespace, 'downloadButtonLabel') || "[Download]";
            options.downloadUrl = this.downloadUrl();
            options.validate = true;
            options.rowsSelected = this.rowsSelected;
            options.downloadTemplateUrl = this.downloadTemplateUrl();

            options.formElements = [
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
                }
            ];
            this.templateRequested = true;
            this.showPopup(options);
        },

        /** 
         *
         */        
        releaseHolds : function(releaseType){
            var options = Object.create(null);
            options.releaseType = releaseType;
            options.successMessage = i18n.get(this.namespace, 'addedToQueue') || "[Added to Queue]";
            options.cancelBtnLabel = i18n.get(this.namespace, 'cancel') || "[Cancel]";
            options.sucessBtnLabel = i18n.get(this.namespace, 'addToQueue') || "[Add to Queue]";
            options.releaseItemType = this.releaseItemType;

            // get unique earningGroupsIds
            var earningGroupsIds = _.uniq(_.pluck(this.rowsSelected, 'earningGroupId'));
            

            if(releaseType === 'template'){
                options.title = i18n.get(this.namespace, 'releaseByTemplate') || "[Release by Template]";
                options.formTemplate = $('#releaseByTemplate-tmpl').html(); // by template
                options.formElements = CommissionFormItems.getReleaseByTemplateForm(this.namespace, this.pageName, this.formInputValues);
            }else{
                if(releaseType === 'selected'){
                    options.rowsSelected = this.rowsSelected;
                    var earningGroupsIds = _.pluck(this.rowsSelected, 'earningGroupId'); // grab earningGroupId from each selected row
                    var uniqueEarningGroupsIds = _.uniq(earningGroupsIds);  // get unique earningGroupsIds
                    
                    // find rows where earningGroupId is NOT empty, undefined or null 
                    // empty, undefined or null will set the truthyValuePresent to false
                    var truthyValuePresent = _.every(earningGroupsIds, _.identity);

                    // if only one and truthyValuePresent=true then set that as default
                    this.formInputValues.earningGroupName = "";
                    if(uniqueEarningGroupsIds.length === 1 && truthyValuePresent){
                        this.formInputValues.earningGroupName = [{
                            id : this.rowsSelected[0].earningGroupId,
                            name : this.rowsSelected[0].earningGroupName
                        }];
                    }
                }
                options.title = i18n.get(this.namespace, 'releaseSelected') || "[Release Selected]";
                options.formTemplate = $('#releaseBySelected-tmpl').html();// search or selected
                options.formElements = CommissionFormItems.getReleaseBySelectedForm(this.namespace, this.pageName, this.formInputValues);
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
            options.searchfields = _.clone(this.searchfields);
            options.searchtext = _.clone(this.searchtext);

            this.resultActionPopup = new ReleaseHoldsPopupView(options);
            this.resultActionPopup.render();
            this.listenToOnce(this.resultActionPopup, 'cancel', this.cancelAction);
            this.listenToOnce(this.resultActionPopup, 'success', this.sucessAction);
        },  

        /** 
         *
         */
        showPopup : function(options){
            if(this.resultActionPopup) this.resultActionPopup.cleanUp();

            options.el = $('#modalContainer');
            options.namespace = this.namespace;
            options.searchfields = _.clone(this.searchfields);
            options.searchtext = _.clone(this.searchtext);

            this.resultActionPopup = new ResultActionPopupView(options);
            this.resultActionPopup.render();
            this.listenToOnce(this.resultActionPopup, 'cancel', this.cancelAction);
            this.listenToOnce(this.resultActionPopup, 'success', this.sucessAction);
            if(this.templateRequested){
                options.el.find('#downloadFormat').hide(); //
                this.listenToOnce(this.resultActionPopup, 'success', this.downloadNotificationIcon);
                this.templateRequested = false;
            }
        },

        /**
         *
         */
        sucessAction : function(){
            this.cleanPopup();
        },

        /**
         *Update the download item count in Incent top right corner.
         */
        downloadNotificationIcon : function(){
            if(pageUtils && pageUtils.xRootContainer()){
                try{
                    pageUtils.xRootContainer().Notifications.unreadCount += 1;
                    pageUtils.xRootContainer().Notifications.updateBadge(pageUtils.xRootContainer().Notifications.unreadCount);
                }catch(e){}
            }
        },

        /**
         *
         */
        cleanUp : function(){
            this.cleanPopup();
            CommissionsResultView.prototype.cleanUp.call(this);
        }
    });
    return CommissionsHeldView;
});