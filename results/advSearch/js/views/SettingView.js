define(["jquery",
    "config",
    "underscore",
    "text!home/advSearch/html/advSettings.html",
    "i18n",
    "pageUtils",
    "TabSelectionView",
    "dialogView",
    "BaseEditView",
    "cancelCreateEditDialogView"
], function($,config, _, viewTmpl, i18n, pageUtils, TabSelectionView, 
                DialogView, BaseEditView, CancelCreateEditDialogView) {

    var AdvSearchSetting = BaseEditView.extend({

        useModalValidation: false,
        selectedObjectColumnsMap : {},
        allColoumObject : {},
        allColoumObjectDisp : {},
        businessId:0,
        masterJson : [],
        userSelectedFilters:[],
        userSelectedColumns:[],
        isAddColumnPopup : true,
        isAddSearchFieldPopup : true,
        currentColumnTab:'',
        MAX_FILTERS: 10,
        hiddenColumns : ['ATTAINMENT_VALUE_UNIT_TYPE_ID', 'PERIOD_IS_HIDDEN', 'ORDER_CODE_UPPER', 'ITEM_CODE_UPPER'],
        namespace : 'icmadvanced.advsearch',

        events: {
            "click .fields-table .fa.order"         : "changeOrder",
            "click #addSearchFieldsLink"            : "addSearchFieldPopup",
            "click #addColumnsLink"                 : "addColoumnPopup",
            "click .cancel-select-button"           : "gotoHomeView",
            "click .cancel-selection"               : "gotoHomeView",
            "click .adv-search-button"              : "saveConfig",
            "click #setting_viz_tabs li a"          : "updateColoumn",
            "click .select-popup-icon"              : "showPopup",
            "click .selectItemPopUP"                : "showPopup",
            "click #addSearchList"                  : "columnValueChanged",
            "click ul.details-columns .remove"      : "removeFieldRow",
            "click ul.search-fields .remove"        : "removeSelectedSearchField",
            "click .itemSelectClose"                : "deleteSelected",
            "click .tab-selector"                   : "selectTabs"
        },

        initialize: function(options) {
            var self = this;
            this.render();
            self.getPrefrence();
        },

        render: function() {
            this.$el.html(viewTmpl); // append template to body
        },

        getPrefrence : function(){
            var self = this;
            var url = config.appContext + "/api/advsearch/preferences";
            $.ajax({
                type: 'GET',
                url: url,
                contentType: 'application/json'
            }).done(function(response, textStatus, jqXHR) {
                self.loadSettings(response);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                self.error(null, jqXHR, null);
            });
        },

        renderTabs: function(masterJson) {
            var tabs = [],
                names = [];
            var object_order = masterJson.app.object_order;
            for (var i = 0; i < object_order.length; i++) {
                if (!masterJson.app.objects[object_order[i]].visible ||
                        ( object_order[i] === 'orderdetails' && !this.detailOrderItem ) ) {
                    continue;
                }

                names.push(object_order[i]);
                tabs.push((i18n.get(this.namespace, object_order[i])) ? i18n.get(this.namespace, object_order[i]) : object_order[i]);
            }
            var output = _.template($("#settingTabs").html(), {
                otype: names,
                tabs: tabs,
                current: masterJson.app.object_order[0]
            }, {
                variable: 'data'
            });
            $("#setting_viz_tabs").html(output);

            return this;
        },

        updateColoumn: function(e){
            var key = $(e.target).data('tab');
            this.currentColumnTab = key;
            $.each($("#setting_viz_tabs li a"), function(index, obj) {
                $(this).removeClass("activeLink");
                if (key === $(this).data('tab')) {
                    $(this).addClass("activeLink");
                }
            });
            this.showColumns(masterJson.app.objects[key].columns);
        },

        getColumnsForAllObject: function (all_elements) {
            var self = this;
            var all_object_keys = _.keys(masterJson.app.objects);
            var getColumnsURL = config.appContext +"/api/advsearch/alldimensions?bid=" + this.businessId + "&entities=" + all_object_keys.join(',') + "&action=dimensions&jsoncallback=?";
            $.ajax({
                url: getColumnsURL,
                success: function(data) {
                    self.alldimensions = data;
                    self.updateAllColsObject();
                },
                error: function(xhr, error) {
                    self.error(null, xhr, null);
                }
            });
        },

        updateAllColsObject : function(){
            var self = this;
            this.allColsObj = [];
            $.each(self.alldimensions, function(key, arrayOfAvailabelCols) {
                self.allColoumObject[key] = arrayOfAvailabelCols;
                $.each(arrayOfAvailabelCols, function(index, element) {
                    element.displayName = i18n.get(self.namespace, element.value) || element.value;
                    
                    var existingCols = _.pluck(self.allColsObj, 'value');
                    if(existingCols.indexOf(element.value) === -1){
                        self.allColsObj.push(element);
                    }
                });
                self.allColoumObjectDisp[key] = arrayOfAvailabelCols; // this will remove duplicates
            });
        },

        loadSettings: function(collection) {
            var self = this;
            this.masterJson = collection;
            this.detailOrderItem = collection.detailOrderItem;
            this.businessId = collection.businessId;
            var isAdmin = collection.admin;
            var businessJson = collection.businessConfigContent;
            if (collection.contentPresent) { // No user preferences yet so default them to business values
                masterJson = collection.configContent;
            } else {
                masterJson = businessJson;
            }
            this.getColumnsForAllObject(masterJson.app.object_order);
            this.renderTabs(masterJson);
            this.currentColumnTab = masterJson.app.object_order[0];
            this.showColumns(masterJson.app.objects[this.currentColumnTab].columns);
            this.showSearchFields(masterJson.app.filter_order);

            self.$("#details-columns").sortable({
                placeholder: "ui-state-highlight",
                connectWith: "parent",
                containment: "parent",
                forcePlaceholderSize: true,
                items: 'li:not(.ui-state-disabled)',
                start: function(event, ui) {
                    $(this).removeClass("cancel");
                    var start_pos = ui.item.index();
                    //$(this).attr('data-previndex', ui.item.index());
                    $("#details-columns > li").removeClass('draggable');
                    $(ui.item).addClass('draggable');
                },
                stop: function(event, ui) {
                    self.markDirty();
                    $("#details-columns > li").removeClass('draggable');
                    var columns = [];
                    self.$("#details-columns > li").each(function(index) {
                        columns.push($(this).attr('data-name'));
                        $(this).find(".counter").text(index+1);
                        $(this).find(".column-title").attr('data-column-position', index+1);
                    });
                    masterJson.app.objects[self.currentColumnTab].columns = columns;
                },
                cancel: ".ui-state-disabled"
            });

            self.$("#details-search-fields").sortable({
                placeholder: "ui-state-highlight",
                connectWith: "parent",
                containment: "parent",
                forcePlaceholderSize: true,
                items: 'li:not(.ui-state-disabled)',
                start: function(event, ui) {
                    $(this).removeClass("cancel");
                    var start_pos = ui.item.index();
                    //$(this).attr('data-previndex', ui.item.index());
                    $("#details-search-fields > li").removeClass('draggable');
                    $(ui.item).addClass('draggable');
                },
                stop: function(event, ui) {
                    self.markDirty();
                    $("#details-search-fields > li").removeClass('draggable');
                    masterJson.app.filter_order = [];
                    self.$("#details-search-fields > li").each(function(index) {
                        masterJson.app.filter_order.push($(this).attr('data-name'));
                        $(this).find(".counter").text(index+1);
                        $(this).find(".column-title").attr('data-column-position', index+1);
                    });

                },
                cancel: ".ui-state-disabled"
            });

            $(this.$el).xlate({
                namespace: this.namespace
            });
        },

        changeOrder: function(e) {
            this.markDirty();
            var $currentElement = this.$(e.target);
            var $currentList = $currentElement.parent().parent();
            var currentCounter = $currentList.find(".counter").text();

            if ($currentElement.hasClass('fa-caret-up')) {
                var $previousList = $currentList.prev();
                var prevCounter = $previousList.find(".counter").text();
                $currentList.find(".counter").text(prevCounter);
                $currentList.find(".column-title").attr('data-column-position', prevCounter-1);
                $previousList.find(".counter").text(currentCounter);
                $previousList.find(".column-title").attr('data-column-position', currentCounter-1);
                $previousList.before($currentList);
            } else {
                var $nextList = $currentList.next();
                var nextCounter = $nextList.find(".counter").text();
                $currentList.find(".counter").text(nextCounter);
                $currentList.find(".column-title").attr('data-column-position', nextCounter-1);
                $nextList.find(".counter").text(currentCounter);
                $nextList.find(".column-title").attr('data-column-position', currentCounter-1);
                $currentList.before($nextList);
            }
            var ulElement = $currentList.parent(),
                type = ulElement.data('type'),
                list = [];
            ulElement.find('li').each(function(index, element){
                list.push($(element).data('name'));
            });
            if(type === 'filter_order'){
                masterJson.app.filter_order = list;
            }else{
                masterJson.app.objects[this.currentColumnTab].columns = list;
            }
        },

        addColoumnPopup: function(){
            var self = this;
            this.isAddColumnPopup = true;
            this.isAddSearchFieldPopup = false;
            var columnTab = masterJson.app.objects[this.currentColumnTab].columns;
            var objectColumns = self.allColoumObjectDisp[this.currentColumnTab];
            self.selectedList = columnTab;

            _.each(objectColumns, function(column, index){
                column.isValuePresent = (columnTab.indexOf(column.value) !== -1);
            }); 
            var list = self.getListOutput(objectColumns, self);
            self.showFilterPopup(list);
        },

        addSearchFieldPopup: function(){
            var self = this;
            this.isAddColumnPopup = false;
            this.isAddSearchFieldPopup = true;
            self.selectedList = masterJson.app.filter_order;

            _.each(self.allColsObj, function(column, index){
                column.isValuePresent = (self.userSelectedFilters.indexOf(column.value) !== -1);
            }); 
            var list = self.getListOutput(self.allColsObj, self);
            self.showFilterPopup(list);
        },

        getListOutput :function(n, self){
            // sort array by alpha
            n = _.sortBy(n, 'displayName');            
            var list = [], checked = '';
            for(var d=0; d < n.length; d++){
                if(self.hiddenColumns.indexOf(n[d].value) > -1){
                    continue; // skip this column...
                }
                checked = (n[d].isValuePresent) ? "checked='checked'" : "";
                list.push("<li data-name='"+n[d].displayName.toLowerCase()+"'>"
                +"<div class='list-item-row list-item-element-row border-bottom' style='width: 550px'>"
                +"<span class='select-column' style='width: 150px; text-align: left'>"
                +"<input type='checkbox' name='selectedElement' value='"+n[d].value+"' "+checked+" /></span>"
                +"<span class='person-first-name-column' style='text-align: left'><span class='display-text'>"+n[d].displayName+"</span></span>"
                +"</div></li>");
            }
            return list;
        },
        
        showFilterPopup :function(listArr){
            var list = listArr.join(''),
                len = listArr.length;

            var self = this;
            if(this.isAddSearchFieldPopup){
                var colnamStr = "Fields";
            }
            if(this.isAddColumnPopup){
                var colnamStr = "Columns";
            }
            var output = _.template($("#filterBox").html(), {
                colName : colnamStr
            });

            $("#popupDiv").show().html(output);
            $("#filter-element-list").html(list);
            self.updateCount(len, 0);
            

            $(".cancel-select-button").off("click").on("click", self.hideFilterPopup);  // clean up event listener, if any
            $("#popupDiv").on("click","input[name=selectType]", function(e){self.toggleSelectedItem(self, e)});  // clean up event listener, if any
            //$("#popupDiv").off("keyup").on("keyup","input[type=text]", function(e){self.toggleSelectedItem(self, e)}); 
            $("#popupDiv").on("click","#search-button", function(e){self.toggleSelectedItem(self, e)}); 
            $("#popupDiv").on("click", "#clear-search", function(e){self.clearSearch(self, e)}); 
                
            $("#popupDiv").off("change").on("change","input[type=checkbox]", function(e){self.selectItem(self, e)}); 
            // sort
            $("#popupDiv").on("click", ".grid-column",  function(e){self.sorttable(self, e)});
            $("#popupDiv").on("click", "#selectFilterPopup",  function(e){self.saveSelectedItems(self, e)});
        },

        // -- start column and filter popup could be it's own view
        selectItem : function(self, e){
            var target = $(e.currentTarget);
            self.markDirty();
            $("#popupDiv").find('#errorGutter').hide();    
            if(target.prop('checked')){
                self.selectedList.push(target.val());
            }else{
                if(self.selectedList.length <= 1){
                    target.prop('checked', 'checked');
                    $("#popupDiv").find('#errorGutter').show();
                    return;
                }
               self.selectedList = _.without(self.selectedList, target.val());
            }
        },

        saveSelectedItems : function(self, e){
            // grab all selected items and append them to list
            self.markDirty();
            if(self.isAddSearchFieldPopup){
                masterJson.app.filter_order = self.selectedList;
                self.showSearchFields(masterJson.app.filter_order);
            } else if(self.isAddColumnPopup){
                // find which object
                 masterJson.app.objects[self.currentColumnTab].columns = self.selectedList;
                 self.showColumns(masterJson.app.objects[self.currentColumnTab].columns);
            }
            self.hideFilterPopup();
        },

        sorttable : function(self, e){
            var target = $(e.currentTarget);
                sort_icon = target.find('.sort_icon'),
                sortFxn = null;

            if(sort_icon.hasClass('sorterAscImage')){
                sortFxn = self.sortDesc;
                sort_icon.removeClass('sorterAscImage');
                sort_icon.addClass('sorterDescImage') ;
            }else{
                sortFxn = self.sortAsc;
                sort_icon.addClass('sorterAscImage');
                sort_icon.removeClass('sorterDescImage');
            }

            var $element = $('ul.element-list'),
                $elementli = $element.children('li');

            $elementli.sort(sortFxn);

            $elementli.detach().appendTo($element);
        },

        sortDesc : function(a,b){
            var an = a.getAttribute('data-name'),
                bn = b.getAttribute('data-name');

            if(an > bn) {
                return -1;
            }
            if(an < bn) {
                return 1 ;
            }
            return 0;
        },

        sortAsc : function(a,b){
            var an = a.getAttribute('data-name'),
                bn = b.getAttribute('data-name');

            if(an > bn) {
                return 1;
            }
            if(an < bn) {
                return -1 ;
            }
            return 0;
        },

        limitFilters : function(self, e){
            var selected = 0, $elem, checked;
            $('.element-list li').each(function(index, elem){
                checked = $(elem).find('input[type=checkbox]').attr("checked");      
                if(checked){
                    selected++;
                }
            });

            $('.element-list li').each(function(index, elem){
                $elem = $(elem).find('input[type=checkbox]');
                checked = $elem.attr("checked");  
                $elem.prop("disabled", false);//enable all checkboxes    
                if(!checked && selected >= self.MAX_FILTERS){
                    $elem.prop("disabled", true);// disable all non-selected checkboxes
                }
            });
        },

        clearSearch : function(self, e){
            var elem = $("#popupDiv").find("#search-text");
            elem.val('');
            self.toggleSelectedItem(self, e);
        },

        // for filters
        toggleSelectedItem :function(self, e){
            var target = $("input[name=selectType]:checked"), 
                allItems = ($(target).val() === "All"),
                checked, $elem, elemName, 
                total = 0, 
                selected = 0,
                show = false,
                searchText = $('#search-text').val().toLowerCase();

            $('.element-list li').each(function(index, elem){
                $elem = $(elem);
                checked = $elem.find('input[type=checkbox]').attr("checked"); 
                elemName = $elem.data('name');
                total++;

                $elem.hide();
                show = false;

                if(allItems && searchText && (elemName.indexOf(searchText) > -1)){
                    show = true;
                }else if(checked && searchText && (elemName.indexOf(searchText) > -1)){
                    show = true;
                }else if(allItems && !searchText){
                    // show only selected checkboxex
                    show = true;
                }else if(checked && !searchText){
                    show = true;
                }

                if(show){
                    $elem.show();
                    selected++; 
                }
            });
            self.updateCount(total, selected, true);
        },

        updateCount : function(total, selected, fromSearch){
            $('#search-results-label').hide();
            $('#all-results-label').hide();

            if( (selected === 0 && !fromSearch) || (selected === total)){
                $('#all-results-label').show();
                $('#results-total-filter').text("("+total+")");
            }else{
                $('#results-total-filter').text("("+selected+")");
                $('#search-results-label').show();
            }
        },
        // -- end column and filter popup

        hideFilterPopup:function(){
            $("#popupDiv").off("change");
            $("#popupDiv").off("click");
            $("#popupDiv").hide().html();
        },
      
        showColumns: function(colObj) {
            var self = this;
            this.userSelectedColumns = colObj;
            if(this.userSelectedColumns) {
              //  userSelectedColumns = this.sortArrayByProperty(userSelectedColumns, "position");
                var lists = "";
                var count = 0;
                this.userSelectedColumns.forEach(function(element, index) {
                    var newPosition;
                    var dispName = i18n.get(self.namespace, element) ? i18n.get(self.namespace, element) : element;
                    if(self.hiddenColumns.indexOf(element) > -1){
                        return; // skip this column...
                    }
                    lists +=
                    "<li class='list-item-row'data-name='"+ element +
                    "'><span class='searchOrder'><span class='counter'>" + (index +1)+
                    "</span> <i class='fa fa-caret-down order'></i> <i class='fa fa-caret-up order'></i></span>" +
                    "<span class='searchField'><span class='column-title'>" + dispName +"</span></span>" +
                    "<span class='searchCriteria'></span>"+
                    "<span class='removeCriteria'><i class='fa fa-times-circle pointer remove'></i></span></li>";
                });
                $("#details-columns").html(lists);
                if ($("#details-columns > li").length < 2) {
                    $("#details-columns > li:first-child .remove").remove();
                }
            }
        },
        
        sortArrayByProperty: function(array, property) {
            return array.sort(function(a, b) {
                var x = a[property];
                var y = b[property];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        },

        showSearchFields: function(searchFilters) {
            var self = this;
            this.userSelectedFilters = searchFilters;
            if(this.userSelectedFilters && this.userSelectedFilters) {
              //  userSelectedFilters = this.sortArrayByProperty(userSelectedFilters, "position");
                var lists = "";
                var count = 0;
                this.userSelectedFilters.forEach(function(element, index) {
                    var newPosition;
                    var dispName = i18n.get(self.namespace, element) ? i18n.get(self.namespace, element) : element;
                    if(self.hiddenColumns.indexOf(element) > -1){
                        return; // skip this column...
                    }
                    lists +=
                    "<li class='list-item-row' data-name='"+ element +
                    "'><span class='searchOrder'><span class='counter'>" + ++index +
                    "</span> <i class='fa fa-caret-down order'></i> <i class='fa fa-caret-up order'></i></span>" +
                    "<span class='searchField'><span class='column-title'>" + dispName +"</span></span>" +
                    "<span class='searchCriteria'></span>"+
                    "<span class='removeCriteria'><i class='fa fa-times-circle pointer remove'></i></span></li>";
                });
                this.$el.find("#details-search-fields").html(lists);
                if (this.$("#details-search-fields > li").length < 2) {
                    this.$("#details-search-fields > li:first-child .remove").remove();
                }
            }
        },

        deleteSelected: function(e) {
            this.markDirty();
            var $parentElement = $(e.target).parent()
            $parentElement.parents('.select2-search-container').hide();
            $parentElement.parents('.select2-search-container').siblings('div.basicSearchInput').show();
            $(e.target).parent().remove();
        },

        removeFieldRow: function(e) { //columns
            this.markDirty();
            var target = $(e.currentTarget),
                parentLi = target.parents('li.list-item-row'),
                nameToRemove = parentLi.attr('data-name'),
                columns = [];

            $('#details-columns').find('li').each(function(index, obj){
                name = $(this).data('name');
                if(name !== nameToRemove){
                    columns.push(name);
                }
            });
            masterJson.app.objects[this.currentColumnTab].columns =  columns;
            this.showColumns(columns);
        },

        removeSelectedSearchField: function(e) {
            this.markDirty();
            var target = $(e.currentTarget),
                parentLi = target.parents('li.list-item-row'),
                name = parentLi.attr('data-name');
            masterJson.app.filter_order = _.without(masterJson.app.filter_order, name); 
            
            this.showSearchFields(masterJson.app.filter_order);
        },

        notify :function(message){
            this.gotoHomeView();
            $("#uiActionMsg").showMessage(message);
        },

        gotoHomeView: function() {
            var cancelDialog, self = this;

            if (this.dirty) {
                cancelDialog = new CancelCreateEditDialogView({
                    namespace: this.namespace,
                    callback: function(result) {
                        switch (result) {
                            case "save" :
                                self.saveConfig();
                                self.track("Cancelled create/edit but chose to save first");
                                break;
                            case "dontsave" :
                                self.closeForm();
                                self.track("Cancelled create/edit without saving");
                                break;
                        }
                    }
                });
                cancelDialog.render();
            } else {
                self.closeForm();
                self.track("Cancelled create/edit but made no changes");
            }
            
        },

        closeForm : function(){
            this.undelegateEvents();
            config.router.navigate("advancesearch", {trigger: true});
        },

        selectTabs : function(){
            this.tabSelectionView = new TabSelectionView({
                el : $("#popupDiv"),
                selectedTabs : masterJson.app.object_order,
                allTabs : masterJson.app.objects,
                detailOrderItem: this.detailOrderItem
            });
            this.listenToOnce(this.tabSelectionView, "change", this.saveTabs);
        },

        //callback from tabselectionview
        saveTabs : function(data){
            this.markDirty();
            masterJson.app.object_order = data.object_order;
            masterJson.app.objects = data.objects;
            // do we need to redraw tabs?
            this.renderTabs(masterJson); 
            // show columns for the first tab
            this.showColumns(masterJson.app.objects[masterJson.app.object_order[0]].columns);
            this.currentColumnTab = masterJson.app.object_order[0];
        },

        validate : function(){
            var self = this;
            var msgs = [], msg;
            // at least 1 filter should be selected
            if(masterJson.app.filter_order.length == 0){
                msg = i18n.get(this.namespace, 'filterEmpty') || 'You must select at least one filter.';
                msgs.push(msg);
            }else if(masterJson.app.filter_order.length > 10){
                // at most 10 filters are allowed
                msg = i18n.get(this.namespace, 'maxfilterLimit') || 'Maximum number of filters allowed is ten (10).';
                msgs.push(msg);
            }   

            // at least one tab should be selected -> this on the TabSeelctionView
            if(masterJson.app.object_order.length === 0){
                msg = i18n.get(this.namespace, 'emptyTab') || 'You must select at least one tab.';
                msgs.push(msg);
            }

            // at least 1 column should be selected for given tab
            _.each(masterJson.app.objects, function(value, key){
                if(value.columns === 0){
                    msg = i18n.get(self.namespace, 'emptyColumn');
                    if(msg){
                        msg = msg+" "+value.name+"."
                    }else{
                        msg = "You must select at least one column for tab "+value.name+"."
                    }
                    msgs.push(msg);
                }
            });
            if(msgs.length > 0){
                // add to error gutter 
                $('#errorGutter').html(msgs.join('<br/>')).show();
                return false;
            }
            return true;
        },

        saveConfig : function(){
            var self = this;
            var result= this.validate();
            if(!result){
                return;
            }

            var missingUnitType = [], unitType, allColsForTab, tabFilters;
            _.each(masterJson.app.objects, function(value, key){
                // reconcile filters (does filter belong to this tab based on it's columns)
                allColsForTab = _.pluck(self.alldimensions[key], 'value');
                tabFilters = _.intersection(masterJson.app.filter_order, allColsForTab);
                value.filters = tabFilters;

                // // join units and unit types
                // _.each(value.columns, function(col, index){  
                //     unitType = col+"_UNIT_TYPE_DISPLAY";
                //     //console.log(col, unitType, allColsForTab.indexOf(unitType));
                //     if(allColsForTab.indexOf(unitType) > -1){
                //         missingUnitType.push(unitType);
                //     }
                // });
                // value.columns = _.union(value.columns, missingUnitType);

                //mandatory columns for orderassign
                if(key === 'orderassign'){      
                    if(value.columns.indexOf('PARTICIPANT_NAME') == -1) value.columns.push('PARTICIPANT_NAME');
                    if(value.columns.indexOf('SPLIT_AMOUNT_PCT') == -1) value.columns.push('SPLIT_AMOUNT_PCT');               
                }

                // remove duplicates columns -> dow we need it?
                value.columns = _.uniq(value.columns);
            });

            var jsonData = JSON.stringify(masterJson); // pass it as a string vs json for some reason
            var url = config.appContext + "/api/advsearch/preferences";
            var savedMsg = i18n.get('icmadvanced.advsearch', 'changesSaved') || 'Changes to the settings were saved successfully.';
            $.ajax({
                type: 'POST',
                url: url,
                processData: true,
                data: {
                    "jsonInput": jsonData,
                    "preferenceType": "user"
                }
            }).done(function(response, textStatus, jqXHR) {
                self.markClean();
                self.notify(savedMsg);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                self.error(null, jqXHR, null);
            })
        },

        /**
         * This method renderd error message while performing an operation with server.
         *  
         * @param {object} A jqXHR object.
         * @param {String} Result of the server operation. 
         * @param {String} When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
         */
        error: function (collection, jqXHR, options) {
            var self = this;
            var header = "Error",
                message = "We are experiencing technical difficulties. Try again or contact Xactly Support.";
            try{
                var json = JSON.parse(jqXHR.responseText);
                message = json.message;
            } catch(err){} 

            var labels = {
                header: header,
                header_i18n: "errorHeader",
                message: message,
                message_i18n: "",
                confirmButton: "Ok",
                confirmButton_i18n: "ok"
            };

            var dialogOptions = {};
            dialogOptions.labels = labels;
            
            var dialogView = new DialogView(dialogOptions);
            dialogView.render();
            self.listenToOnce(dialogView, "confirm", function() {
              self.stopListening(dialogView);
              dialogView.stopListening();
            });
        }
    });
    return AdvSearchSetting;

});