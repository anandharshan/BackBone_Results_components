define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    'ManualPaymentCollection',
    'ManualPaymentModel',
    'PaymentFormItems',
    'DownloadView',
    'LegacyPagedCollection',
    'PaymentsResultView',
    'HeldRowView',
    'UploadManualPaymentView',
    'CommentView',
    'dialogView',
    'ManualPaymentAuditLogCollection',
    'loglevel',
], function($, _, Backbone, config, i18n, pageUtils, ManualPaymentCollection, ManualPaymentModel,
            PaymentFormItems, DownloadView, LegacyPagedCollection, PaymentsResultView, 
            HeldRowView, UploadManualPaymentView, CommentView, DialogView, 
            ManualPaymentAuditLogCollection, Log){

    /**
    * A Backbone View to render Payment Balances data
    *
    * @module PaymentBalancesView
    */
    var ManualPaymentsView  = PaymentsResultView.extend({

        /**
         * type of payment to display
         *
         * @type {String} 
         */
        type: 'manualPayments',
    	
    	/**
	     * default primaryButtonKey. Override this property in your view.
	     *
	     * @type {String} 
	     */
	    primaryButtonKey : "",

        mixPanelTag : 'Results:Payment Manual Payment',

        detailsTemplate : _.template( $('#manualpayment-detail-row-template').html() ),

        rowExpandConfig :[
            {
                title: 'standardManualPayments',
                rows : [
                    ['participantName', 'itemAmountWithUnitType'],
                    ['incentiveDate']
                ]
            },
            {
                title: 'optionalManualPayments',
                rows : [
                    ['earningGroupName'], //'orderCode'
                    ['reasonCodeName']    //'orderItemCode'
                ]
            }
        ],

        tableHeaders : [
            "participantName",
            "positionName", 
            "businessGroupName",
            //"orderCode",
            //"orderItemCode",
            "itemAmountWithUnitType",
            "earningGroupName",
            "incentiveDate",
            "reasonCodeName"
        ],

        defaultSortIndex : 0,

        amountMapForSort : {
            'amount' : 'itemAmountWithUnitType'
        },
        
        rowView : HeldRowView,

        headerTemplate : _.template($('#held-header-template').html()),

        auditRowTemplate : _.template($('#manualpayment-audit-row-template').html()),

        /**
         *
         */
        renderResults : function(){
            this.sidebarInputs = [];
            this.renderResultSideBar( $('#manual-payment-result-tmpl').html() );
            this.initCollection();
            this.enableItemsForWritePermissionForResultsPage();
        },

        /**
         *
         */
        renderBasicSearchView : function(){
            this.formGroupEl = this.$el.find('#list > .search-section');
            //Depends on primaryButtonKey which is set to  "".
            this.renderLandingSideBar( $('#mp-landing-tmpl').html() ); // render sidebar
            this.renderForm();
        },

        renderForm : function(){
            this.formGroups = PaymentFormItems.getManualPaymentsFromGroups(this.namespace, this.pageName, this.formInputValues);
            this.renderFormGroups();
            this.enableItemsForWritePermissionForLandingPage();
        },

        deletePayment : function(){
        	console.log("delete payments is clicked.");
            var rowsSelectedForDeletionArray = this.rowsSelected;
            var rowIds = _.pluck(rowsSelectedForDeletionArray,"id");
            var rowWSOs = [];

            // Format in which the delete ids needs to be passed to backend
            // [{
            // "id": "1"
            // }, {
            // "id": "2"
            // }]
            for (var i=0; i<rowIds.length; i++){
                var rowWSO = {};
                rowWSO.id = rowIds[i];
                rowWSOs.push(rowWSO);
            }

            var self = this,
                dialogOptions = {},
                dialogView;

            dialogOptions.showCancel = true;
            dialogOptions.namespace = this.namespace;
            dialogOptions.labels = {
                header_i18n: "confirmDeleteHeader",
                message_i18n: "confirmDeleteOfManualPayments",
                confirmButton_i18n: "delete"
            };
            dialogView = new DialogView(dialogOptions);
            dialogView.render();
            self.listenToOnce(dialogView, "cancel", function() {
                self.stopListening(dialogView);
                dialogView.stopListening();
            });
            self.listenToOnce(dialogView, "confirm", function() {
                var urlWithParams = config.appContext + "/api/v1/manualpayment/delete";

                $.ajax({
                    url: urlWithParams,
                    type: 'POST',
                    contentType : 'application/json',
                    data: JSON.stringify(rowWSOs)
                }).done(function(){
                    Log.info("Manual payments are deleted.");
                    self.dataCollection.fetch();
                    var showMessage = i18n.get(self.namespace, 'sentToQueue') || "[Sent to Queue]";
                    $("#uiActionMsg").showMessage(showMessage);

                }).fail(function(xhr,responseText){
                 var message  = "Unknown Error";
                  try{
                      message = $.parseJSON(xhr.responseText).message;
                  }catch(err){   
                  }
                  var labels = {
                      header_i18n: "errorMessage",
                      message: message
                  };
                  if(xhr.responseJSON.error === 5216){
                    labels.header_i18n = "errorMessageUnableToDeletePayment";
                  }
                  setTimeout(function(){
                      self.showNotification(labels, self.namespace);  
                  }, 500); 
                });
                self.stopListening(dialogView);
                dialogView.stopListening();
            });
        },

        /*
        *Disables the Release Holds and comments
        */
        disableSidebarActions : function(){
            this.disableDeleteAction();
            this.disableAddCommentActions();
        },

        /*
        *Enables the Release Holds and comments
        */
        enableSidebarActions : function(){
            this.enableDeleteAction();
            this.enableAddCommentActions();
        },

         /*
        *Disables the Add comments
        */
        disableDeleteAction : function(){
            this.$el.find('.delete-payment').removeClass('enabled').addClass('disabled').prop('disabled', true);
        },

        /*
        *Enables the Add comments
        */
        enableDeleteAction : function(){
            this.$el.find('.delete-payment').addClass('enabled').removeClass('disabled').prop('disabled', false);
        },
        
        /*
        *triggered when the user clicks addManualPayment in sidebar
        */
        addManualPayment : function(){
        	console.log("add manual payment is clicked for period :: ." + this.selectedPeriod.get('id'));
            var routeURL = "results/payments/addmanualpayments";
            if(this.selectedPeriod.get('id')){
                routeURL += "/" + this.selectedPeriod.get('id');
            }
            config.router.navigate(routeURL, {trigger: true});
        },

        /*
        *Opens the upload Manual payment dialog box
        */
        uploadManualPayment : function(){
            console.log("upload Manual payment is clicked.")
            var options = Object.create(null);
            //configure the pop up button labels
            options.successMessage = i18n.get(this.namespace, 'sentToQueue') || "[Sent to Queue]";
            options.cancelBtnLabel = i18n.get(this.namespace, 'cancel') || "[Cancel]";
            options.sucessBtnLabel = i18n.get(this.namespace, 'upload') || "[Upload]";
            
            options.title = i18n.get(this.namespace, 'upload_Manual_Payments') || "[Upload Manual Payments]";
            options.formTemplate = $('#uploadManualPayment-tmpl').html(); // by template
            options.formElements = PaymentFormItems.generateUploadManualPaymentPage(this.namespace, this.formInputValues);

            this.showuploadManualPaymentPopup(options);
        },

        /** 
         *
         */
        showuploadManualPaymentPopup : function(options){
            if(this.resultActionPopup) this.resultActionPopup.cleanUp();

            options.el = $('#modalContainer');
            options.namespace = this.namespace;
            options.searchfields = _.clone(this.searchfields);
            options.searchtext = _.clone(this.searchtext);

            this.resultActionPopup = new UploadManualPaymentView(options);
            this.resultActionPopup.render();
            this.listenToOnce(this.resultActionPopup, 'cancel', this.cancelAction);
            this.listenToOnce(this.resultActionPopup, 'success', this.sucessAction);
        }, 

        /**
         *Download for the template, again this function is written because paymentResultView.js has another version of it.
         */
        downloadUrl : function(){
            return config.appContext + "/api/v1/manualpayment/download";
        },

        /**
         *
         */
        download : function(){
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
                searchtext : this.searchtext
            });
            this.downloadView.render();
            this.listenToOnce(this.downloadView, 'cancel', this.cancelDownload);
            this.listenToOnce(this.downloadView, 'success', this.downloadDone); 
        },

        /**
         *
         */
        initCollection :function(){
            this.loadHeaders();
            this.includePeriodAndType();
            this.dataCollection = new ManualPaymentCollection();
            this.dataCollection.model = ManualPaymentModel;
            this.dataCollection.url =  config.appContext + "/api/v1/manualpayment";
            this.dataCollection.params.limit = 50;
            this.dataCollection.params.offset = 0;
            this.dataCollection.params.searchfield = this.searchfields;
            this.dataCollection.params.searchtext = this.searchtext;
            this.dataCollection.params.currentPage = 1;

            this.listenTo(this.dataCollection, 'error', this.error);
            this.listenToOnce(this.dataCollection, 'sync', this.renderBreadCrumView);    // optimize to update table only  
            this.renderTableView();          
        },

         /**
         *This function updates the search Parameters
         */
        includePeriodAndType :function(){
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
            options.heldObjType = "manualpayment";
            
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
        sucessAction : function(){
            this.cleanPopup();
        },

        /**
         *
         */
        cancelAction : function(){
            this.cleanPopup();
        },

        enableItemsForWritePermissionForLandingPage : function(){
            if(config.mpPermissions && config.mpPermissions.value !== 'READ_WRITE'){
                this.$el.find('.sidebar-item .upload-button').remove();
                this.$el.find('.sidebar-item .add-manual-payment').remove();
            }
        },

        enableItemsForWritePermissionForResultsPage : function(){
            if(config.mpPermissions && config.mpPermissions.value !== 'READ_WRITE'){
                this.$el.find('.sidebar-item .upload-button').remove();
                this.$el.find('.sidebar-item .add-manual-payment').remove();
                this.$el.find('.sidebar-item .delete-payment').remove();
                this.$el.find('.sidebar-item .add-comment').remove();
                this.$el.find('.secondary-button.download-button').remove();
            }else {
                this.$el.find('.primary-button.download-button').remove();
            }
        },

        /**
         * toggles between details and audit section in expanded row
         */        
        toggleDetailAudit : function(e){
            var target = $(e.currentTarget),
                id = target.data('id'),
                manualPaymentId = target.data('manualpaymentid'),
                parent = target.parents('.res-row-details'),
                width = parent.width();
            parent.find('.expansion-section').addClass('hide');
            parent.find('#'+id).removeClass('hide');
            parent.find('.legend').removeClass('selected');
            target.addClass('selected');

            if(id === 'audit'){
                this.loadManualPaymentAudit(manualPaymentId, width);
            }
        },

        /**
         *
         */
        loadManualPaymentAudit : function(manualPaymentId, width){
            config.tempCache = config.tempCache || {};
            var self = this,
                cacheKey = 'ManualPaymentAudit-'+manualPaymentId,
                cachedAuditData = config.tempCache[cacheKey];
            
            if(!cachedAuditData){
                // get data
                this.auditLogCollection = new ManualPaymentAuditLogCollection({
                    id: manualPaymentId
                });
                this.auditLogCollection.fetch({
                    success: function(collection){
                        config.tempCache[cacheKey] = collection;  // add to cache
                        self.showAuditDetail(collection, manualPaymentId, width); // show details
                    },
                    error:function(){
                        self.showAuditDetail(null, manualPaymentId, width); // show error
                    }
                });
            }else{
                self.showAuditDetail(cachedAuditData, manualPaymentId, width); // show details
            }
        },

        /**
         *
         */
        showAuditDetail : function(collection, manualPaymentId, width){
            if(collection.length === 0){
                var message = i18n.get(this.namespace, 'noAuditData') || "[Audit details not found]";
                this.$el.find("#audit-"+manualPaymentId).html("<tr><td colspan='5>"+message+"</td></tr>");
                return;
            }
            this.auditRows = [];
            collection.forEach(this.auditRow, this);
            this.$el.find("#audit-"+manualPaymentId).html(this.auditRows.join(''));
            this.$el.find("#audit-"+manualPaymentId).find('td').css('min-width', ((width-62)/5)-34); // 62 =padding by parents,34 =padding of cell
        },

        /**
         *
         */
        auditRow : function(model){
            var json = model.toJSON();
            this.auditRows.push(
                this.auditRowTemplate(json)
            );
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
            this.undelegateEvents();
            PaymentsResultView.prototype.cleanUp.call(this);
        }
    });
    
    return ManualPaymentsView;
});
