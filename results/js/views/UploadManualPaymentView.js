define([
    'jquery',
    'PopupView',
    'i18n',
    'ResultActionPopupView',
    'jqueryFileUpload',
    'config',
    'ManualPaymentDuplicatesPopupView',
    'loglevel',
    'dialogView'
], function($, PopupView, i18n, ResultActionPopupView, jqueryFileUpload, config, ManualPaymentDuplicatesPopupView, Log, DialogView){

    /**
    * A Backbone View to perform release of held data 
    *
    * @module UploadManualPaymentView
    */
    var UploadManualPaymentView = ResultActionPopupView.extend({

        isFileuploadBound : false,


        //TODO :: incorporate for loop for iteration as well.
        errorLogTemplate : _.template(
            "<li class='list-item-row row'>\
                <span class='rowIndexClass'>Row <%=rowIndex%></span>\
                <span class='errorMsgClass'><%=errorMsg%></span>\
            </li>"
        ),

        /**
         * Show pop up
         * overridden to change the width
         */
        render : function(){
            ResultActionPopupView.prototype.render.call(this);
            this.$el.find(".modal")[0].style.width = "1000px";
            this.$el.find(".modal")[0].style.marginLeft = "-500px";
        },


        //Inherit parents event and then extent it with additional events
        events: function(){
          return _.extend({},ResultActionPopupView.prototype.events,{
              'click .tag-manualpayment-template-link' : 'downloadTemplate',
              'click .downloadErrorLog' : 'downloadErrorLog'
          });
        },

        //Download error log when there are validation error that is shown in the upload
        downloadErrorLog: function() {
            //xdmUploadId is param expected
            var paramsForDownload = '';
            paramsForDownload = '?xdmUploadId=' + this.xdmUploadId;
            console.log("Download the file :: " + config.appContext + "/api/v1/manualpayment/downloadErrorLog" + paramsForDownload);
            window.location = config.appContext + "/api/v1/manualpayment/downloadErrorLog" + paramsForDownload;
        },

        /**
         *When User presses the upload button
         */
        doneButtonAction: function(){
            var self = this,
                formData = {},
                paramData = {},
                fileUploadId, model, paramName, paramValue;
            
            var valid = true;
            for(var i = 0; i < this.formElementViews.length; i++){
                this.formElementViews[i].validate();
                model = this.formElementViews[i].model;
                if(valid){
                    valid = model.isValid();
                }
                paramName = model.get('id');
                paramValue = model.get( paramName );
                if(model.get('type') === 'fileInput'){
                    fileUploadId = paramName;
                }else{
                    paramData[paramName] = paramValue || null;
                }
            }

            paramData['autoCreateReasonCodes'] = this.$el.find('#autoCreateReasonCode').prop("checked");
            
            if(!valid){
                return;
            }
          
            this.$el.find("#uploadManualPaymentForm").fileupload();
            this.isFileuploadBound = true;
            this.clearValidationErrors();
            this.uploadManualPaymentData(paramData);

        },


        //Triggered when clicked on CLICH HERE link to download the template
        downloadTemplate: function() {
            Log.info("Download the file :: " + config.appContext + "/api/v1/manualpayment/downloadTemplate");
            window.location = config.appContext + "/api/v1/manualpayment/downloadTemplate";
        },

        /**
         *This uploads the csv file and fromData (autoCreateReasonCode)
         */
        uploadManualPaymentData : function(formData){
            var self = this,
                filesList = this.$el.find('#templateFile')[0].files;
            
            this.$el.find('#uploadManualPaymentForm').fileupload('option', {
                url: config.appContext + "/api/v1/manualpayment/upload?autoCreateReasonCodes=" + formData.autoCreateReasonCodes,
                add :function(e, data){
                    data.submit()
                    .success(function (response, textStatus, jqXHR) {
                        Log.info("Upload Manual payment is a complete Success");
                        //TODO :: check for 3 conditions, Full Success, validation error , Duplicates
                        //If Succcess, do action completed
                        //If validation error , then show the Grid with rowId and error below.also the download error link as well
                        //If Duplicates, then show the duplicates pop up. with all actions in it.
                        if(jqXHR.responseText === "SENT TO QUEUE"){
                            Log.info("Upload Manual payment is a complete Success");
                            if($(".search-sidebar")[0]){
                                $(".search-sidebar")[0].click(); 
                            } 
                            self.actionComplete(response, textStatus, jqXHR);    
                        }else if(jqXHR.responseJSON && jqXHR.responseJSON.constructor == Array ){
                            Log.info("Handle validation errors of Upload Manual Payment");
                            self.xdmUploadId = jqXHR.responseJSON[0].xdmUploadId;
                            //xdmUploadId is being stored for download error log.
                            //Show the 22 error logs which is returned from Backend API
                            self.showValidationErrors(jqXHR.responseJSON);
                            self.isFileuploadBound = false;
                            self.$el.find('#uploadManualPaymentForm').fileupload('destroy');
                        }else if(jqXHR.responseJSON && jqXHR.responseJSON.xdmUploadId){
                            Log.info("Handling Duplicates in Upload Manual Payment");
                            //Show Duplicates OverLay
                            self.showDuplicatesOverlay(jqXHR.responseJSON.xdmUploadId, $('#autoCreateReasonCode').prop("checked"));
                            self.cleanUp();
                        }else{
                            Log.error("This scenario is never expected to be encountered.");
                        }    
                    })
                    .error(function (jqXHR, textStatus, errorThrown) {
                        //clean up the upload popup and show the error messages thrown from the backend
                        if(jqXHR.responseJSON.error === 5208 || jqXHR.responseJSON.error === 5221){
                            self.showOtherValidationErrors(jqXHR.responseJSON);
                            self.isFileuploadBound = false;
                            self.$el.find('#uploadManualPaymentForm').fileupload('destroy');
                        }else{
                            self.cleanUp();
                            self.errorCB(jqXHR, textStatus, errorThrown);
                        }
                    });
                }
            }).fileupload('add', {
                // this will trigger add callback above
                files: filesList
            });
        },

        /*
        *show invalid file error or 2000 record count error
        */
        showOtherValidationErrors : function(errorJson){
            this.$el.find('.otherErrorListingArea').html(errorJson.message);
            this.$el.find('.otherErrorListingArea').removeClass("hide");
            $(".error_section").removeClass("hide");
            $(".ErrorListingSection").addClass("hide");
        },

        /*
        *show the 22 error messages that is returned form the backend.
        */
        showValidationErrors : function(data){
            //Iterate over the list of 22 records and use a template to form HTMl and append to "errorListBody"
            //pass in the array of validation error, and template should take care of the rest.
            var allRowsHtml = '';
            for(var i=0; i<data.length; i++){
                allRowsHtml += this.errorLogTemplate(data[i]);
            }
            this.$el.find('.errorListBody').html(allRowsHtml);
            this.$el.find('.otherErrorListingArea').addClass("hide");
            $(".error_section").removeClass("hide");
            $(".ErrorListingSection").removeClass("hide");
        },

        /*
        *cleanup the validation error that is already populated.
        */
        clearValidationErrors : function(){
            $(".error_section").addClass("hide");
            $(".otherErrorListingArea").addClass("hide");
            $(".ErrorListingSection").addClass("hide");
            $(".otherErrorListingArea").html('');
            this.$el.find(".errorListBody").html('');
        },

         /**
         * Render overlay for duplicates
         *
         */
        showDuplicatesOverlay : function(xdmUploadId, autoCreateReasonCodes){
            this.popupView = new ManualPaymentDuplicatesPopupView({
                el : $('#popupDiv'),
                title : 'Duplicate Payment(s)',
                downloadBtnLabel : i18n.get(this.namespace, 'download') || "[Download]",
                discardBtnLabel: i18n.get(this.namespace, 'discardBtnLabel') || "[Discard]",
                acceptSelectedBtnLabel: i18n.get(this.namespace, 'acceptSelectedBtnLabel') || "[Accept Selected]",
                acceptAllBtnLabel: i18n.get(this.namespace, 'acceptAllBtnLabel') || "[Accept All]",
                namespace : this.namespace,
                multiSelect : true,
                xdmUploadId : xdmUploadId,
                autoCreateReasonCodes : autoCreateReasonCodes
            });
            this.popupView.renderTable();
            this.popupView.render();
            this.listenToOnce(this.popupView, 'selected', this.itemsSelected);
            this.listenToOnce(this.popupView, 'selected', this.cleanUpOverlay);
            this.listenToOnce(this.popupView, 'cancel', this.cleanUpOverlay);
        },

        /**
         *This creates a pop up for showing the error returned from the backend
         */
        errorCB : function(jqXHR, options){
            if(jqXHR.status === 401){
                // implement this in global ajax handler
            }
            var message = jqXHR.responseJSON && jqXHR.responseJSON.message;
            if(!message){
                // get geenric message
                message = i18n.get(this.namespace, 'errorMessage') || 'Unable to complete your request. Click Reset or contact Xactly Support for further assistance.';
            }
            //this.showXHRErrorMessage(jqXHR);
            var labels = {
                header_i18n: "errorMessage"
            };
            labels.message = $.parseJSON(jqXHR.responseText).message;
            this.showNotification(labels, this.namespace);
        },

        /**
         *This is to show the validation message as a pop up.
         */
        showNotification: function(labels, namespace) {
          var dialogOptions = {},
            dialogView,
            self = this;

          dialogOptions.namespace = namespace || "icmadvanced.default";
          dialogOptions.labels = labels;
          dialogView = new DialogView(dialogOptions);
          dialogView.render();
          self.listenToOnce(dialogView, "confirm", function() {
            self.stopListening(dialogView);
            dialogView.stopListening();
          });
        },

        /**
         *clear the listener fot fileupload
         *call the parent class to clean up
         */
        cleanUp : function(){
            if(this.isFileuploadBound){
                this.$el.find('#uploadManualPaymentForm').fileupload('destroy');
            }
            if(this.$el.find(".modal")[0]){
               this.$el.find(".modal")[0].style =""; 
            }
            ResultActionPopupView.prototype.cleanUp.call(this);
        }
       
    });
    return UploadManualPaymentView;
});
