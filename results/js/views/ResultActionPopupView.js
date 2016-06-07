define([
    'jquery',
    'PopupView',
    'i18n',
    'ObjectInputFactory',
    "userConfig",
    "moment",
    "momentTZ",
    "momentTZData",
], function($, PopupView, i18n, ObjectInputFactory, userConfig, moment, momentTZ, momentTZData){

    /**
    * A Backbone View to perform generic popup action.  
    * This view is inherited by action specific views
    *
    * @module ResultActionPopupView
    */
    var ResultActionPopupView = PopupView.extend({
        
        /**
         * Show pop up
         *
         */
        render : function(){
            this.renderPopupContent();
        },
        
        /**
         *
         */
        renderPopupContent : function(){
            this.modalBody.html( this.formTemplate );
            this.renderFormElements(); // render input for download name
            this.$el.xlate({ namespace: this.namespace });// translate
            this.$el.show();
            $('.modal-backdrop').addClass('in').removeClass('out hide');
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
         *
         */
        doneButtonAction : function(){
            var self = this,
                formData = {},
                model, paramName, paramValue;
            
            var valid = true;
            for(var i = 0; i < this.formElementViews.length; i++){
                this.formElementViews[i].validate();
                model = this.formElementViews[i].model;
                if(valid){
                    valid = model.isValid();
                }
                paramName = model.get('id');
                paramValue = model.get( paramName );
                if(model.get('type') === 'dateInput'){
                    formData[paramName] = this.formatDateForAPI(paramValue);
                }else{
                    formData[paramName] = paramValue;
                }
            }
            
            if(!valid){
                return;
            }
            if(this.templateType === 'all'){
                this.submitRequest({
                    searchfield : this.searchfields,
                    searchtext : this.searchtext,
                    downloadName : formData["downloadName"] ,
                    format : this.$el.find("input[name='format']:checked").val()                   
                });
            }else if(this.templateType === 'selected'){
                var searchtext = _.pluck(this.rowsSelected, 'id');
                var searchfields = _.map(searchtext, function(num){ return 'commissionID'; });
                this.submitRequest({
                    searchfield : searchfields,
                    searchtext : searchtext,
                    selected : 'true',
                    downloadName : formData["downloadName"] ,
                    format : this.$el.find("input[name='format']:checked").val()                   
                });
            }
        },

        submitRequest : function(submitTemplateRequest){
            var self = this;
            $.ajax({
                type: 'GET',
                url: this.downloadTemplateUrl,
                contentType: 'application/json',
                data: submitTemplateRequest,
                traditional: true
            }).done(function(response, textStatus, jqXHR) {
                self.actionComplete(response, textStatus, jqXHR);           
            }).fail(function(jqXHR, textStatus, errorThrown) {
                self.error(jqXHR, textStatus, errorThrown);
            });
        },

        /**
         *Shows yellow message at the top, triggers success, cleans up the pop up.
         */
        actionComplete : function(response, textStatus, jqXHR){
            this.showSuccessMessage(this.successMessage);
            this.trigger("success", null);
            this.cleanUp();
        },    

        /**
         *Message shown at the top yellow label
         */
        showSuccessMessage : function(message){
            $("#uiActionMsg").showMessage(message);
        },        
        /**
         *
         */
        cancel : function(){
            this.trigger("cancel");
            this.cleanUp();
        },

        /**
         *
         */
        cleanUp : function(){
            if(this.formElementViews){
                this.formElementViews.forEach(function(view){
                    view.undelegateEvents();
                });
            }
            $('.modal-backdrop').removeClass('in').addClass('out hide');
            this.$el.removeClass('modal fade in').empty();
            this.undelegateEvents();
        }
    });
    return ResultActionPopupView;
});
