define([
    'jquery',
    'PopupView',
    'i18n',
    'ResultActionPopupView',
    'CommissionModel',
    'ResultsSolrDownloadCollection'
], function($, PopupView, i18n, ResultActionPopupView, CommissionModel, 
        ResultsSolrDownloadCollection){

    /**
    * A Backbone View to perform Download 
    *
    * @module DownloadView
    */
    var DownloadView = ResultActionPopupView.extend({

         /**
         * Show pop up
         *
         */
        render : function(){
            this.renderPopupContent();
            
            if(this.ppaEnabled ){
                this.$el.find('#downloadFormat').hide(); 
                this.$el.find('#payrollTemplate').prop("disabled", true);
                this.$el.find('#comment').prop("disabled", true);
            }else{
                this.$el.find('#payrollTemplate').prop("disabled", false);
                this.$el.find('#comment').prop("disabled", false);
            }
            if(this.formElementViews && this.formElementViews[1] && this.formElementViews[1].model && this.formElementViews[1].model.id === "payrollTemplate"){
                this.listenTo(this.formElementViews[1], "change", this.payrollTemplateChanged);
            }
        },
        
        payrollTemplateChanged : function(templateDetail){
            this.$el.find('#disabled_description').val(templateDetail.description);
        },

        /**
         *
         */
        doneButtonAction : function(){
            var self = this,
                formData = {},
                format = this.$el.find("input[name='format']:checked").val(),
                description = this.$el.find('#comment').val(),
                filename, model, paramName, paramValue, payrollTemplate;

            // for each view -> get {id : val} object
            var valid = true;
            for(var i = 0; i < this.formElementViews.length; i++){
                model = this.formElementViews[i].model;
                if(valid){
                    valid = this.formElementViews[i].validate();
                }
                paramName = model.get('id');
                paramValue = model.get( paramName );
                formData[paramName] = paramValue;
            }
            if(!valid){
                return;
            }
            var searchParams = '';

            payrollTemplate = formData['payrollTemplate'] && formData['payrollTemplate'].id;
            if(payrollTemplate){
                searchParams += '&searchfield=' + 'templateId';
                searchParams += '&searchtext=' + payrollTemplate;
            }

            searchParams += '&searchfield=' + this.searchfields.join('&searchfield=');
            for(var i=0; i<this.searchtext.length; i++){
                 searchParams += '&searchtext=' + encodeURIComponent(this.searchtext[i]);
            }
            if(this.ppaEnabled){
                this.submitSolrDownloadRequest(formData['downloadName']);
            }else{
                this.submitDownloadRequest(this.downloadUrl + 
                                        '?format=' + format + 
                                        '&downloadName=' + formData['downloadName'] +
                                            searchParams );  
            }
        },

        /**
         *
         */
        submitSolrDownloadRequest : function(fileName, format){
            this.downloadReq = new ResultsSolrDownloadCollection({
                entityName : this.entityName,
                objectType : this.objectType,
                objectStatus : this.objectStatus,
                header : this.header,
                model : CommissionModel,
                fileName : fileName
            });
            // temporary until sort is sticky
            var sortMap = {
                'draw' : 'DRAW_NAME',
                'paymentresult' : 'PARTICIPANT_NAME',
                'balances' : 'PARTICIPANT_NAME'  
            };
            var sortBy = sortMap[this.entityName] || 'NAME';
            this.downloadReq.params.sortBy = sortBy;
            this.downloadReq.params.searchfield = this.searchfields;
            this.downloadReq.params.searchtext = this.searchtext;
            this.downloadReq.params.currentPage = 1;
            this.downloadReq.params.sortOrder = 'asc';
            this.downloadReq.objectType = this.type;
            this.listenTo(this.downloadReq, 'sync', this.actionComplete);
            this.listenTo(this.downloadReq, 'error', this.error);
            this.downloadReq.fetch();
        },
        /**
         *
         */
        submitDownloadRequest : function(url){
            var self = this;
            $.ajax({
                type: 'GET',
                url: url,
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
        reconfigureButton : function(){
            var closeLabel = i18n.get(this.namespace, 'close') || 'Close' ;
            this.$el.find('.cancel-button > span').html('<span>'+closeLabel+'</span>');
            this.$el.find('.done-button').hide();
        }
    });
    return DownloadView;
});
