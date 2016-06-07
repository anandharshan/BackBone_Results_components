define(["jquery",
    "config",
    "underscore",
    "mischelpers",
    "xedge",
    "q",
    "text!home/advSearch/html/advSearch.html",
    "filterModel",
    "filterCollection",
    "filterView",
    "LastRefresh",
    "LastRefView",
    "i18n",
    "i18nLoader",
    "pageUtils",
    "i18nJQuery",
    "jqueryPlugins",
    "Download",
    "BreadCrumView",
    "TertiaryMenuView",
    'PeriodDropdownView'
    ],
function($, config,  _, mischelpers, xedge, Q, templates, Filter, FilterCollection, 
    FilterView, LastRefresh, LastRefreshView, i18n, i18nLoader, pageUtils, 
    i18nJQuery, plugins, Download, BreadCrumView, TertiaryMenuView,
    PeriodDropdownView) {

    /*
     * Backbone view to facilitate data loading and UI interaction from
     *
     *
     *
     */
    var AdvanceSearchView = Backbone.View.extend({
        sort: null, // asc ro desc
        sortIndex: -1, // column that is sorted
        filterViews: {}, // views that generate/control filter UI
        requestTimerInterval: null, // hold ref to request timer
        pagePrefix: 'Advance Search:Templates',
        hiddenColumns : ['ATTAINMENT_VALUE_UNIT_TYPE_ID', 'PERIOD_IS_HIDDEN', 'ORDER_CODE_UPPER', 'ITEM_CODE_UPPER'],

        events: {
            "click #reset"                                  : "resetData",
            "click #favoriteSearch_box"                     : "toggleFavoriteList",
             "click .expander"                              : "toggleSidebar",
            "click #export_csv_btn"                         : "downloadPopup",
            "click .dclose"                                 : "closeDownload",
            "click .mclose"                                 : "closeDownloadMsg",
            "click #confirm-button"                         : "closeDownloadMsg",
            "click #downloadBtn"                            : "downloadInitiate",
            "mousewheel #scroll_block"                      : "handleScrollMouseWheel",
            "click .scrollbar_holder"                       : "handleScollbarClick",
            "click .sort_field_container"                   : "sortResults",
            "click .first"                                  : "first",
            "click .previous"                               : "previous",
            "click .next"                                   : "next",
            "click .last"                                   : "last",
            "dblclick .col"                                 : "filterViaCell",
            "click .searchOptions-button"                   : "showSearchOptions",
            //"mouseover #arrowBoxContainer"                  : 'showSearchOptions',
            'keyup .modal'                                  : "handleKeyEvents"
        },
        /*
         * Initialize view. Set notification if needed.
         */
        initialize: function() {
            this.$el.empty();
            this.$el.append(templates); // append template to body
            this.filterTemplate = _.template($('#filter').html())
            this.pageName = "Advance Search - SOLR";
            
            this.periodDropdownView = new PeriodDropdownView({
                el : ('#periodFilter'),
                showPeriod : false
            });
            this.listenTo(this.periodDropdownView, "change", this.processPeriodFilterEvent);
            this.listenTo(this.periodDropdownView, "sync", this.setPeriodCollection);
            window.showDataRefreshed = true; // supress data refreshed message if request in pipeline in xedge
            $(window).on("resize", setupScrollbar);
        },
        processPeriodFilterEvent : function(selectedObject, isAsOfPeriod){
            if(typeof selectedObject === 'object'){
                this.asOfPeriodId = selectedObject.get('id')
            }else if(selectedObject === 'latest'){
                this.asOfPeriodId = '';
            }
            xedge.setAsOfPeriod(this.asOfPeriodId);
            this.loadData({loadEdgemart : false, executeCountQuery : true, fromFilter:true});
        },

        setPeriodCollection : function(){
            xedge.setPeriodCollection(this.periodDropdownView.periodsCollection);
        },

        showSearchOptions: function() {
            this.undelegateEvents();
            xedge.resetPagination();
            xedge.clearAllFilter();
            config.router.navigate("settingpage", {trigger: true});
        },

        toggleSidebar: function(e) {
            var $currentElement = this.$(e.target);
            var $sideBarContentElement = $currentElement.siblings(".sidebar-content");
            var $scrollBlockElement = $("#scroll_block");
            var $scrollBarHolderElement = $(".scrollbar_holder");

            if (!$currentElement.hasClass("expand")) {
                var newScollBlockWidth = $("#scroll_block").width() + 230;

                $sideBarContentElement.animate({
                    width: "0px",
                    duration: 500,
                    queue: false
                }, function() {
                    $sideBarContentElement.hide();
                    $currentElement.toggleClass("expand");
                    setupScrollbar();
                });
                // // Animate the scroll bar
                if ($scrollBlockElement) {
                    $scrollBlockElement.animate({
                        width: newScollBlockWidth,
                        duration: 500,
                        queue: false
                    });
                    $scrollBarHolderElement.animate({
                        width: newScollBlockWidth,
                        duration: 500,
                        queue: false
                    });
                }

            } else {
                var newScollBlockWidth = $("#scroll_block").width() - 230;
                $sideBarContentElement.show().animate({
                    width: "230px",
                    duration: 500,
                    queue: false
                }, function() {
                    $currentElement.toggleClass("expand");
                    setupScrollbar();
                });
                if ($scrollBlockElement) {
                    $scrollBlockElement.animate({
                        width: newScollBlockWidth,
                        duration: 500,
                        queue: false
                    });
                    $scrollBarHolderElement.animate({
                        width: newScollBlockWidth,
                        duration: 500,
                        queue: false
                    });
                }
            }
        },

        /*
         * append template, set labels
         *
         */
        render: function() {
            var self = this;
            $(this.$el).xlate({
                namespace: 'icmadvanced.advsearch'
            }, $("body")); // translate labels

            // load and process config.json and then call configLoaded
            var response = Q(this).then(this.showSpinner).then(function() {
                return $.ajax({
                    url: config.appContext + '/api/advsearch/config',
                    timeout: window.gloablAjaxTimeout,
                    dataType: 'json'
                })
            }, this.errorCB).then(function(data) {
                data = self.removeUnwantedColumns(data);
                xedge.configJson = {};
                xedge.configJson = data;
                xedge.processAndLoadConfigJSON(data);
                Q(self).post("configLoaded", []);
            }, this.errorCB).done();
            $(this.$el).xlate({
                namespace: 'icmadvanced.advsearch'
            }, $("body")); // translate labels
        },
        removeUnwantedColumns : function(data){
            var self = this,
                cols;
            _.each(data.app.objects, function(object){
                object.columns = _.without(object.columns, self.hiddenColumns);
            });
            return data;
        },

        /*
         * Once config.json is loaded render the page according to rules defined within it.
         *
         */
        configLoaded: function(dummyVar) {
            this.renderTabs();
            this.renderFilters();
            this.disableFilters(xedge.objectType);
            this.loadData({
                loadEdgemart: true,
                executeCountQuery: true
            });
            this.refreshview = new LastRefreshView({
                el: "#data-refresh",
                template: $('#LastRefreshTemplate').html(),
                timezone: xedge.timeZone
            });
            this.refreshview.getAgeofData(); //model.fetch();
            this.track("Tab Click " + xedge.objectType, {});
        },

        track : function(event){
            pageUtils.track(this.pagePrefix+ '-' + this.pageName +": "+ event);
        },

        /*
         * render tabs based on objects defined in config.json
         *
         */
        renderTabs: function() {
            var tabs = [],
                names = [];
            var object_order = xedge.configJson.app.object_order;
            for (var i = 0; i < object_order.length; i++) {
                if (!xedge.configJson.app.objects[object_order[i]].visible) return;
                //names.push(object_order[i]);
                //tabs.push((i18n.get('icmadvanced.advsearch', object_order[i])) ? i18n.get('icmadvanced.advsearch', object_order[i]) : object_order[i]);
                tabs.push({
                    id: object_order[i],
                    className : '',
                    label: i18n.get('icmadvanced.advsearch', object_order[i]) || object_order[i],
                });
            }
            // var output = _.template($("#tabs").html(), {
            //     otype: names,
            //     tabs: tabs,
            //     current: xedge.getObjectType()
            // }, {
            //     variable: 'data'
            // });


            tabs[0].className = 'activeLink';

            // call view...may be extended to handle custom events
            this.tertiaryMenuView = new TertiaryMenuView({
                el : ('#viz_valuestable_tabs'),
                menuItems: tabs
            });
            this.listenTo(this.tertiaryMenuView, "click", this.loadObject);
            return this;
        },

        /*
         * render filters based on rules defined in config.json
         * Then construct view for each filter UI to handle interaction.
         */
        renderFilters: function() {
            var _filters = xedge.configJson.app.filter_order,
                displayName;
            // see if filter_order is defined
            if (!_filters) {
                _filters = [];
                // filter_order is not in config -> get all filters from objects
                for (obj in xedge.configJson.app.objects) {
                    _filters.push(xedge.configJson.app.objects[obj].filters);
                }
                _filters = _.uniq(_.flatten(_filters)); // underscore fxn to flatten all array and get uniques
            } // end else

            $.each(_filters, function(index, value) {
                // populate model properties
                displayName = (i18n.get('icmadvanced.advsearch', value)) ? i18n.get('icmadvanced.advsearch', value) : value;
                _filters[index] = new Filter({
                    name: value, // internal name of filter
                    display: displayName, // UI/display name of the filter
                    filterValues: [], // array to hold selected filter by internal name
                    displayValues: [], // array to hold selected filter by display name
                    disabled: true
                });
            });
            $("#filterControls").html(''); // remvoe existing filters.
            this.filterCollection = new FilterCollection(_filters, {
                compartor: false
            }); // add to collection
            this.filterCollection.each(this.renderFilter, this);

        },

        /*
         * render each filter on DOM and keep refrence in filterViews object for communication with it.
         *
         */
        renderFilter: function(filter) {
          var view = new FilterView({
            model: filter,
            template: this.filterTemplate ,
            parent: this
          });
          this.$("#filterControls").append(view.render().el);
          this.filterViews[filter.get('name')] = view;
        },

        /*
         * while we show all filters, some filters may not be applicable for selected tab.
         * In this case we want to disable interaction with it.
         *
         */
        disableFilters: function(selectedTab) {
            var validFilters = xedge.configJson.app.objects[selectedTab].filters; // get all filters
            $.each(this.filterViews, function(key, view) { // loop filterViews and toggle that view if not supported by object
                view.toggleFilter($.inArray(key, validFilters));
            });
        },

        /*
         * Load data for selected
         *
         */
        loadData: function(opts, isLast, isFirst) {
            var self = this,
                maxRows = 100; // max rows to display in table
            if ($.browser.msie && $.browser.version == 8) maxRows = 50; // reduce for IE8 dues to performance of fixing header and col on table
            xedge.setMaxRows(maxRows);
            var query = xedge.resultQuery(); // get query
            if (isLast) {
                var setrows = xedge.totalRows % xedge.maxRows;
                if ((totalRows - xedge.offset) == xedge.maxRows) {
                    setrows = xedge.maxRows;
                }
                query = JSON.parse(query);
                if (xedge.firstClicked == true) {
                    var new_sort = query.sortOrder.sortType;
                    if (xedge.sort == "asc") {
                        new_sort = 'desc';
                        xedge.setSort('desc');
                    } else {
                        new_sort = 'asc';
                        xedge.setSort('asc');
                    }
                    query.sortOrder.sortType = new_sort;
                    xedge.firstClicked = false;

                }
                xedge.lastClicked = true;
                query.row = setrows;
                query.cursorMark = "*";
                query.last = true;
                query = JSON.stringify(query);
            }
            if (isFirst) {
                query = JSON.parse(query);
                if (xedge.lastClicked == true) {
                    var new_sort_first = query.sortOrder.sortType;
                    if (xedge.sort == "asc") {
                        new_sort_first = 'desc';
                        xedge.setSort('desc');
                    } else {
                        new_sort_first = 'asc';
                        xedge.setSort('asc');
                    }
                    query.sortOrder.sortType = new_sort_first;
                    xedge.lastClicked = false;
                }
                xedge.firstClicked = true;
                query.cursorMark = "*";
                query.last = false;
                query = JSON.stringify(query);
            }
            if(xedge.lastClicked==true){
                query = JSON.parse(query);
                query.last = true;
                query = JSON.stringify(query);
            }
            if (opts.fromFilter && opts.fromFilter == true) {
                query = JSON.parse(query);
                query.cursorMark = "*";
                query = JSON.stringify(query);
            }
            var scopedErrFxn = function(error) {
                self.errorCB(error);
            };

            var _renderTable = function(data){
                self.renderBreadCrumView();
                self.renderTable(data);
            };

            var options = {
                successCB: _renderTable, // callback to pass results
                errorCB: scopedErrFxn, // error callback
                loadEdgemart: opts.loadEdgemart,
                executeCountQuery: opts.executeCountQuery,
                combineCurrency: true
            };
            this.showSpinner(); // show spinner

            var results = Q(this).then(xedge.pipeline(query, options)).done(); // execute pipeline
        },

        /**
         *
         */
        renderBreadCrumView : function(){
            var self = this,
                objectFilters = xedge.configJson.app.objects[xedge.objectType].filters;
            this.searchfield = [];
            this.searchtext = [];
            _.each(xedge.filters, function(arr, key){
                if(objectFilters.indexOf(key) === -1){
                    return; // this filter is not part of this object
                }
                _.each(arr, function(value, index){
                    self.searchfield.push(key);
                    if(key === 'PERIOD_ORDER_NUMBER'){
                        self.searchtext.push( xedge.periodMap[value] );
                    }else{
                        self.searchtext.push(value);
                    }
                });
            });
            if(this.breadCrumView){
                this.breadCrumView.undelegateEvents();
            }
            $('.search-breadcrumb').empty();
            this.breadCrumView = new BreadCrumView({
                searchfield : this.searchfield,
                searchtext  : this.searchtext,
                el :$('.search-breadcrumb'),
                namespace : 'icmadvanced.advsearch'
            });
            this.listenTo(this.breadCrumView, "removecrum", this.removeCrum);
            // return this.breadCrumView;
        },

        /**
         *
         */
        removeCrum : function(filterName, filterValue){
            //console.log('remove ', filterName, this.filterViews, this.filterViews[filterName]);
            this.filterViews[filterName].clearFilter();
        },


        /*
         * This method renders table of results
         *
         */
        renderTable: function(data) {
            var now = new Date().getTime();
            var filters = xedge.configJson.app.objects[xedge.getObjectType()].filters;
            
            // if no records are found...show i18n message
            xedge.data = data;
             $("#results-total").html("("+xedge.format(data.record_count)+")");
            if (data.results.records.length == 0) {
                $("#result_content").html("<span class='mrtop10 mrLeft10'>" + i18n.get('icmadvanced.advsearch', 'zeroRecords') + "</span>");
                $("#viz_valuestable_pager").html('');
                $("#viz_valuestable_pager_1").html('');
                $(".pagespinner").addClass('hide');
                return;
            }
            if (data.cursorMark) {
                xedge.newCursorMark = data.cursorMark;
                xedge.setCursorMarkByPageId();
            }
            xedge.setTotalRows(data.record_count);
            // get columns for this tab/object type
            var cols = xedge.configJson.app.objects[xedge.getObjectType()].columns;
            this.sortIndex = xedge.getSortIndex();
            var colSorted = this.sortIndex - 1;
            // determine which column is sorted...PERIOD_ORDER_NUMBER is default sort
            if (this.sortIndex < 0) {
                colSorted = $.inArray("PERIOD_ORDER_NUMBER", cols); // find sort order of period number
                this.sortIndex = 1;
            }
            // get all properties key
            var keys = $.map(data.newrecords[0], function(value, key) {
                return key;
            });
            var displays = [],
                newcols = [];
            // generate col heading and internal names so we can use is in sorting later
            for (var c = 0; c < cols.length; c++) {
                if (cols[c].indexOf("_UPPER") == -1 && cols[c].indexOf("PERIOD_IS_HIDDEN") == -1) {
                    displays.push((i18n.get('icmadvanced.advsearch', cols[c])) ? i18n.get('icmadvanced.advsearch', cols[c]) : cols[c]);
                    newcols.push(cols[c]);
                }
            }
            // get header
            header = _.template($("#ths").html(), {
                ths: displays,
                sorted: colSorted,
                mapping: newcols,
                orderBy: xedge.orderBy
            }, {
                variable: 'data'
            });
            var preTempalte = new Date().getTime();
            // Geneate table
            var output = _.template($("#table").html(), {
                ths: header,
                trs: data.newrecords,
                cols: newcols,
                sorted: colSorted,
                currMap: xedge.configJson.data_types,
                start: xedge.offset,
                orderBy: xedge.orderBy,
                filters: filters
            }, {
                variable: 'data'
            });

            var posttempalte = new Date().getTime();
           

            $("#result_content").html(output); // add table to dom
            setupScrollbar();
            var afterrender = new Date().getTime();
            var afterFixHeader = new Date().getTime();

            // start pagination calc
            var limit = ((xedge.offset + xedge.maxRows) > totalRows) ? totalRows : xedge.offset + xedge.maxRows;
            var first = 'disabled';
            var previous = 'disabled';
            var next = '';
            var last = '';
            if (xedge.offset > 0) {
                first = '';
                previous = '';
            }
            if (limit >= totalRows) {
                next = 'disabled';
                last = 'disabled';
            }
            // render pagination
            var pages = _.template($("#pagination").html(), {
                totalRows: xedge.format(totalRows),
                start: xedge.format(xedge.offset + 1),
                limit: xedge.format(limit),
                first: first,
                previous: previous,
                next: next,
                last: last
            }, {
                variable: 'data'
            });
            $("#viz_valuestable_pager").html(pages); // add pagination to table
            $("#viz_valuestable_pager_1").html(pages); // add pagination to table
            $(".pagespinner").addClass('hide'); // since context is lost, hide spinner via jquery
            var lastTime = new Date().getTime();
            window.logAction("total time = " + (lastTime - now) + " --- fixHeader time = " + (afterFixHeader - afterrender), "DEBUG");
            $("#dashboard").xlate({
                namespace: 'icmadvanced.advsearch'
            }, $("body")); //update lables

           // $(".innerbox").height($(".innerbox").height() + 5);
            self.checkAttempt = 0;
            // Chrome header issue hack
            // add arrow to indicate sort on sorted column
            var fht_cell = $('.isSorted');
            if (!xedge.fromPagination) {
                xedge.lastFromPagination = false;
                if (xedge.sort === 'asc') {
                    fht_cell.addClass("sorterAscImage");
                    fht_cell.removeClass("fa fa-sort");
                    //sorterAscImage
                } else {
                    fht_cell.addClass("sorterDescImage");
                    fht_cell.removeClass("fa fa-sort");
                    //sorterDescImage
                }
            } else {
                xedge.lastFromPagination = true;
                if (xedge.lastSortState === 'asc') {
                    fht_cell.addClass("sorterAscImage");
                    fht_cell.removeClass("fa fa-sort");
                } else {
                    fht_cell.addClass("sorterDescImage");
                    fht_cell.removeClass("fa fa-sort");
                }
            }
            // Temporary hack for populating the PERIOD_ORDER_NUMBER
            if(xedge.firstLoad){
                $( "#Period_btn" ).trigger( "click", [ "first"]);
                xedge.firstLoad = false;
            }
        },
        
        /* end function drag */
        handleScrollMouseWheel: function(event, delta) {
            var getmoduloWidth = window.scrollBlockWidth - window.scrollbarWidth;
            var formulateWidth = (getmoduloWidth / window.scrollBlockWidth) * (window.contentWidth);

            var getPositionLeft = parseInt($('div.scrollbar').css('left')); // get css left
            var scrollLeftNew = getPositionLeft - (delta * 10); // with delta
            var scrollLeftContent = (scrollLeftNew / window.scrollBlockWidth) * (window.contentWidth);

            if (scrollLeftNew < 0) { // if rich the left content, return false, and set default
                $("div.scrollbar").css("left", "0px");
                $("div#scroll_content").css("left", "0px");
                return false;
            }
            if (scrollLeftContent > formulateWidth) { // if rich the right content, return false, and set default
                $("div.scrollbar").css("left", getmoduloWidth);
                $("div#scroll_content").css("left", '-' + formulateWidth + 'px');
                return false;
            }

            this.$("div#scroll_content").css("left", '-' + scrollLeftContent + 'px'); // left the content
            this.$("div.scrollbar").css("left", scrollLeftNew); // left the scroll bar
        },

        /* click scrollbar holder, scroll start */
        handleScollbarClick: function(e) {
            var getmoduloWidth = window.scrollBlockWidth - window.scrollbarWidth;
            var formulateWidth = (getmoduloWidth / window.scrollBlockWidth) * (window.contentWidth);
            var getPositionLeft = parseInt(this.$("div.scrollbar").css('left')); // get css left
            var pageX = e.pageX - this.$(".scrollbar_holder").offset().left;
            var leftWithScroll = getPositionLeft + window.scrollbarWidth;
            var positionLeft = pageX - window.scrollbarWidth; // pagey - scrollbar Width =  to get the get width scrollleft
            var pillsLeftValue = 0;

            var pageX_adjust = (pageX - 20); // adjust
            if (pageX_adjust < getPositionLeft) { // click up the scroll bar
                this.$("div.scrollbar").stop(true, false).animate({
                    "left": pageX - 40
                }, 'fast');
                pillsLeftValue = pageX - 40;
                var getPositionLeft_click = pageX - 40;

                if (getPositionLeft_click < 0) { // if user click the top level of the scroll, set to animate to left

                    this.$("div.scrollbar").stop(true, false).animate({
                        "left": 0
                    }, 'fast');
                    this.$("div#scroll_content").stop(true, false).animate({
                        "left": 0
                    }, 'fast');
                    pillsLeftValue = 0;

                } else {
                    var scrollLeftNew = (getPositionLeft_click / window.scrollBlockWidth) * (window.contentWidth);
                    this.$("div#scroll_content").stop(true, false).animate({
                        "left": '-' + scrollLeftNew + 'px'
                    }, 'fast');
                    pillsLeftValue = scrollLeftNew;
                }
            } else { // click down the scroll bar
                if (pageX > leftWithScroll) {
                    this.$("div.scrollbar").stop(true, false).animate({
                        "left": positionLeft
                    }, 'fast');
                    pillsLeftValue = positionLeft;
                    var getPositionLeft_click = positionLeft;

                    if (pageX > window.scrollBlockWidth) { // if user click the bottom level of the scroll, set to animate to right
                        this.$("div.scrollbar").stop(true, false).animate({
                            "left": getmoduloWidth
                        }, 'fast'); // getmoduloHeight from scrollbar var
                        this.$("div#scroll_content").stop(true, false).animate({
                            "left": '-' + formulateWidth + 'px'
                        }, 'fast'); // formulateWidth from scrollbar var
                        pillsLeftValue = getmoduloWidth;
                    } else {
                        var scrollLeftNew = (getPositionLeft_click / window.scrollBlockWidth) * (window
                            .contentWidth);
                        this.$("div#scroll_content").stop(true, false).animate({
                            "left": '-' + scrollLeftNew + 'px'
                        }, 'fast');
                        pillsLeftValue = scrollLeftNew;
                    }
                }
            }

            var pillsButtonsLeftValue = (window.scrollBlockWidth - 215) + pillsLeftValue;
            if (config.currentOrderTabSelection === "processed") {
                pillsButtonsLeftValue += 140;
            }

            $(".pill-button-grp").css({
                left: pillsButtonsLeftValue
            });

            e.preventDefault(); // like return false
        },

        /*
         * callback incase of any error executing pipeline.
         *
         */
        errorCB: function(error) {
            if (!error || !error.statusText) {
                throw new Error("Error received but it was empty ", error);
                return;
            }
            var self = this, 
                message;
            if (error.statusText == 'timeout') {
                message = i18n.get('icmadvanced.advsearch', 'serverTimeout');
            } else if (error.status == 401 && error.readyState == 4) {
                alert("The current session has expired. Please log in again.");
                 var parentContainer = pageUtils.xRootContainer();
                if(parentContainer){
                    parentContainer.logOff();
                }
                // responseJson = $.parseJSON(error.responseText);
                // window.top.location.href = responseJson.redirectURL;
            } else if (error.status == 500 && error.readyState == 4) {
                message = i18n.get('icmadvanced.advsearch', 'serverTimeout');
            } else {
                if (xedge.totalRows && xedge.totalRows === 0) {
                    message = i18n.get('icmadvanced.advsearch', 'zeroRecords');
                }else{
                    message = i18n.get('icmadvanced.advsearch', 'serverError');
                }
            }
            $("#result_content").html("<span class='mrtop10 mrLeft10'>" + message + "</span>");
            $(".pagespinner").addClass('hide');
        },

        /*
         * Filter result based on double click on table cell.
         * Not all column can be applied as filter.
         */
        filterViaCell: function(e) {
            var target = $(e.target),
                index = target.data('index');

            if (index < 0) return; // return if first col (used for numbering) is dbl clicked

            var filterValue = $.trim(target.text()); // get the filter value
            var column = xedge.configJson.app.objects[xedge.getObjectType()].columns[index]; //$('th').eq(index).data('col'); // get column
            var filters = xedge.configJson.app.objects[xedge.getObjectType()].filters; // see if col is present in filter

            if (filters.indexOf(column) === -1) return; // cell item is not a valid filter column

            var displayValue = filterValue;
            if (column == 'PERIOD_ORDER_NUMBER') { // got period which is mapped differently
                filterValue = xedge.reverseMap[filterValue];
            }

            // is this column and column value already in filter?
            if(xedge.filters[column] && xedge.filters[column].indexOf(filterValue) > -1 ){
                return;
            }

            this.filterViews[column].addToModel(filterValue, displayValue); // update corresponding filter view
            xedge.setFilter(column, filterValue); // update xedge to stay consistent

            this.showSpinner();
            this.loadData({
                loadEdgemart: false,
                executeCountQuery: true,
                fromFilter: true
            });
            this.track("Filter via Cell");
        },

        /*
         * Interaction with first page link in pagination
         */
        first: function(e, fromSort) {
            xedge.fromPagination = true;
            e.preventDefault();
                if (xedge.offset !== 0 && xedge.oldSelectedCol !== xedge.selectedCol) {
                    this.sort = 'desc';
                }
                if (xedge.offset == 0 && xedge.oldSelectedCol !== xedge.selectedCol) {
                    this.sort = 'desc';
                }
                xedge.oldSelectedCol = xedge.selectedCol;
                xedge.setOffset(0);
                xedge.resetPagination();
                xedge.lastPagination = false;
                xedge.currPage = 0;
                xedge.firstClicked = true;
                if (xedge.lastClicked == true) {
                    if (!xedge.lastFromPagination) {
                        xedge.lastSortState = xedge.sort;
                    }
                }
                if (!fromSort) {
                    this.loadSameData(false, true);
                }else{
                    xedge.lastClicked = false;

                }
            this.track("First Page");
        },

        /*
         * Interaction with prev page link in pagination
         */
        previous: function(e) {
            xedge.fromPagination = true;

            if (xedge.offset > 0) {
                xedge.previous = true;
                xedge.next = false;
                xedge.currPage--;
                var new_offset = xedge.offset - xedge.maxRows;
                xedge.setOffset(new_offset);

                var isFirst = false;
                if (new_offset == 0) {
                    this.first(e);
                    return;
                }
                if (xedge.lastClicked == true) {
                     xedge.lastPagination = true;
                }
                this.loadSameData(null, isFirst);
            }
            this.track("Previous Page");
        },

        /*
         * Interaction with next page link in pagination
         */
        next: function(e) {
            e.preventDefault();
            xedge.fromPagination = true;
            if ((totalRows - xedge.offset) > xedge.maxRows) {
                xedge.next = true;
                xedge.currPage++;
                xedge.previous = false;
                var new_offset = xedge.offset + xedge.maxRows;
                var isLastPage = false;
                if ((totalRows - new_offset) <= xedge.maxRows) {
                   this.last(e);
                   return;
                }
                xedge.setOffset(new_offset);
                this.track("Next Page", {});
                if (!xedge.lastFromPagination) {
                    xedge.lastSortState = xedge.sort;
                }
                this.loadSameData(isLastPage);
            }
        },

        /*
         * Interaction with last page link in pagination
         */
        last: function(e) {
            xedge.fromPagination = true;
            e.preventDefault();
            if ((totalRows - xedge.offset) > xedge.maxRows) {
                var new_offset = parseInt(totalRows / xedge.maxRows) * xedge.maxRows;
                if (totalRows % xedge.maxRows == 0) {
                    new_offset = totalRows - xedge.maxRows;
                }
                xedge.setOffset(new_offset);
                xedge.resetPagination();
                xedge.lastPagination = true;
                xedge.currPage = 0;
                xedge.lastClicked = true;
                if (xedge.firstClicked == true) {
                    if (!xedge.lastFromPagination) {
                        xedge.lastSortState = xedge.sort;
                    }
                }
                this.loadSameData(true);
            }
            this.track("Last Page");
        },

        /*
         * Click on header will sort the results
         */
        sortResults: function(e) {
            var target = $(e.target);
            if (!$(target).hasClass("sort_field_container")) target = target.parent();
            var index = target.index();
            xedge.selectedCol = target.data('col');
            var sortEmpty = false;
            for (var d = 0; d < xedge.data.results.records.length; d++) {
                if (xedge.selectedCol in xedge.data.results.records[d]) {
                    sortEmpty = true;
                }
            }
            if (!sortEmpty) {
                return;
            }
            this.first(e, true);
            xedge.resetPagination();
            this.sortIndex = index;

            if (this.sort === null || this.sort === 'desc' || this.sortIndex === -1) this.sort = 'asc';
            else this.sort = 'desc';

            xedge.setSortIndex(this.sortIndex).setSort(this.sort).setOrderBy(xedge.selectedCol);
            var isLastPage = false;
            if (totalRows % xedge.offset !== 0 && !isNaN(totalRows % xedge.offset)) {
                isLastPage = true;
                xedge.lastClicked = true;
                xedge.firstClicked = false;
            }
            xedge.fromPagination = false;
            this.loadSameData(isLastPage)
            this.track("Sort Used");
        },

        /*
         * Generic function to call pipeline which does not requre load and count query
         */
        loadSameData: function(isLast, isFirst) {
            this.showSpinner();
            this.loadData({
                loadEdgemart: false,
                executeCountQuery: false
            }, isLast, isFirst);
        },

        /*
         * when a tab is selected this is executed after reseting sort, offset and ordering.
         */
        loadObject: function(tabMenuItem) {
            xedge.resetPagination();
            this.loadTab(tabMenuItem.id);
        },

        loadTab: function(_tab) {
            this.showSpinner();
            this.disableFilters(_tab);
            xedge.setObjectType(_tab);
            this.sortIndex = -1;
            this.sort = null;
            xedge.setOffset(0).setSortIndex(this.sortIndex).setSort('desc').setOrderBy('PERIOD_ORDER_NUMBER');
            this.loadData({
                loadEdgemart: true,
                executeCountQuery: true
            });
            this.track("Tab Click " + xedge.objectType);
        },

        /*
         * When a reset button is click, we load inital data w/o any filtering, sorting
         *
         */
        resetData: function(e) {
            xedge.resetPagination();
            this.track("Reset Button Clicked");
            $.each(this.filterViews, function(key, view) {
                view.clearFilterFromModel();
            });
            xedge.reset();
            this.sortIndex = -1;
            this.sort = null;
            xedge.setSortIndex(this.sortIndex).setSort('asc').setOrderBy('PERIOD_ORDER_NUMBER');
            this.loadData({
                loadEdgemart: false,
                executeCountQuery: true
            });
        },

        /*
         * Show download dialog
         */
        downloadPopup: function(e) {
            this.track("Download");
            $('#download-dialog').slideDown();
            return $("#transparentbkg").show().addClass("modal-backdrop fade in");
        },

        /*
         * Close download dialog
         */
        closeDownload: function(e) {
            return closeDownload();
        },

        closeDownloadMsg : function (){
            $('#download-modal-container').slideUp();
            $("#transparentbkg").hide();
        },

        /*
         * Initiate download. Download is done via different JS file.
         */
        downloadInitiate: function(e) {
            var fname;
            $("#progressMsg").html("").hide();
            fname = $("#filename").val();
            var validFileName = fname.match(/^([a-zA-Z0-9 _-]+)$/g);
            fname = $.trim(fname); // trim white space
            if (fname !== '' && validFileName !== null) {
                this.track("Download Requested");
                Download.initDownload({
                    asOfPeriodId : this.asOfPeriodId
                });
            } else if (fname === "") {
                return $("#progressMsg").html(i18n.get('icmadvanced.advsearch', 'enterFileName')).css('color', 'red').show();
            } else {
                return $("#progressMsg").html(i18n.get('icmadvanced.advsearch', 'invalidCharInDownload')).css('color', 'red').show();
            }
        },

        /*
         * handle key events for download
         */
        handleKeyEvents: function(e) {
            var target = $(e.target),
                elId = target.attr('id'),
                keyCode = e.keyCode;
            if (elId === 'downloadBtn' && keyCode == 13) { //enter
                this.downloadInitiate(e);
            } else if ((elId === 'cancelBtnLabel' && keyCode == 13) || keyCode == 27) {
                this.closeDownload(e);
            }else if (keyCode == 27) {
                this.closeDownloadMsg(e);
            }
            return this;
        },

        /*
         * Show spinner
         */
        showSpinner: function(toggle) {
            $(".pagespinner").removeClass('hide');
        },

        /*
         * Hide spinner
         */
        hideSpinner: function() {
            $(".pagespinner").addClass('hide');
        },

        adjustDataTable : function(){
            var listWidth = $('.list-pane').width();
            var height = $('.sidebar').width();
            height = (height > 600) ? height : 600;
            console.log(listWidth, height, $('#scroll_block').html(), '==')
            $('#scroll_block').width( listWidth );
        }

    });

    var setupScrollbar = function() {
        var self = this;
        if(!window.sideBarHeight){
            window.sideBarHeight = $(".sidebar").height();
        }
        var cols = xedge.configJson.app.objects[xedge.getObjectType()].columns;
        window.contentWidth = cols.length * 216; //this.$(".list-pane").width();
        //contentWidth += 150;
        $("#result_content").width(contentWidth); //.height(window.sideBarHeight);
        
        window.scrollBlockWidth = $(window).width() - $(".sidebar").width() - 180 // get width.
        $("#scroll_block").width(scrollBlockWidth); // set width for scroll block
        $(".scrollbar_holder").width(scrollBlockWidth - 2); // set width for scroll holder

        // formula custom scroll bar 
        window.scrollbarWidth = (scrollBlockWidth / contentWidth) * scrollBlockWidth;
        if (contentWidth < scrollBlockWidth) { // if the content is short, hide the scrollbar
            $("div.scrollbar").css('display', 'none');
            $("div.scrollbar_holder").css('display', 'none');
        } else {
            $("div.scrollbar").width(scrollbarWidth)
        }

        $(".scrollbar").draggable({
            axis: 'x',
            containment: 'parent',
            drag: function() {
                var getPositionLeft = parseInt($(this).css('left')); // get css left
                $("div.scrollbar").css("left", getPositionLeft);
                // formula for content left
                var scrollLeftNew = ((getPositionLeft / scrollBlockWidth) *  contentWidth);
                $("div#scroll_content").css("left", '-' + scrollLeftNew + 'px'); // left the content
            },
            stop: function() {
                
            }
        });
    };

    return AdvanceSearchView;
});
