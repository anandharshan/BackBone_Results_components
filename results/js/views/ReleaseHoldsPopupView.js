define([
    'jquery',
    'PopupView',
    'i18n',
    'ResultActionPopupView',
    'jqueryFileUpload',
    'config'
], function($, PopupView, i18n, ResultActionPopupView, jqueryFileUpload, config){

    /**
    * A Backbone View to perform release of held data 
    *
    * @module ReleaseHoldsPopupView
    */
    var ReleaseHoldsPopupView = ResultActionPopupView.extend({

        isFileuploadBound : false,

        /**
         * Show pop up
         *
         */
        render : function(){
            this.renderPopupContent();
            if(this.releaseType === 'finalize' || this.releaseType === 'calcbalances'){
                this.businessGroupRadioEventSetup();
            }
            this.$el.find('.modal').css('width','700px');
            this.$el.find('.modal').css('margin-left','-350px');
            this.trigger('rendered');
        },
        /**
         *
         */
        businessGroupRadioEventSetup : function(){   
            var self = this,
                businessGroupView;

            this.toggleDoneButton(); // set to disabled 
            
            this.$el.find('input[type=radio][name="include"]').off('change').on('change', function(e){
                self.toggleDoneButton($(this).attr('id'));
            });

            businessGroupView = _.find(this.formElementViews, function(view){
                return view.model.id === 'businessGroup';
            });
            if(businessGroupView){
                this.listenTo(businessGroupView, 'change', this.toggleDoneButton);
            }
        },

        /**
         *
         */
        toggleDoneButton : function(selection){        
            if(selection === 'allBizGrp'){
                this.$el.find('.done-button').addClass('enabled').prop('disabled', false);
                this.$el.find('#businessGroupInput').hide();
            }else if((selection === 'selectedBizGrp' || typeof selection === 'object') && this.formElementViews[1].model.get("businessGroup").length === 0){
                this.$el.find('.done-button').removeClass('enabled').prop('disabled', true);
                this.$el.find('#businessGroupInput').show();  
            }else if((selection === 'selectedBizGrp' || typeof selection === 'object') && this.formElementViews[1].model.get("businessGroup").length > 0){
                this.$el.find('.done-button').addClass('enabled').prop('disabled', false);
                this.$el.find('#businessGroupInput').show();  
            }else{
                this.$el.find('.done-button').removeClass('enabled').prop('disabled', true);
                this.$el.find('#businessGroupInput').show();                
            }
        },

        /**
         *
         */
        doneButtonAction : function(){
            var self = this,
                formData = {},
                paramData = {},
                QueueReleaseEventParam = {},
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
                }else if(model.get('type') === 'dateInput'){
                    paramData[paramName] = this.formatDateForAPI(paramValue);
                }else{
                    paramData[paramName] = paramValue || null;
                }
            }
            paramData['comment'] = $.trim(this.$el.find('#comment').val()); 
            paramData.releaseItemType = this.releaseItemType;

            if(this.releaseItemType){
                paramData.releaseItemType = this.releaseItemType;
            }else{ //when we are doing it from the PROCESS QUEUE PAGE
                paramData.releaseItemType = "Commission";
            }
            
            if(!valid){
                return;
            }
            if(paramData.releaseGroupId && paramData.releaseGroupId.length > 0){
                paramData.releaseGroupId = paramData.releaseGroupId[0].id;
            }else{
                paramData.releaseGroupId = undefined;
            }

            if(paramData.earningGroupName && paramData.earningGroupName.length > 0){
                paramData.earningGroupName = paramData.earningGroupName[0].name;
            }else{
                paramData.earningGroupName = undefined;
            }

            if(paramData.businessGroup && paramData.businessGroup.length > 0){
                paramData.businessGroup = _.pluck(paramData.businessGroup, 'id');
            }else{
                paramData.businessGroup = undefined;
            }

            //Initializing releasePercent to '100';
            if(this.releaseItemType === 'Credit' || this.releaseItemType === 'Bonus'){
                paramData.releasePercent = 100;
            }

            // if this a release by template
            if(this.releaseType === 'template'){           
                this.$el.find("#releaseByTemplateForm").fileupload();
                this.isFileuploadBound = true;
                this.submitReleaseByTemplateDownloadRequest(paramData);
            }else if(this.releaseType === 'selected'){
                QueueReleaseEventParam.comment = paramData.comment;
                QueueReleaseEventParam.earningGroupName = paramData.earningGroupName;
                QueueReleaseEventParam.releaseDate = paramData.releaseDate;
                QueueReleaseEventParam.releaseGroupId = paramData.releaseGroupId;
                QueueReleaseEventParam.releaseItemType = paramData.releaseItemType;
                QueueReleaseEventParam.releasePercent = paramData.releasePercent;

                // release by selected ids                
                QueueReleaseEventParam.itemIdList = _.pluck(this.rowsSelected, 'id');
                this.submitReleaseBySelectedDownloadRequest(QueueReleaseEventParam);
            }else if(this.releaseType === 'search'){ // release by selected
                var paramFields = [];
                var paramText = []; 
                _.keys(paramData).forEach(function(key){
                    paramFields.push(key);
                    paramText.push(paramData[key]);
                });
                
                this.submitReleaseBySearchDownloadRequest({
                    searchFields : this.searchfields,
                    searchText : this.searchtext,
                    paramFields : paramFields,
                    paramText : paramText                    
                });
            }else if( // for payment release
                    this.releaseType === 'periodId' || 
                            this.releaseType === 'paymentId' || 
                                this.releaseType === 'bizGroupId' ){
    
                var date = new Date();
                var dateStr = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
                QueueReleaseEventParam.releaseDate = dateStr;
                QueueReleaseEventParam.releaseGroupId = paramData.releaseGroupId;
                QueueReleaseEventParam.releaseItemType = paramData.releaseItemType;
                QueueReleaseEventParam.releaseType = this.releaseType;
                QueueReleaseEventParam.periodId = this.periodId;
                
                QueueReleaseEventParam.releasePercent = 100;
                if(this.releaseType === 'paymentId'){
                    // release by selected ids                
                    QueueReleaseEventParam.itemIdList = _.pluck(this.rowsSelected, 'id');
                }else if(this.releaseType === 'bizGroupId'){
                    // release by selected ids                
                    QueueReleaseEventParam.bizGroupIds = paramData.businessGroup;
                }
                this.submitReleaseBySelectedDownloadRequest(QueueReleaseEventParam);
            }else if(this.releaseType === 'finalize' || this.releaseType === 'calcbalances'){
                QueueReleaseEventParam.periodId = paramData.period.id;

                var includeAll = this.$el.find('input[name="include"]:checked').val();
                QueueReleaseEventParam.includeAll = false;
                if((includeAll === 'all')){
                    QueueReleaseEventParam.includeAll = true;
                }else{
                    QueueReleaseEventParam.businessGroupIdList = paramData.businessGroup;                        
                }

                var apiUrl = config.appContext + "/api/queue/events/finalizeevents";
                if(this.releaseType === 'calcbalances'){
                    apiUrl = config.appContext + "/api/queue/events/calcbalancesevents";
                }
                this.submitFinalizeRequest(QueueReleaseEventParam, apiUrl);
            }
        },

        /**
         *
         */
        submitReleaseBySearchDownloadRequest : function(paramData){
            var self = this,release_url;
            if(this.releaseItemType === 'Bonus'){
                release_url = config.appContext + "/api/v1/bonuses/release";
            }else {
                release_url = config.appContext + "/api/v1/commissions/release";
            }
            $.ajax({
                data: JSON.stringify(paramData),
                type: 'POST',
                url: release_url,
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) {
                self.actionComplete(response, textStatus, jqXHR);           
            }).fail(function(jqXHR, textStatus, errorThrown) {
                self.error(jqXHR, textStatus, errorThrown);
            });
        },

        /**
         *
         */
        submitReleaseBySelectedDownloadRequest : function(paramData){
            var self = this;
            $.ajax({
                data: JSON.stringify(paramData),
                type: 'POST',
                url: config.appContext + "/api/queue/events/releaseevents/itemset-release",
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) {
                self.actionComplete(response, textStatus, jqXHR);           
            }).fail(function(jqXHR, textStatus, errorThrown) {
                self.error(jqXHR, textStatus, errorThrown);
            });
        },

         /**
         *
         */
        submitFinalizeRequest : function(paramData, apiUrl){
            var self = this;
            $.ajax({
                data: JSON.stringify(paramData),
                type: 'POST',
                url: apiUrl,
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) {
                self.actionComplete(response, textStatus, jqXHR);           
            }).fail(function(jqXHR, textStatus, errorThrown) {
                self.error(jqXHR, textStatus, errorThrown);
            });
        },

        /**
         *
         */
        submitReleaseByTemplateDownloadRequest : function(formData){
            var self = this,
                filesList = this.$el.find('#templateFile')[0].files;
            
            this.$el.find('#releaseByTemplateForm').fileupload('option', {
                formData: {'param': JSON.stringify(formData)},
                url: config.appContext + "/api/queue/events/releaseevents",
                //forceIframeTransport: true,
                add :function(e, data){
                    data.submit()
                    .success(function (response, textStatus, jqXHR) {
                        self.actionComplete(response, textStatus, jqXHR);           
                    })
                    .error(function (jqXHR, textStatus, errorThrown) {
                        self.error(jqXHR, textStatus, errorThrown);
                    });
                }
            }).fileupload('add', {
                // this will trigger add callback above
                files: filesList
            });
        },

        /**
         *
         */
        cleanUp : function(){
            if(this.isFileuploadBound){
                this.$el.find('#releaseByTemplateForm').fileupload('destroy');
            }
            this.$el.find('input[type=radio][name="include"]').off('change');
            this.$el.find('.modal').css('width','');
            this.$el.find('.modal').css('margin-left','');
            ResultActionPopupView.prototype.cleanUp.call(this);
        }
       
    });
    return ReleaseHoldsPopupView;
});
