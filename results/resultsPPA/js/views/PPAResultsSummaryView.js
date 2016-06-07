define([
    'jquery',
    'jqueryUI',
    'underscore',
    'bootstrap',
    'backbone',
    'config',
    'i18n',
    'BaseListView',
    'pageUtils',
    'resultsPPACollection',
    'text!results/resultsPPA/html/resultsPPASummaryView.html',
    'text!results/resultsPPA/html/popoverTemplate.html'
], function($, jqueryUI, _, Bootstrap, Backbone, config, i18n, BaseListView, pageUtils, 
    ResultsPPACollection, resultsPPASummaryView, popoverTemplate) {

    var PPAResultsSummaryView = BaseListView.extend({

        events: {
            "mouseover .arrowCells": "displayHelpQueueLinks"
        },

        initialize: function(options) {
            this.pageName = "PPA Results View";
            _.bindAll(this, "render", "updateList");

            this.model = options.periodModel;
            this.searchParams = options.searchParams;
            this.periodToIndex = options.periodToIndex;
            this.periodOffset = 12;

            this.resultsCollection = new ResultsPPACollection([], {
                searchParams: options.searchParams
            });
        },

        displayHelpQueueLinks: function(e){
            var template = _.template(popoverTemplate);
            var htmlContent = template($.extend({}, {
                        "periodStr": $(e.target).parent("td").find("span").data("periodstr"),
                        "asOfPeriodStr": $(e.target).parent("td").find("span").data("asofperiodstr"),
                        "originalAmt": $(e.target).parent("td").find("span").data("originalamt"),
                        "changeamt": $(e.target).parent("td").find("span").data("changeamt"),
                        "changeamtstr": $(e.target).parent("td").find("span").data("changeamtstr")
                    }));

            var options = {
                placement: "top",
                trigger: "hover focus",
                content: htmlContent,
                container: "#resultsPPA-view",
                html: true
            };
        
            $(e.target).popover(options);
            $(e.target).on("shown.bs.popover", function() {
            
                $(".popover-content").css("background-color", "#5c7f92");
                $(".popover").css("background-color", "#5c7f92");  
                // $("#batchLinkHelpBox").xlate({
                //     namespace: "icmadvanced.orders"
                // });      
            });
            $(e.target).popover('show')

        },

        getResultsCollection: function() {
            var self = this;
            var template = _.template(resultsPPASummaryView)
            var periodArray, periodResultWSOMap;
            var checkItemsPresent = false;
           
            self.resultsCollection.fetch({
                success: function(response){
                    periodResultWSOMap = response.attributes.periodResultWSOMap;
                },
                error:function(error){
                    console.log(error);
                }
            }).then(function(){
                _.each(periodResultWSOMap, function(periods){
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
               
                periodArray = $.map(self.model.attributes, function(value, index) {
                    return [value];
                });

                self.$el.html(template($.extend({}, self.model.attributes, {
                    "periodData": periodArray,
                    "periodFrom": self.searchParams.periodFromId,
                    "periodTo": self.searchParams.periodToId,
                    "periodToIndex": self.periodToIndex,
                    "periodOffset": self.periodOffset,
                    "periodResultWSOMap": periodResultWSOMap
                })));

                if(checkItemsPresent){
                    $("#noResultsDisplay").hide();
                    $("#listViewPPAResults").show();
                } else {
                    $("#noResultsDisplay").show();
                    $("#listViewPPAResults").hide();
                }
            }).then(function(){
                $(".summaryAsOfContainer").width($("#list").width() - 167);
                $("#listViewPPAResults").xlate({
                    namespace: "icmadvanced.ppaResults"
                });
            });
        },

        render: function(){
            var label, self = this;
            self.getResultsCollection();
        },

    });

    return PPAResultsSummaryView;

});

