define([
    'jquery',
    'jqueryUI',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'BaseListView',
    'select2',
    'currencyUnitTypesCollection',
    'resultsPPAPeriodModel',
    'personView',
    'earningGrpView',
    'ppaResultsDisplayView',
    'ppaResultsSummaryView',
    'popupHelper',
    'BusinessGroupView',
    'jqueryCookie',
    'text!results/resultsPPA/html/resultsPPAView.html',
    'text!results/resultsPPA/html/breadCrumbTemplate.html',
    'text!results/resultsPPA/html/searchParameterTemplate.html'
], function($, jqueryUI, _, Backbone, config, i18n, BaseListView, select2, CurrencyUnitTypesCollection, 
    ResultsPPAPeriodModel, PersonView, EarningGrpView, PPAResultsDisplayView, PPAResultsSummaryView, popupHelper, 
    BusinessGroupView, jqueryCookie, resultsTemplate, breadCrumbTemplate, searchParameterTemplate) {

    var PPAView = BaseListView.extend({
        namespace: "icmadvanced.ppaResults",
        resultsPPAView:[],

        events: {
            "click .selectItemPopUP"                : "showPopup",
            "click .itemSelectClose"                : "removeItem",
            "click .displayViewOptions .caret_icon" : "showDisplayViewOptions",
            "click input[name='optView']"           : "displayViewChanged",
            "click .searchBreadcrumb_LI_fa"         : "removeCrumbItem",
            "click .expander"                       : "toggleSidebar",
            "click #createPDF .x-button-enabled"    : "createPDF", 
        },

        initialize: function(options) {
            this.pageName = "Processing Groups";
            this.breadCrumb = [];
        },

        absolutePath: function(href) {
            var link = document.createElement("a");
            link.href = href; // important: this is needed for all browsers
            var cssURL = '';
            if (link.toString().indexOf("http") > -1) {
                cssURL = link.toString();
            } else {
                cssURL = (link.protocol + "//" + link.host + link.pathname + link.search + link.hash);
            }
            if (cssURL.indexOf(".local") > -1) {
                cssURL = cssURL.replace('https', 'http');
            }
            return cssURL;
        },

        htmlSpecialCharsEntityEncode: function(str) {
            var self = this,
                htmlSpecialCharsRegEx = /[<>&\r\n"']/gm,
                htmlSpecialCharsPlaceHolders ={
                    '<': 'lt;',
                    '>': 'gt;',
                    '&': 'amp;',
                    '\r': "#13;",
                    '\n': "#10;",
                    '"': 'quot;',
                    "'": '#39;' /*single quotes just to be safe, IE8 doesn't support &apos;, so use &#39; instead */
                };
            return str.replace(htmlSpecialCharsRegEx, function(match) {
                return '&' + htmlSpecialCharsPlaceHolders[match];
            });
        },

        createPDF: function(){
            var self = this;

            // create head element
            var head = [];
            head.push("<meta charset='UTF-8'>");
            // get all css
            $('link').map(function(i) {
                head.push("<link href='" + self.absolutePath($(this).attr('href')) + "' rel='stylesheet'/>");
            });
            head.push('<style>.list-wrapper {padding: 0px !important;}.resultsPPA-PeriodCol{width: 100px !important;}' + 
                        '.list-item-header .resultsPPA-latestBalance{padding-right: 20px !important; width: 150px !important; }'+
                        '.list-item-header .resultsPPA-originalBalance {width: 150px !important;}' +
                        '.resultsPPA-asOfPeriod {width: 100px !important;}.resultsPPA-originalBalance {width: 120px !important;}'+
                        '.resultsPPA-changeCol {width: 120px !important;}.resultsPPA-unitType{width:auto !important;margin-right: 30px;}'+
                        '.list-item-detail.row-fluid{max-height:none !important}'+
                        '#ppaPeriods-list .resultsPPA-latestBalance{width: 100px !important; }.arrowCells{float:none !important;}</style>'); // fix for indentation

            var body = $('<body></body>');
            var clonedHTML = $('#listViewPPAResults').clone(false); // clone body


            body.append(clonedHTML.html());

            // wrap head and cloned body in html in form element
            var requestBody = "<!DOCTYPE html><html><head>" + head.join(' ') + "</head><body>" + body.html() + "</body></html>";

            var html = "<form method='POST' enctype='application/x-www-form-urlencoded' action='" + config.appContext + "/api/v1/pdf/download' id='pdfform'>";
            html += "<input type='hidden' name='htmlBody' value='" + self.htmlSpecialCharsEntityEncode(requestBody) + "' />";

            self.pdfstamp = new Date().getTime();
            html += '<input type="hidden" name="stamp" value="' + this.pdfstamp + '" />';
            html += "<input type='hidden' name='nameOfFile' value='DOWNLOAD_PDF_" + this.pdfstamp  + "'>";

            html += "</form>";

            $('#pdfframe').remove();
            // place the html in iframe and send content
            var pdfframe = $('<iframe id="pdfframe"/>').appendTo('body');

            setTimeout(function() {
                $('#pdfframe').contents().find('body').html(html);
                $('#pdfframe').contents().find('#pdfform').submit(); // submit this content to PDF generation
            }, 100);


            var pdfProgressMSg = "PDF report is being generated";
            var pdfErrorMSg = "Error creating PDF file. Please try again or contact Xactly Support.";

            var pdfmsg_template = _.template($("#pdgprogress-tempalte").html());
            $("body").append(pdfmsg_template);
            var pdfSpinner = $("#pdf-spinner");
            var pdfmsg = $("#pdf-msg");
            pdfmsg.find(".pdf-gen-msg").html(pdfProgressMSg);
            pdfSpinner.find(".pdfclose").hide();
            pdfSpinner.find(".k-loading-image").show();

            pdfSpinner.height($(document).height());
            pdfSpinner.width($(document).width());

            self.pdfInterval = setInterval(function() {
                var cookieStamp = $.cookie("pdfstamp");
                console.log(cookieStamp);
                if (cookieStamp == self.pdfstamp) {
                    clearInterval(self.pdfInterval);
                    self.removePdfProgress();
                } else if (cookieStamp === "ERROR") {
                    clearInterval(self.pdfInterval);
                    pdfmsg.find(".pdf-gen-msg").html(pdfErrorMSg);
                    pdfmsg.find(".k-loading-image").hide();
                    pdfmsg.find(".pdfclose").show();
                }
            }, 750);

            $("#close-pdf-button").off("click").on("click", self.removePdfProgress);
            self.track('Pdf Requested');

        },

         removePdfProgress: function() {
            if (this.pdfform) this.pdfform.remove();
            $("#pdf-spinner").remove(); // clean up UI spinner
            $("#pdf-msg").remove();
            $.removeCookie("pdfstamp");
        },

        toggleSidebar: function(e) {
            var $currentElement = this.$(e.target);
            var $sideBarContentElement = $currentElement.siblings(".sidebar-content");
           
            if (!$currentElement.hasClass("expand")) {
                $sideBarContentElement.width("20px");
                $sideBarContentElement.hide();
                $(".sidebar").css("padding-right","10px");
                $currentElement.toggleClass("expand");
                $(".summaryAsOfContainer").width($("#list").width() - 167);
                if(self.resultsView) {
                    self.resultsView.trigger("setupScroll");
                }
            } else {
                $sideBarContentElement.width("250px").show();
                $currentElement.toggleClass("expand");
                $(".sidebar").css("padding-right","0px");
                if(self.resultsView) {
                    self.resultsView.trigger("setupScroll");
                }
                $(".summaryAsOfContainer").width($(".summaryAsOfContainer").width() - 240);
            }
        },

        removeCrumbItem: function(e){
            var self = this;
            $('li div[data-criteriaid="' + $(e.target).data('removeid') + '"]').siblings('.itemSelectClose').click();
        },

        addUnitTypes: function(data){
            var options = [];
            var self = this, selectedCurrency = "", selectedCurrencyId;

            $.ajax({
                type: "GET",
                url: config.appContext + "/api/v1/preferences/getBusinessCurrency",
                dataType: "JSON",
                success: function(data) {
                    selectedCurrency = data.value;
                },
                error: function(err) {
                    
                }
            }).then(function(){
                $.each(data.models, function(index, object) {
                    if(object.attributes["name"] === selectedCurrency){
                        console.log(selectedCurrency);
                        selectedCurrencyId = object.attributes["id"];
                    }
                    options.push("<option data-id='"+ object.attributes["id"] +"' value='" + object.attributes["id"] + "'>" + object.attributes["name"] + "</option>");
                });
                $("select#dropdown-resultsUnitType").html(options.join(" "));
                $("#dropdown-resultsUnitType").select2({
                    minimumResultsForSearch: -1,
                }).on("change", function(e) {
                    self.createBreadCrumbs();
                });

                $("#dropdown-resultsUnitType").select2("val", selectedCurrencyId);
            });
        },

        addResultsType: function(){
            var self=this;
            var options = [];

            var resultsTypeValues=[ {name:"Balances", value:"BALANCES"},
                                    {name:"Bonuses", value:"BONUSES"},
                                    {name:"Commissions", value:"COMMISSIONS"},
                                    {name:"Credits", value:"CREDITS"},
                                    // {name:"Draws", value:"DRAWS"},
                                    {name:"Payments without balances", value:"PAYMENTS_WITHOUT_BALANCES"},
                                    {name:"Payments with balances", value:"PAYMENTS_WITH_BALANCES"},
                                    {name:"Processed orders", value:"PROCESSED_ORDERS"} ] ;
            $.each(resultsTypeValues, function(index, object) {
                options.push("<option data-id='"+ (object.name + index) +"' value='" + object.value + "'>" + object.name + "</option>");
            });
            $("select#dropdown-resultsType").html(options.join(" "));
            $("#dropdown-resultsType").select2({
                minimumResultsForSearch: -1,
            }).on("change", function(e) {
                self.createBreadCrumbs();
                if(e.val == "BONUSES" || e.val == "COMMISSIONS" || e.val == "DRAWS"){
                    $("#earningGrpPopup").show();
                    $("#earningGrpCmp").show()
                } else {
                    $("#earningGrpPopup").hide();
                    $("#earningGrpCmp").hide();
                    $("#earningGrpCmp .itemSelectClose").click();
                }
                if(e.val == "PROCESSED_ORDERS"){
                    $("#businessGrpPopup").hide();
                    $("#businessGrpCmp").hide();
                    $("#businessGrpCmp .itemSelectClose").click()
                } else {
                    $("#businessGrpPopup").show();
                    $("#businessGrpCmp").show();
                }
            });

        },

        addPeriodsFromTo: function(data){
            var options = [];
            var self = this;
            var lastIndex, periodOffset = 11;

            $.each(data.attributes, function(index, object) {
                lastIndex = index;
                options.push("<option data-index='"+ index +"'data-id='"+ object.id +"' value='" + object.id + "'>" + object.name + "</option>");
            });

            $("select#periods-selectFrom").html(options.join(" "));
            $("#periods-selectFrom").select2({
                minimumResultsForSearch: -1,
            }).on("change", function(e) {
                if(parseInt(e.val) > parseInt($("#periods-selectTo").select2("val")))
                    $("#periods-selectTo").select2("val", e.val);
                self.createBreadCrumbs();
            });

            $("select#periods-selectTo").html(options.join(" "));
            $("#periods-selectTo").select2({
                minimumResultsForSearch: -1,
            }).on("change", function(e) {
                if(($(e.target).find(":selected").data("index") + periodOffset) <= lastIndex){
                    $("#periods-selectFrom").select2("val", data.attributes[$(e.target).find(":selected").data("index") + periodOffset].id);
                    $("#periodsPPAFrom").html($("#periods-selectFrom").select2().find(":selected").text());
                } else {
                    $("#periods-selectFrom").select2("val", data.attributes[lastIndex].id);
                    $("#periodsPPAFrom").html($("#periods-selectFrom").select2().find(":selected").text());
                }
                self.createBreadCrumbs();
            });

            if(_.size(data.attributes) > periodOffset) {
                $("#periods-selectFrom").select2("val", data.attributes[periodOffset].id);
                $("#periodsPPAFrom").html($("#periods-selectFrom").select2().find(":selected").text());
            } else {
                $("#periods-selectFrom").select2("val", data.attributes[lastIndex].id);
                $("#periodsPPAFrom").html($("#periods-selectFrom").select2().find(":selected").text());
            }
            
        },

        fetchPPAPeriods: function(){
            var self = this;
            self.resultsPPAPeriodModel = new ResultsPPAPeriodModel();
            self.resultsPPAPeriodModel.fetch({
              success: function(data) {
                self.addPeriodsFromTo(data);     
              },
              error: function() {}
            }).then(function() {
                self.createBreadCrumbs();
            });
        },

        createBreadCrumbs: function(){
            var self = this;
            var htmlContent = _.template(breadCrumbTemplate);
            self.breadCrumb = [];
            
            self.breadCrumb.push({
                name:$("#dropdown-resultsType").select2().find(":selected").text(),
                removable:false
            });
            
            self.breadCrumb.push({
                name:$("#periods-selectFrom").select2().find(":selected").text() + " To " + $("#periods-selectTo").select2().find(":selected").text(),
                removable:false
            });

            self.breadCrumb.push({
                name:$("#dropdown-resultsUnitType").select2().find(":selected").text(),
                removable:false
            });

            if($('#personPopupCmp .select2-search-container li div').text()){
                self.breadCrumb.push({
                    name:$('#personPopupCmp .select2-search-container li div').text(),
                    removable:true,
                    removeId: $('#personPopupCmp .select2-search-container li div').data("criteriaid")
                });
            }

            if($('#earningGrpCmp .select2-search-container li div').text()){
                $('#earningGrpCmp .select2-search-container li').find('div').each(function(index, element){
                    self.breadCrumb.push({
                        name:$(element).find('span').text(),
                        removable:true,
                        removeId: $(element).data("criteriaid")
                    });
                });
            }

            if($('#businessGrpCmp .select2-search-container li div').text()){
                $('#businessGrpCmp .select2-search-container li').find('div').each(function(index, element){
                    self.breadCrumb.push({
                        name:$(element).find('span').text(),
                        removable:true,
                        removeId: $(element).data("criteriaid")
                    });
                });
            }
            
            this.$("#listBreadCrumbs .ulStyle").html(htmlContent($.extend({}, {
                    "breadCrumbData": self.breadCrumb
            })));

            if($(".type_icon .fa").hasClass("fa-table")){
                self.renderThisView("summary");
            } else {
                self.renderThisView("list");
            }
            //self.renderThisView("list");
            
        },


        getSearchParams: function(){
            var searchParamsObj = {}, PPAPeriodFromIndex, personId=[];

            searchParamsObj = {
                resultsTypeName: $("#dropdown-resultsType").select2().find(":selected").val(),
                periodToId: $("#periods-selectTo").select2().find(":selected").data("id"),
                periodFromId: PPAPeriodFromIndex <= $("#periods-selectFrom option").length ? $("#periods-selectFrom option[data-index='" + PPAPeriodFromIndex + "']").val() : $("#periods-selectFrom option[data-index='" + ($("#periods-selectFrom option").length-1) + "']").val() ,
                unitTypeId: $("#dropdown-resultsUnitType").select2().find(":selected").val(),
                personId: $('#personPopupCmp .select2-search-container li div').data("criteriaid") != null ? $('#personPopupCmp .select2-search-container li div').data("criteriaid"):[],
                earningGroupNames: $('#earningGrpCmp .select2-search-container li div').map(function(index, item){
                                    return $(item).find(".paramName").text();
                                }).get(),
                businessGrpIds: $('#businessGrpCmp .select2-search-container li div').map(function(index, item){
                                    return $(item).data("criteriaid");
                                }).get(),
            }

            return searchParamsObj;
        },

        showDisplayViewOptions: function(e){
            var caret_icon = $('.displayViewOptions .caret_icon .fa').hasClass("fa-caret-down");
            if(caret_icon){
                $('.listOfDisplayOptions').css("display","inline");
                $('.displayViewOptions .caret_icon .fa').removeClass("fa-caret-down").addClass("fa-caret-up");
            } else {
                $('.listOfDisplayOptions').css("display","none");
                $('.displayViewOptions .caret_icon .fa').removeClass("fa-caret-up").addClass("fa-caret-down");
            }
        },

        renderThisView: function(viewType){
            var self = this, searchParams = {};

            self.cleanTheViews();
            searchParams = self.getSearchParams();

            if(viewType == "summary"){
                requirejs(["ppaResultsSummaryView"], function(PPAResultsSummaryView) {
                    self.ppaResultsSummaryView = new PPAResultsSummaryView({
                        el: $("#listViewPPAResults"),
                        periodModel: self.resultsPPAPeriodModel,
                        searchParams: searchParams,
                        periodToIndex: $("#periods-selectTo").select2().find(":selected").data("index")
                    });
                    self.resultsPPAView.push(self.ppaResultsSummaryView);
                    self.ppaResultsSummaryView.render();
                });
            } else {
                requirejs(["ppaResultsDisplayView"], function(PPAResultsDisplayView) {
                    self.ppaResultsDisplayView = new PPAResultsDisplayView({
                        el: $("#listViewPPAResults"),
                        periodModel: self.resultsPPAPeriodModel,
                        searchParams: searchParams,
                        unitTypeStr: $("#dropdown-resultsUnitType").select2().find(":selected").text()
                        //periodToIndex: $("#periods-selectTo").select2().find(":selected").data("index")
                    });
                    self.resultsPPAView.push(self.ppaResultsDisplayView);
                    self.ppaResultsDisplayView.render();
                });
            }
        },

        cleanTheViews: function(){
            var self = this;
            _.each(self.resultsPPAView, function(view) {
                view.undelegateEvents();
            });
            $("#ppaPeriods-list").empty();
        },

        displayViewChanged: function(e){  
            var self = this;  
            if($(e.target).val() != "list"){
                $(".type_icon .fa").removeClass("fa-list").addClass("fa-table");
                self.renderThisView("summary");
                $("#createPDF").css("visibility","hidden");
                $(".x-img-button").removeClass("x-button-enabled");
                $(".x-img-button .fa-file-pdf-o").css("color","#CCC");
            } else {
                $(".type_icon .fa").removeClass("fa-table").addClass("fa-list");
                self.renderThisView("list");
                $("#createPDF").css("visibility","visible");
                $(".x-img-button").addClass("x-button-enabled");
                $(".x-img-button .fa-file-pdf-o").css("color","#37708E");
            }
            self.showDisplayViewOptions();
        },

        removeItem: function(e){
            var self = this;

            var $parentElement = $(e.target).parent();

            if($parentElement.siblings().length == 0){
                var $toggleCurrDisplay =  $parentElement.parents('.select2-search-container');
                $parentElement.parents('.select2-search-container ul').empty();
                $toggleCurrDisplay.hide();
                $toggleCurrDisplay.siblings('.basicSearchInput').show().children('input').attr({"search-value":"", "value":""});
            }
            $(e.target).parents('li').remove();
            self.createBreadCrumbs();
        },

        createSelectComponents: function(){
            var self=this;

            self.currencyUnitTypesCollection.fetch({
                success: function(unitTypes) {
                    self.addUnitTypes(unitTypes);
                    self.addResultsType();
                },
                error: function() {
                    self.showXHRErrorMessage(xhr);
                }
            }).then(function() {
                self.fetchPPAPeriods();
            });
        },

        showPopup: function(e) {
            var self = this;
            var $currentElement = this.$(e.target);
            var inputFieldId = $currentElement.attr("data-input-field");
            var viewName = $currentElement.attr("data-view");
            var inputTempElement = $(e.target).parents('.input-append').find('.select2-search-container ul.select-element');

            inputFieldId = this.$("#" + inputFieldId);
            inputFieldId.val("");

            viewName = viewName + "View";

            switch(viewName){
                case "personView":
                            self.view = new PersonView({
                                            el: $("#popupDiv"),
                                            inputElement: inputFieldId,
                                            periodId: self.$("#periods").select2().find(":selected").val()
                                        });
                            break;
                case "earningGrpView":
                            self.view = new EarningGrpView({
                                            el: $("#popupDiv"),
                                            inputElement: inputFieldId,
                                            periodId: self.$("#periods").select2().find(":selected").val()
                                        });
                            break;
                case "businessGrpView":
                            requirejs(["BusinessGroupView"], function(BusinessGroupView) {
                                var view = new BusinessGroupView({
                                    el: $("#modal-container")
                                });
                                view.selectCallback = function (selectBusinessGrps) {
                                    inputTempElement.empty();
                                    _.each(selectBusinessGrps, function(element) {
                                        template = _.template(searchParameterTemplate);
                                    
                                    var roleCriteriaMap;
                                    roleCriteriaMap = {
                                        criteriaId: element.id,
                                        name: element.name,
                                    };
                                    inputTempElement.prepend(template(roleCriteriaMap));
                                    

                                    });
                                    inputTempElement.parents('.select2-search-container').show();
                                    inputTempElement.parents('.select2-search-container').siblings(".basicSearchInput").hide();
                                    
                                    self.createBreadCrumbs();
                                    self.stopListening(self.view);
                                    //self.view.stopListening();
                                    $("#modal-container").empty();
                                    $("#modal-container").modal('hide');
                                };
                                self.listenTo(view, 'cancel', function(e) {
                                    self.stopListening(view);
                                });
                                view.render();
                            });
                            self.view = false;
                            break;

            }


            setTimeout(function() {
                if (self.view) {
                    self.view.render();
                    self.listenToOnce(self.view, "playWithPopUpSelectData", function() {

                        inputTempElement.empty();
                        var selectedElement = self.view.selectedElementCollection.toJSON();

                        _.each(self.view.selectedElementCollection.toJSON(), function(element) {
                            template = _.template(searchParameterTemplate);
                        
                        var roleCriteriaMap;
                        roleCriteriaMap = {
                            criteriaId: element.id,
                            name: element.name,
                        };
                        inputTempElement.prepend(template(roleCriteriaMap));
                        

                        });
                        inputTempElement.parents('.select2-search-container').show();
                        inputTempElement.parents('.select2-search-container').siblings(".basicSearchInput").hide();
                        
                        self.createBreadCrumbs();
                        self.stopListening(self.view);
                        self.view.stopListening();
                    });
                }  
            }, 100);
            
        },

        render: function() {
            var label, self = this;
            
            self.currencyUnitTypesCollection = new CurrencyUnitTypesCollection();
            i18n.setDefaultNamespace('icmadvanced.default');
            i18n.setCurrentNamespace(self.namespace);

            i18n.load(self.namespace, "../../../icmadvanced/api/messages").then(function() {
                
                self.$el.html(resultsTemplate);
                self.createSelectComponents();
                $("#createPDF").css("visibility","hidden");
                $(".x-img-button").removeClass("x-button-enabled");
                $(".x-img-button .fa-file-pdf-o").css("color","#CCC");
                //self.fetchPPAPeriods();

                $("#resultsPPA-view").xlate({
                    namespace: self.namespace
                });

            });

        },

        onLoadCollection: function() {
            var self = this;
            this.tableView.renderResultCount();
            if (this.tableView) {
                this.tableView.renderRows();
                if (this.tableView.paginationView) {
                    this.tableView.paginationView.render();
                }
            }

        }

    });

    return PPAView;

});
