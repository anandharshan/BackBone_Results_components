define([
    'jquery',
    'jqueryUI',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'BaseListView',
    'pageUtils',
    'resultsPPACollection',
    'text!results/resultsPPA/html/resultsPPAListView.html',
    "text!results/resultsPPA/html/ppaListViewDetailsTab.html"
], function($, jqueryUI, _, Backbone, config, i18n, BaseListView, pageUtils, 
    ResultsPPACollection, resultsListViewHTML, detailsTabTemplate) {

    var PPAResultsDisplayView = BaseListView.extend({

        events: {
            "click #ppaPeriods-list .list-item-row" : "showPeriodDetails"
        },

        initialize: function(options) {
            this.pageName = "LIST View - Initialized";
            
            this.searchParams = options.searchParams;
            this.periodsCollection = [];
            this.unitTypeStr = options.unitTypeStr;
            this.periodModel = options.periodModel;
            this.ppaCollection = new ResultsPPACollection([], {
                searchParams: options.searchParams
            });
        },

        showPeriodDetails: function(e){
            var self = this;
            var parentContainer = $(e.target).data('periodid') !== undefined ? $(e.target) :$(e.target).parents(".list-item-row");
            
            if(parentContainer.children(".list-item-detail").is(':visible')){
                parentContainer.children(".list-item-detail").hide();
                $("div.list-item-row-selected").removeClass("list-item-row-selected");
            } else {
                $(".list-item-detail").hide();
                $("div.list-item-row-selected").removeClass("list-item-row-selected");
                parentContainer.children(".list-item-detail").show();
                parentContainer.addClass("list-item-row-selected");
                self.prepareDetailsTemplate(parentContainer.data("periodid"), parentContainer.children(".list-item-detail"));
            } 
        },

        prepareDetailsTemplate: function(periodId, el){
            var self = this, detailsTemplate = _.template(detailsTabTemplate);
            $.ajax({
                type: "GET",
                url: config.appContext + "/api/v1/pppResults/details?unitTypeId="+ self.searchParams.unitTypeId +"&periodId="+ periodId +"&type=" + self.searchParams.resultsTypeName ,
                dataType: "json",
                success: function(data) {
                    el.html(detailsTemplate($.extend({}, {
                        "detailsData": data,
                        "unitTypeStr": self.unitTypeStr
                    })));
                },
                error: function(err) {
                    
                }
            });
        },

        loadPeriodsCollection: function(){
            var self = this,
                ppaPeriodsList = $("#ppaPeriods-list"), 
                resultsCount = 0,
                template = _.template(resultsListViewHTML);
            var checkItemsPresent = false;

            var periodArray = $.map(self.periodModel.attributes, function(value, index) {
                            return [value];
                        });
            self.ppaCollection.fetch({
                success:function(response){
                    self.periodsCollection = response.attributes.periodResultWSOMap;
                    _.each(self.periodsCollection, function(item, index){
                        resultsCount = resultsCount + _.size(item);
                    });
                },
                error:function(error){
                    console.log(error);
                }
            }).then(function(){
                _.each(self.periodsCollection, function(periods){
                    _.each(periods,function(item){
                        if(item.periodId != undefined){
                            checkItemsPresent = true;
                            return false;
                        }

                    });
                    if(!checkItemsPresent){
                        return false;
                    }
                });

                self.$("#ppaPeriods-list").html("");

                self.$el.html(template($.extend({}, {
                    "periodResultWSOMap": self.periodsCollection,
                    "unitTypeStr":self.unitTypeStr,
                    "periodData":periodArray 
                })));
            }).then(function(){
                if(checkItemsPresent){
                    $("#noResultsDisplay").hide();
                    $("#listViewPPAResults").show();
                    $("#ppaPeriods-list").show()
                } else {
                    $("#noResultsDisplay").show();
                    $("#listViewPPAResults").hide();
                    $("#ppaPeriods-list").hide();
                }
                $("#listViewPPAResults").xlate({
                    namespace: "icmadvanced.ppaResults"
                });
                
            });
        },

        render: function(){
            var label, self = this;
            self.loadPeriodsCollection();
        },

    });

    return PPAResultsDisplayView;

});

