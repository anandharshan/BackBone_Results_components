define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    'ResultsView',
    'BonusCollection',
    'BonusFormItems',
    'ReleasedRowView',
    'CommentView',
    'ResultsSolrCollection',
    'BonusModel',
    'userConfig'
], function($, _, Backbone, config, i18n, pageUtils, ResultsView, BonusCollection, 
    BonusFormItems, ReleasedRowView, CommentView, ResultsSolrCollection, BonusModel, userConfig){

    /**
    * A Backbone View to render Bonus data
    *
    * @module BonusesResultView
    */
    var BonusesResultView = ResultsView.extend({

        /**
         * type of credits to display
         *
         * @type {String} 
         */
        type: 'release', 

        /**
         * default header. Override this property in your view.
         *
         * @type {String} 
         */
        header : "Bonuses",
    
        mixPanelTag : 'Results:Bonuses',

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
                title: 'bonusInformation',
                rows: [
                    ['amountWithUnitType', 'releaseDate']
                ]
            }
        ],

        tableHeaders : ["name","participantName","positionName", "amountWithUnitType",
            "orderCode","orderItemCode","held","earningGroupName","ruleName","createdDate"],

        defaultSortIndex : 0,

        // for bonus held, this will be used
        amountMapForSort : {
            'amount' : 'amountWithUnitType'
        },

        rowView : ReleasedRowView,

        headerTemplate : _.template($('#released-header-template').html()),

        releaseItemType : 'Bonus',

        primaryButtonKey : "",

        /**
         *
         */
        render : function(){
            this.loadSettings();
        },
        
        /**
         *
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
            this.renderLandingSideBar( $('#relased-landing-tmpl').html() ); // render sidebar
            this.renderForm();
        },

        renderForm : function(){
            this.formGroups = BonusFormItems.getBonusReleaseFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.renderFormGroups();
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
                    objectType : this.solrEntityMap[this.pageName], // we will not use this.pageName 
                    objectStatus : this.type,
                    filters : [],
                    model : BonusModel
                });
            }else{
                this.dataCollection = new BonusCollection();
                this.dataCollection.url =  config.appContext + "/api/v1/bonuses";
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
         *This function updates the search Parameters
         *called while initialization of the sidebar calendar
         */
        includePeriodAndType :function(){
            this.updateSearchParams('type', this.type);
            this.updatePeriod();
        },

        /**
         *
         */
        resizeCommentsColumn : function(){
            var comment = this.dataCollection.find(function(model){ 
                return model.get('commentCount') > 0; 
            });
            if(!comment){
                //Commenting out the code to hide the checkbox field in case there is no comments
                //var cells = this.$el.find('.action-cell').addClass('zeroComments');
            }
        },

        /** 
         *
         */        
        addComment : function(fromBubble){
            if(this.commentView) this.commentView.cleanUp();
            
            var options = Object.create(null);
            options.el = $('#modalContainer');
            options.type = this.type;

            options.formTemplate = $('#add-view-comment-tmpl').html();
            if(fromBubble){
                options.title = i18n.get(this.namespace, 'commentsTitle') || "[Comments]";
                options.heldObjId = this.currentSelectedRow.id;
                if(this.ppaEnabled === true){
                    options.heldObjId = this.currentSelectedRow.BONUS_ID;
                }
                options.selectedRows = [this.currentSelectedRow];
            }else{
                options.selectedRows = _.clone(this.rowsSelected);
                options.title = i18n.get(this.namespace, 'addComment') || "[Add Comment]";
            }
            options.successMessage = i18n.get(this.namespace, 'commentAdded') || "Comments added";
            options.cancelBtnLabel = i18n.get(this.namespace, 'cancel') || "[Cancel]";
            options.sucessBtnLabel = i18n.get(this.namespace, 'addComment') || "[Add Comment]";
            options.comments = this.comments;
            options.namespace = this.namespace;
            options.heldObjType = this.releaseItemType;
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
            ResultsView.prototype.cleanUp.call(this);
        }

    });
    
    return BonusesResultView;
});
