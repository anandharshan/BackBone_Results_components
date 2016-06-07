define([
    'jquery',
    'PopupView',
    'i18n',
    'TableView',
    'text!results/html/manualPaymentDuplicate_tmpl.html',
    'TransformedResultNameModel',
    'GenericResultsLegacyCollection',
    'config',
    'loglevel',
    'DuplicateManualPaymentModel',
    'DuplicateManualPaymentCollection',
    'PagedCollection',
    'DuplicateMPRowView'
], function($, PopupView, i18n, TableView, ManualPaymentDuplicateTmpl, TransformedResultNameModel, GenericResultsLegacyCollection, config, Log, DuplicateManualPaymentModel, DuplicateManualPaymentCollection, PagedCollection, DuplicateMPRowView){
    /**
    * A Backbone View to display list of items that can be selected to be included
    * in Type ahead and Contains Input View
    *
    * @module BasicInputSearchPopupView
    */
    var ManualPaymentDuplicatesPopupView = PopupView.extend({

        template : _.template(ManualPaymentDuplicateTmpl),

        selectedRows : [],

        events:{
            "click input[name='selectType']:radio" : "toggleAllSelected",

            // from parent -> need a way to resuse parents instead of here
            'click .close' : 'cancel',
            'click .cancel-button' : 'cancel',
            'click #acceptAll' : 'acceptAllAction',
            'click #acceptSelected' : 'acceptSelectedAction',
            'click #discardBtn' : 'discardAction',
            'click #downloadBtn' : 'downloadAction',
        },

        //tableHeaders : ['row','employeeId', 'itemAmountWithUnitType', 'incentiveDate', 'orderCode', 'orderItemCode','earningGroupName'],
        tableHeaders : ['row','employeeId', 'itemAmountWithUnitType', 'incentiveDate','earningGroupName'],

        headerClassMap : {
            "itemAmountWithUnitType" : "right-align"
        },

        defaultSortIndex : 0,

        rowView : DuplicateMPRowView,

        headerTemplate : _.template($('#duplicates-header-template').html()),

        acceptAllAction : function(){
            this.doneButtonAction('ACCEPTALL');
        },

        acceptSelectedAction : function(){
            this.doneButtonAction('ACCEPT');
        },

        discardAction : function(){
            this.doneButtonAction('DISCARD');
        },

        downloadAction : function(){
            //xdmUploadId is param expected
            var paramsForDownload = '';
            paramsForDownload = '?xdmUploadId=' + this.xdmUploadId;
            Log.info("Download the file :: " + config.appContext + "/api/v1/manualpayment/duplicates/download" + paramsForDownload);
            window.location = config.appContext + "/api/v1/manualpayment/duplicates/download" + paramsForDownload;
        },

        /**
         *For accept, accept all, discard actions
         */
        doneButtonAction : function(action){
            var paramData = {};
            paramData.action = action;
            paramData.xdmUploadId = this.xdmUploadId;
            paramData.autoCreateReasonCodes = this.autoCreateReasonCodes;
            if(action === 'ACCEPTALL'){
                this.submitDuplicatesToQueue(paramData);
            }else if(action === 'ACCEPT'){
                if(this.selectedItems.length === 0){
                    return;
                }
                this.submitDuplicatesToQueue(paramData);
            }else if(action === 'DISCARD'){
                this.submitDuplicatesToQueue(paramData);
            }
            this.trigger('selected', this.selectedItems);
            this.cleanUp();
        },

        submitDuplicatesToQueue : function(paramData){
            var queryParam = "?action=" + paramData.action + "&xdmUploadId=" + paramData.xdmUploadId + "&autoCreateReasonCodes=" + paramData.autoCreateReasonCodes;
            var payloadData = [];

            var rowsSelectedForDeletionArray = this.selectedItems;
            var rowIds = _.pluck(rowsSelectedForDeletionArray,"id");
            var rowWSOs = [];
            var self=this;

            // Format in which the delete ids needs to be passed to backend
            //  [{"rowIndex":"13"},{"rowIndex":"8"}]

            for (var i=0; i<rowIds.length; i++){
                var rowWSO = {};
                rowWSO.rowIndex = rowIds[i];
                payloadData.push(rowWSO);
            }

            $.ajax({
                data: JSON.stringify(payloadData),
                type: 'POST',
                url: config.appContext + "/api/v1/manualpayment/duplicates/upload" + queryParam,
                contentType: 'application/json',
            }).done(function(response, textStatus, jqXHR) {
                var showMessage = "";
                if(jqXHR.responseText === "No Manual Payments Uploaded"){
                    Log.info("No Manual Payments Uploaded");
                    showMessage = i18n.get(self.namespace, 'noManualPaymentsUploaded') || "[No Manual Payments Uploaded]";
                }else{
                    Log.info("Manual Payment duplicated uploaded");
                    showMessage = i18n.get(self.namespace, 'sentToQueue') || "[Sent to Queue]";
                }
                $("#uiActionMsg").showMessage(showMessage);
                if($(".search-sidebar")[0]){
                    $(".search-sidebar")[0].click(); 
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
         *
         */
        renderTemplate : function(){
            var popupHTML = this.template({
                title : this.title,
                downloadBtnLabel : this.downloadBtnLabel,
                discardBtnLabel : this.discardBtnLabel,
                acceptAllBtnLabel : this.acceptAllBtnLabel,
                acceptSelectedBtnLabel : this.acceptSelectedBtnLabel
            });
            
            this.$el.html( popupHTML ).addClass('fade in');
            this.modalBody = this.$el.find('.modal-body');
        },

        renderTable : function(){


            this.loadHeaders();
            var queryParams = "?xdmUploadId=" + this.xdmUploadId + "&autoCreateReasonCodes=" + this.autoCreateReasonCodes;
            var options = {};
            this.collection = new DuplicateManualPaymentCollection();
            this.collection.url = config.appContext + "/api/v1/manualpayment/upload/status" + queryParams;
            this.collection.model = DuplicateManualPaymentModel;
            this.collection.params.limit = 50;
            this.collection.params.offset = 0;
            this.collection.params.currentPage = 1;
            
            if(!this.selectedItems){
                this.selectedItems = [];
            }
            this.listenTo(this.collection, 'error', this.error);
            this.$el.xlate( {namespace : this.namespace} , this.modalBody);

            this.tableView = new TableView({
                el : this.$el.find('#results-table'),
                namespace : this.namespace,
                collection : this.collection,
                headers : this.headerCols,
                jqUIScroll : true,
                cellClassName : 'cell',
                showError : true,
                rowView: this.rowView,
                headerTemplate : this.headerTemplate,
                multiSelect : true
            });
            this.listenTo(this.tableView, 'rowclick', this.rowClicked);
            this.listenTo(this.tableView, 'rendered', this.setSelectedRows);
        },

        /**
         *
         */
        loadHeaders : function(){
            var self = this;
            // this needs to be come from default, xactly-default or saved seach
            this.headerCols = this.tableHeaders.map(function(name){
                obj = Object.create(null);
                obj.name= name;
                obj.label = i18n.get(self.namespace, name) || '['+name+']';
                obj.sortable = false;
                obj.sort = '';
                obj.className = 'cell '+ (self.headerClassMap[name] || '');
                return obj;
            });
            //Sorting in any of the columns not supported.
            //this.headerCols[this.defaultSortIndex].sort = 'asc';
        },

        /**
         * Trigger error event in case of server error
         */
        error : function(collection, response, options){
            this.stopListening(this.tableView, 'rowclick', null);
            this.trigger('error', collection, response, options);
        },

        /**
         *Row click will be called when the row in the results table is clicked
         *if we clicked on the comment bubble then opens the comment popup
         *if we clicked on the check box, i think we r adding the style  to the checkbox // has to confirm
         *And depending on no of rows that we have selected, we are enabling/disabling the sidebar actions
         *call toggle all select function. look up
         */
        rowClicked : function(model, action, event){
            var target = $(event.target);
            this.currentSelectedRow = model;
            this.selectedItems = this.selectedItems || [];

            if(target.hasClass('select')){
                var present = _.findWhere(this.selectedItems, {id: model.id});
                if(present){ //remove
                    this.selectedItems = _.reject(this.selectedItems, function(m){
                        return model.id === m.id;
                    });
                    target.removeClass('row-selected').addClass('row-not-selected');
                }else{
                    this.selectedItems.push(model);
                    target.removeClass('row-not-selected').addClass('row-selected');
                }
            }
            this.toggleAllSelect();
            this.toggleSaveButton();
        },

         /**
         *
         */
        setSelectedRows : function(){
            this.resetSelectedRows();
            this.toggleSaveButton();
        },

        /**
         *
         */     
        resetSelectedRows : function(){
            var self = this,
                collectionIds, selectedIds, className, allSelected = true;

            self.selectedItems = self.selectedItems || [];
            
            collectionIds = self.collection.map(function(model){
                return model.get('rowIndex');
            });

            var allSelectionControl = $('#popupDiv #results-table').find('.all-select-control');
            allSelectionControl.removeClass('fa-check-square').addClass('fa-square-o');

            allSelectionControl.off( "click").on( "click", function(){
                var class1 = 'row-selected', class2 = 'row-not-selected';   

                if($(this).hasClass('fa-square-o')){
                    // unselected...so selecte all rows
                    self.selectedItems = _.union(self.selectedItems, self.collection.toJSON());
                    $(this).removeClass('fa-minus-square-o fa-square-o').addClass('fa-check-square');
                }else{
                    // selected...so remove all rows on this page from rowSelection
                    class1 = 'row-not-selected';
                    class2 = 'row-selected';

                    self.selectedItems = _.filter(self.selectedItems, function(row){
                        return (collectionIds.indexOf(row.id) === -1);
                    });
                    $(this).removeClass('fa-minus-square-o fa-check-square').addClass('fa-square-o');
                }

                $('#popupDiv .list-item-row').each(function(index, row){
                    var $row= $(row);
                    $row.find('.action-cell > .select').addClass(class1).removeClass(class2);
                });
                self.toggleSaveButton();
            });
            this.updateRowSelection();
        },
        
        /**
         *
         */
        updateRowSelection : function(){
            // select the rows that are selected
            if(this.selectedItems.length > 0){
                // get selected ids in sting data type
                selectedIds = _.pluck(this.selectedItems, 'id'); //.map(function(id){ return String(id);});
                
                // make row selected, if contained in selectedIds
                $('#popupDiv .list-item-row').each(function(index, row){
                    var $row= $(row);
                    var class1 = 'row-selected', class2 = 'row-not-selected';
                    if(selectedIds.indexOf($row.data('id')) === -1){
                        class1 = 'row-not-selected';
                        class2 = 'row-selected';
                        allSelected = false;
                    }
                    $row.find('.action-cell > .select').addClass(class1).removeClass(class2);
                });

                this.toggleAllSelect();
            }
        },

        /**
         *Gets the select all checkbox for the entire column
         *if all the rows in the collection are selected , then check the select All Checkbox
         *else, uncheck the select All Checkbox
         */
        toggleAllSelect : function(){
            var allSelectionControl = $('#results-table').find('.all-select-control');
            if($('#results-table').find('.row-selected').length === this.collection.length){
                allSelectionControl.addClass('fa-check-square').removeClass('fa-square-o');
            }else{
                allSelectionControl.removeClass('fa-check-square').addClass('fa-square-o');
            }
        },

        /**
         *
         */
        getItem : function(model){
            var searchvalue = model.id;
            if(typeof model.id === 'string'){
                searchvalue = String(model.id); // convert into string, if not already
            }
            return _.where(this.selectedItems, {id :searchvalue});
        },

        /**
         *
         */
        toggleSaveButton : function(){
            if(this.selectedItems.length === 0){
                this.$el.find('.done-button').removeClass('x-button-enabled');
            }else{
                this.$el.find('.done-button').addClass('x-button-enabled');// enable accept selected button
            }
        },

        /**
         *
         */     
        toggleAllSelected : function(e){
            var target = $(e.currentTarget),
                type = target.val();
            
            if(!this.clonedCollection){
                this.clonedCollection = this.collection.toJSON();
            }
            this.selectedValues = _.pluck(this.selectedItems, 'id');
            this.filteredModels = this.clonedCollection;

            if(type === 'selected'){
                this.filteredModels = [];
                this.collection.forEach(this.filterSelected, this); // get items from collection based on selectedIds
                this.collection.params.selectedCount = this.filteredModels.length;
            }else{
                this.collection.params.selectedCount = null;
            }
            
            this.collection.reset(this.filteredModels);
            this.collection.trigger('render');
        },

        /**
         *
         */
        filterSelected : function(model){
            if(this.selectedValues.indexOf(model.get('id')) !== -1){
                this.filteredModels.push(model);
            }
        },

        /**
         *
         */
        reset : function(){
            if(!this.multiSelect){
                this.selectedItems = [];
            }
            this.toggleSaveButton();
            this.collection.params.selectedCount = null;
            this.clonedCollection = null;
            this.$el.find("input[id='all']").prop("checked", "checked");
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
         *
         */
        cleanUp : function(){
            this.tableView.cleanUp();
            this.clear();
            $('.popup-modal-backdrop').removeClass('in').addClass('out hide');
            this.$el.removeClass('modal fade in').empty();
            this.undelegateEvents();
        },

        /**
         *
         */
        clear : function(){
            this.reset();
        }
    });
    return ManualPaymentDuplicatesPopupView;
});