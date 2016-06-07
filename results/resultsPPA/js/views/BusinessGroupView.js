define([
    'jquery',
    'underscore',
    'config',
    'BaseListView',
    'i18n',
    'i18nJQuery',
    'dialogView',
    'TableView',
    'businessGrpCollection',
    'BusinessGrpListItemView',
    'text!results/resultsPPA/html/businessGrpDialog.html',
    'text!results/resultsPPA/html/businessGrpListItem.html'
], function ($, _, config, BaseListView, i18n, i18nJQuery, DialogView, 
    TableView, BusinessGrpCollection, BusinessGrpListItemView, viewHTML, businessGrpListTemplate) {

    var BusinessGroupView = BaseListView.extend({

        selectedItem:[],

        events: {
            "click input[name='selectedElement']"           : "businessSelected",
            'click .search-button'                          : 'searchClicked',
            'change .search-text'                           : 'searchChanged',
            'keypress .search-text'                         : 'searchKeypress',
            "click .businessGrp-buttonJS.x-button-enabled"  : "addBusinessGrp",
            'click .businessGrp-cancel-buttonJS'            : 'cancelButtonClicked',
            "click input[name='businessSelectType']"        : "businessSelectType",
            "click #includeAllBgs"                          : "allBusinessGrpsIncluded",
            "click #businessGrp-clear-search"               : "clearSearch",
        },

        initialize: function (options) {
            this.pageName = "Business Groups";
            _.bindAll(this, "render", "updateList");
            this.collection = new BusinessGrpCollection();
            this.collection.params.sortBy = ['name'];
            this.collection.params.sortOrder = ['asc'];
            this.config = config;
            this.selectedItem = [];

            if(options.mode){
                this.mode = options.mode;
                this.selectedData = options.selectedData.split("|");
            }

            this.listenTo(this.collection, "sync", this.handleSync);
        },

        businessSelectType: function(){
            var batchSelectRadio = $("input:radio[name=businessSelectType]:checked").val();
            if(batchSelectRadio === 'Available'){
                $("ul.item-list").show();
                $("ul.selectedList").hide(); 
                $(".list-nav").show();        
            }
            else{
                $("ul.item-list").hide();
                $("ul.selectedList").show();
                $(".list-nav").hide();
            }      
        },

        clearSearch: function() {
            $(".search-text").val("");
            this.collection.params.searchtext = "";
            this.collection.params.searchfield = "";
            this.loadPagedCollection();
        },

        allBusinessGrpsIncluded: function(e){
            var self = this;
            if (self.selectCallback) {
                self.selectCallback("INCLUDE_ALL_BGS");
            }
            self.undelegateEvents();
        },

        addBusinessGrp: function(e){
            var self = this;
            if (self.selectCallback) {
                self.selectCallback(this.selectedItem);
            }
            self.undelegateEvents();
        },

        searchClicked: function () {
            this.track('Search');
            this.collection.params.offset = 0;
            this.collection.params.currentPage = 1; 
            this.loadPagedCollection();
        },

        searchChanged: function() {
            this.collection.params.searchtext = [this.$('.search-text').val()];
            this.collection.params.searchfield = ['name'];
        },

        searchKeypress: function (e) {
            if (e.keyCode === 13) {
                this.collection.params.searchtext = [this.$('.search-text').val()];
                this.collection.params.searchfield = ['name'];
                this.searchClicked();
            }
        },

        cancelButtonClicked: function() {
            
            var self = this;
            self.trigger('cancel');
            $("#modal-container").empty();
            $("#modal-container").modal('hide');
            self.undelegateEvents();
        },

        businessSelected: function(e){
            var self = this;
            var businessGrp = {}, checkboxSelector = ' :checkbox[value=' + $(e.target).val() + ']';

            if($(e.target).is(":checked")){
                businessGrp.id = $(e.target).val();
                businessGrp.name = $(e.target).data("name");

                self.selectedItem.push(businessGrp);
                self.addBusinessToList(businessGrp, true);
            } else {
               self.selectedItem = _.without(self.selectedItem, _.findWhere(self.selectedItem, {id: $(e.target).val()}));
               $('ul.selectedList' + checkboxSelector).closest('div').remove();
               $('ul.item-list' + checkboxSelector).prop('checked', false);
            }
            
            if(self.selectedItem.length){
                $(".businessGrp-buttonJS").addClass("x-button-enabled").removeClass("deactive");
            } else {
                $(".businessGrp-buttonJS").removeClass("x-button-enabled").addClass("deactive");
            }

        },


        addBusinessToList: function(businessGrp, isSelected) {
            var self = this;
            var template = _.template(businessGrpListTemplate);

            if(isSelected){
                var toggleCheck = true;
                if($("ul.selectedList div").length == 0){
                    $("ul.selectedList").append(template($.extend({}, {
                        id: businessGrp.id, 
                        name: businessGrp.name,
                        isSelected: isSelected
                    })));
                }else {
                    $("ul.selectedList .process-name-column").each( function() {
                        if((businessGrp.name.toLowerCase() < $(this).text().toLowerCase()) && toggleCheck){
                            $(this).closest("div").before(template($.extend({}, {
                                id: businessGrp.id, 
                                name: businessGrp.name,
                                isSelected: isSelected
                            })));  
                            toggleCheck = false;
                        }
                    });
                    if(toggleCheck){
                        $("ul.selectedList").append(template($.extend({}, {
                            id: businessGrp.id, 
                            name: businessGrp.name,
                            isSelected: isSelected
                        })));
                    }
                }

            } else {
                $("ul.selectedList").append(template($.extend({}, {
                        id: businessGrp.id, 
                        name: businessGrp.name,
                        isSelected: isSelected
                })));
            }
        },

        handleSync: function () {
            var self = this;
            if (self.tableView) {
                self.tableView.renderRows();
                if (self.tableView.paginationView) {
                    self.tableView.paginationView.render();
                }
            }
            setTimeout(function() {
                if(self.mode && self.selectedItem.length){

                _.each(self.selectedItem, function(item){
                        $(".item-list input[value='"+ item.id +"']").prop("checked", true);
                });
                }
            }, 200);
            
        },


        render: function () {
            var self = this;
            
            i18n.load(self.namespace, "../../../icmadvanced/api/messages").then(function () {
                    self.$el.html(viewHTML);

                    self.$('.results-list-wrapper').addClass('process-list');
                    self.tableView = new TableView({
                        el: self.$('#list'),
                        namespace: self.i18nNamespace,
                        collection: self.collection,
                        headers: [
                        {
                            name: 'selectColumn',
                            label: 'Select',
                            className: "selectColumn"
                        },
                        {
                            name: 'name',
                            label: 'Name',
                            className: "nameColumn"
                        }],
                        rowView: BusinessGrpListItemView
                    });
                    //self.$('.page-container').xlate({namespace: self.i18nNamespace});
                    self.trigger('rendered');
                    self.$el.modal({
                        backdrop: 'static',
                        keyboard: false
                    });
                    if(self.mode){
                        $('#includeAllBgs').show();
                    }
                    $('#modal-container').addClass('criteria-modal');
                }).then(function(){
                    var businessGrp = {};
                    self.selectedItem = [];
                    if(self.selectedData != ""){
                        _.each(self.selectedData, function(item){
                            var itemTemp = item.split(";");

                            businessGrp = {};
                            businessGrp.id = itemTemp[0];
                            businessGrp.name = itemTemp[1];

                            self.selectedItem.push(businessGrp);
                            self.addBusinessToList(businessGrp, true);
                        });
                    }
                });
        },

    });

    return BusinessGroupView;
});
