define([
    'CreditsResultView',
    'CreditFormItems',
    'CommentView',
    'ResultActionPopupView',
    'ReleaseHoldsPopupView',
    'i18n',
    'HeldRowView'
], function(CreditsResultView, CreditFormItems, CommentView, ResultActionPopupView, ReleaseHoldsPopupView, i18n, HeldRowView){

    /**
    * A Backbone View to render Credits held data
    *
    * @module CreditsHeldView
    */
    var CreditsHeldView = CreditsResultView.extend({

    	/**
         * type of credits to display
         *
         * @type {String} 
         */
        type: 'held', 

        rowExpandConfig :[
            {
                title: 'generalResultInfo',
                rows : [
                    ['reasonCodeName', 'name'],
                    ['estimatedReleaseDate', 'ruleName']
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
                title: 'creditInformation',
                rows: [
                    ['amountWithUnitType', 'creditType']
                ]
            }
        ],

        tableHeaders : ["reasonCodeName","name","participantName","positionName","amountWithUnitType",
            "orderCode","orderItemCode","creditType","held","ruleName"],

        defaultSortIndex : 0,

        rowView : HeldRowView,

        headerTemplate : _.template($('#held-header-template').html()),


		renderForm : function(){
            this.renderLandingSideBar( $('#held-landing-tmpl').html() ); 
            this.formGroupEl = this.$el.find('#list > .search-section');
            var heldInputObject = CreditFormItems.getCreditHeldFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.formGroups = heldInputObject.hiddenFormInputs;
            this.tabFormInputs = heldInputObject.tabFormInputs;
            this.renderFormGroups();
        },

        /**
         *
         */
        renderResults : function(){
            this.renderResultSideBar( $('#held-result-tmpl').html() );
            this.initCollection();
            this.enableItemsForWritePermission();
            this.$el.find('.generate-template').remove();
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
            
            if(releaseType === 'selected'){
                options.rowsSelected = this.rowsSelected;
                // get unique earningGroupsIds
                var earningGroupsIds = _.uniq(_.pluck(this.rowsSelected, 'earningGroupId'));
                // if only one then set that as default
                if(earningGroupsIds.length === 1){
                    this.formInputValues.earningGroup = [{
                        id : this.rowsSelected[0].earningGroupId,
                        name : this.rowsSelected[0].earningGroupName
                    }];
                }
                options.title = i18n.get(this.namespace, 'releaseSelected') || "[Release Selected]";
                options.formTemplate = $('#releaseBySelected-credit-tmpl').html();// search or selected
                options.formElements = CreditFormItems.getReleaseBySelectedForm(this.namespace, this.pageName, this.formInputValues);
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
        },

        /**
         *
         */
        sucessAction : function(){
            this.cleanPopup();
        },

        /**
         *
         */
        cleanPopup : function(){
            if(this.rowsSelected && this.rowsSelected.length === 1){
                this.formInputValues.earningGroup = null;
            }

            if(this.commentView) this.commentView.cleanUp();
            if(this.resultActionPopup) this.resultActionPopup.cleanUp();
        },

        /**
         *
         */
        cleanUp : function(){
            this.cleanPopup();
            CreditsResultView.prototype.cleanUp.call(this);
        }

        
    });
    return CreditsHeldView;
});