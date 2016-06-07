define([
    'jquery',
    'underscore',
    'backbone',
    "savedSearchCollection",
    "savedSearchModel",
    "currentUserModel",
    "config",
    "i18n",
    "textField",
    "BaseEditView",
    "PaymentFormItems",
    "ObjectInputFactory",
    "loglevel",
    "ManualPaymentDuplicatesPopupView",
    'dialogView',
    'userConfig',
    'moment'
], function($, _, Backbone, SavedSearchCollection, SavedSearchModel, CurrentUserModel, 
            config, i18n, TextFieldInput, BaseEditView, PaymentFormItems, ObjectInputFactory, Log, ManualPaymentDuplicatesPopupView, DialogView, userConfig, moment){

    /**
    * A Backbone View to edit Settings and SavedSearch 
    *
    * @module SavedSearchEditorView
    */
    var AddManualPaymentView = BaseEditView.extend({
        
        namespace: "icmadvanced.results",

        useModalValidation : false,

        /**
         * main template
         *
         * @type jquery {String} 
         */
        template : _.template(
            "<div id='addManualPage_container' class='page-container'>\
                <div class='page-title-box'>\
                    <div class='page-title' id='page-header'> <%=title%> </div>\
                    <div class='rightHelpMenu'>\
                        <span id='cancel-button' class='cancel-button x-cancel-button'>\
                          <span><%= cancelBtnLabel %></span>\
                      </span>\
                      <span id='confirm-button' class='done-button x-button x-button-enabled'>\
                        <%= sucessBtnLabel %>\
                      </span>\
                    </div>\
                </div>\
                <div id='inner-content' class='clearfix'>\
                    <div id='list' class='list-pane'>\
                        <div class='addManualPayment-content'>\
                            <div id='errorGutter' class='row-fluid clearfix' ></div>\
                            <div id='addManualPaymentPlaceHolder' class='clearfix'>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
                <div class='page-title-box page-footer-box'>\
                    <div class='rightHelpMenu'>\
                        <span id='cancel-button' class='cancel-button x-cancel-button'>\
                          <span><%= cancelBtnLabel %></span>\
                      </span>\
                      <span id='confirm-button' class='done-button x-button x-button-enabled'>\
                        <%= sucessBtnLabel %>\
                      </span>\
                    </div>\
                </div>\
            </div>"
        ),

        events: {
             "click .cancel-button"                  : "returnToPrevPage", 
             "click .done-button"                    : "save"
        },

        /**
         *
         *
         */
        initialize: function(options){
            _.extend(this, options);

            var modelOpts = {};
            modelOpts.type = this.objectType;
            this.formElements = PaymentFormItems.generateAddManualPage(this.namespace, 'addManualPayment', options);
        },

        /**
         *
         *
         */
        render : function(){
            Log.info("Rendering Add manual payment page");
            this.renderPage();
        },

        /**
         *
         *
         */
        renderPage : function(){ 
            var data = {
                title : i18n.get(this.namespace, 'addManualPayment') || "[Add Manual Payment]",
                cancelBtnLabel : i18n.get(this.namespace, 'cancel') || "[Cancel]",
                sucessBtnLabel : i18n.get(this.namespace, 'save') || "[Save]"
            };
            this.$el.html(this.template(data));
            this.$el.find('#addManualPaymentPlaceHolder').html($('#addManualPayment-tmpl').html());
            this.$el.xlate({
                namespace: this.namespace
            }); 
            this.renderFormElements();
        },

        /**
         *
         */
        renderFormElements : function(){
            if(!this.formElements) return;
            this.formElementViews = [];
            this.formElements.forEach(this.renderFormElement, this);
        },

        /**
         *
         */
        renderFormElement : function(formElement){
            formElement.namespace = this.namespace;
            formElement.$el = this.$el.find('#'+formElement.id+'Input');
            var inputView = ObjectInputFactory[formElement.id](formElement);
            this.formElementViews.push(inputView);
        },
        
        /**
         *Invoked On click of save
         *Map the parameters properly, do validation
         *call the submit method
         *
         */
        save : function(){
            this.saveTriggered = true;
            var paramValueMapping = {
                "participantName" : "participantId",
                "incentiveDate" : "incentiveDate",
                "earningGroupName" : "earningGroupId",
                "orderCode" : "orderCode",
                "orderItemCode" : "orderItemCode",
                "reasonCodeName" : "reasonCodeId"
            };

            var formData = {},paramData = {}, model, paramName, paramValue;
            
            var valid = true,
                invalidCount = 0;
            for(var i = 0; i < this.formElementViews.length; i++){
                this.formElementViews[i].validate();
                model = this.formElementViews[i].model;
                if(valid){
                    valid = model.isValid();
                }

                if(!model.isValid() && model.get('required') === true){
                    invalidCount++;
                }
                paramName = model.get('id');
                paramValue = model.get( paramName );

                //Logic to handle amount and amountWithUnitType
                if(paramName === 'amountWithUnitType'){
                    paramData['amount'] = paramValue;
                    if(model.get( "amountWithUnitType-unitType" )){
                        paramData['amountUnitTypeId'] = model.get( "amountWithUnitType-unitType" ).id;
                    }
                }else if(model.get('type') === 'dateInput'){
                    paramData[paramValueMapping[paramName]] = this.formatDateForAPI(paramValue);
                }else if(typeof paramValue !== "string"){  //paramValueMapping is used to correct the param Names
                    paramValue = model.get( paramName )[0].id;
                    paramData[paramValueMapping[paramName]] = paramValue || null;
                }else{
                    paramData[paramValueMapping[paramName]] = paramValue || null;
                }
            };

            if($.trim(this.$el.find('#comment').val()) != ""){
                paramData['comment']=$.trim(this.$el.find('#comment').val()); 
            }
            if(!valid){
                if(invalidCount > 1){
                    var validationErrorsMessagePlural = i18n.get(this.namespace, 'validationErrorsMessagePlural');
                    validationErrorsMessagePlural = validationErrorsMessagePlural.replace('%(numberOfErrors)s', invalidCount);
                    $('#errorGutter').html('<span class="errorWarningIcon"></span>'+validationErrorsMessagePlural);
                }
                return;
            }else{
                $('#errorGutter').hide()
            }

            this.submitAddManualPaymentRequest(paramData);
        },
        

        /**
         *Submits the params to the server
         *
         */
        submitAddManualPaymentRequest : function(paramData){
            var self = this;
            Log.info(JSON.stringify(paramData));
            $.ajax({
                data: JSON.stringify(paramData),
                type: 'POST',
                url: config.appContext + "/api/v1/manualpayment",
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) {
                Log.info("Manual Payment request Submitted.");
                //if condition to test if manual payment is duplicate
                if(jqXHR.responseText === "SENT TO QUEUE"){
                    Log.info("Manual Payment Addition done");
                    self.saveCompleted(response, textStatus, jqXHR);  
                }else if(jqXHR.responseJSON.status === "DUPLICATE"){
                    Log.info("Manual Payment is a duplicate");
                    //TODO :: look what is the response and pass it, expecting the wso to be passed
                    self.duplicateManualPayment(response);
                }              
            }).fail(function(jqXHR, textStatus, errorThrown){
                //This case is called when there is a validtion error
                var message  = "Unknown Error";
                self.errorCB(jqXHR, textStatus, errorThrown);
                try{
                  message = $.parseJSON(jqXHR.responseText).message;
                  Log.error(message);
                }catch(err){   
                }
            });
        },

        /**
         * Format date to MM/DD/YYYY so API can understand 
         * 
         */
        formatDateForAPI : function(date){
            if(!date) return date;
            var userFormat = userConfig.getPreferences().rawDateFormat;
            userFormat = userFormat.toUpperCase();
            return moment.utc(date, userFormat).format('MM/DD/YYYY');
        },

        /**
         *Submits the params to the server if accepted from the confirmation pop up/it gets rejected.
         *
         */
        duplicateManualPayment : function(manualPaymentWSO){
            var self = this,
                dialogOptions = {},
                dialogView;

            dialogOptions.showCancel = true;
            dialogOptions.namespace = this.namespace;
            //TODO :: edit these labels.
            dialogOptions.labels = {
                header_i18n: "addManualPaymentHeader",
                header: "Add Manual Payment",
                message_i18n: "duplicatePaymentAlreadyExist",
                message: "A duplicate Manual Payment already exists. Are you sure you want to add the Manual Payment?",
                confirmButton: "Accept",
                cancelButton: "Discard",
                confirmButton_i18n: "accept",
                cancelButton_i18n : "discard"
            };
            dialogView = new DialogView(dialogOptions);
            dialogView.render();
            //listen for the reject booton to be clicked in the Duplicate Pop up.
            self.listenToOnce(dialogView, "cancel", function() {
                self.stopListening(dialogView);
                dialogView.stopListening();
            });
            //Listen for the confirm button to be clicked in the Duplicate Pop up.
            self.listenToOnce(dialogView, "confirm", function() {
                var urlWithParams = config.appContext + "/api/v1/manualpayment/duplicate"
                $.ajax({
                    url: urlWithParams,
                    type: 'POST',
                    contentType: 'application/json',
                    data : JSON.stringify(manualPaymentWSO)
                }).done(function(response, textStatus, jqXHR){
                    Log.info("Duplicate Manual payments is added.");
                    self.saveCompleted(response, textStatus, jqXHR); 
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
                    setTimeout(function(){
                      self.showNotification(labels, self.i18nNamespace);
                    }, 500); 
              });
                self.stopListening(dialogView);
                dialogView.stopListening();
            });
        },

        /**
         *shows the manual payment created yellow label
         *The reroute the the previous url.
         */
        saveCompleted: function(response, textStatus, jqXHR){
            Log.info("Manual Payment is added");
            var message = i18n.get(this.namespace, 'sentToQueue') || "[Sent to Queue]";
            $("#uiActionMsg").showMessage(message);
            this.returnToPrevPage();
        },

        /**
         *
         */
        returnToPrevPage : function(){
            Log.info("Return to the previous Page");
            this.cleanUp();
            config.router.navigate(this.returnURL, {
                trigger: true
            });
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
            this.showNotification(labels, this.namespace)
        },

        /**
         *
         */
        cleanUp : function(){
            this.textFieldInput && this.textFieldInput.cleanUp();
            this.undelegateEvents();
        }        
    });
    return AddManualPaymentView;
});