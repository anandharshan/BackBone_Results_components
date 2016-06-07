define([
	"jquery",
	"q",
	"underscore",
	"backbone",
	"xedge",
	"filterModel",
	"filterCollection",
	"i18n",
	"i18nLoader",
	"i18nJQuery",
], function($, Q, _, Backbone, xedge, Filter, FilterCollection, i18n, i18nLoader, i18xlate){
	/*
	 * View to handle interaction with filters. Filters are user selected values from edgemart/edgeserver that are used
	 * to drill down on result. Filter can be enabled or disabled based on type of data (bonus, commission, etc).
	 * This view show filter items on UI, provides logic on how to show data and take selected data to update the search result table.
	 */
	return Backbone.View.extend({

		tagName : 'div',
		className : 'control clearfix',
		events: {
			"click .del" 					: "clearFilter",
			"click .select-popup-icon" 		: "showSelectorPopup",
			"click .value"					: "showFilterList",
			"click .itemSelectClose "		: "updateDataByDeleteButton",
			"click .hideSelectBox"			: "clearSearchField",
			"click .loadMoreBtn"			: "loadMore",
			"click .selectors a"			: "toggleItem",
			"click .selections .select"		: "toggleAll",
			"click .button"					: "updateDataByButton",
			"keydown .searchInputTextBox"	: "typingStarted",
			"keyup .searchInputTextBox"		: "typingFinished",
			"click .selnum"					: "toggleSelected"
		},

		initialize: function(options) {
			this.template = options.template;
			this.parent = options.parent;
			this.model = options.model;
			this.colname = this.model.get('name');
			this.listenTo(this.model, "change", this.render);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON(), {variable: 'data'}));//;
			if(this.model.get("disabled")){
				this.$el.addClass('disabled');
			}else{
				this.$el.removeClass('disabled');
			}
			// show hide red x on hover
			if(this.model.get('filterValues').length > 0 && !this.$el.hasClass('controlfiltered')){
				this.$el.addClass('controlfiltered');
			}else if(this.model.get('filterValues').length == 0) {
				this.$el.removeClass('controlfiltered');
			}
			return this;
		},

		/*
		 * We put a delay is ajax call while user is typing, when typing is detected, clear out delay
		 *
		*/
		typingStarted : function(e){
			window.clearTimeout(this.timeoutID);	//clear timeout by id
			this.triggerAjax = true;
		},

		/*
		 * When typing is finised we want to wait a bit before firing ajax query
		 *
		*/
		typingFinished : function(e){
			var target = $(e.target),
			queryterm = target.val(),
			self = this;
			// console.log(target.parent(".search").attr("id"));

			this.timeoutID = window.setTimeout(function(){
				if(self.triggerAjax && target.val().length == 1){
					$(".selectors").html(i18n.get('icmadvanced.advsearch', 'atleastTwoChar'));
					return false;
				}
				if (self.triggerAjax && target.val() == queryterm && (target.val().length >= 2 || target.val().length == 0)){		// if the data in put has not changed go forth with ajax
					self.triggerAjax = false;
					$(".resnum").html(i18n.get('icmadvanced.advsearch', 'working'));
					self.showSelector(e, queryterm);
					self.showFilterList(e);
					target.blur();		// remove focus from text field once the search is fired eliminate repeated query search
				}
			}, xedge.filterDelay);
		},

		/*
		 * clears search input field
		 * fire query with this update
		*/
		clearSearchField: function(e){
			$(".search > input").val('');
			this.fetchFilterData(null, 0, xedge.filterRows);
			return this;
		},

		/*
		 * render result set on filter box
		 * Up to 1000 records are retrieved from edgespring server so it does offset and limit
		*/
		renderItems : function(){
			this.parent.hideSpinner();		//clean up spinner
			var records = this.filterData && this.filterData.results && this.filterData.results.records;	// find records in result
			var selectedFilters = this.model.get("displayValues");

			var classname = 'selected';			// if the filter value is already selected, we want to have check mark next to it
			var dataArr = [];					// to hold elements which will be displayed
			var limit = (this.start + this.limit) > records.length ? records.length : this.start + this.limit;		// calc on where to start the data
			var selectionSet = 'none'			// flag to determine how many records are already selected
			var count = 0;						// used for logic to determine if some are selected
			for(var i = this.start; i < limit; i++){
				classname = '';
				if($.inArray(records[i][this.colname], selectedFilters) > -1) {
					classname = 'selected';
					selectionSet = 'all';
					count++;
				}
				dataArr.push("<a class='"+classname+"'>"+records[i][this.colname]+"</a>");
			}
			// if no data, put appropriate message
			if(dataArr.length == 0){
				$(".selectors").html(i18n.get('icmadvanced.advsearch', 'zeroRecords'));
			}
			// logic to show only some of the records are already selected
			if(count > 0 && records.length != count){
				selectionSet = 'some';
			}
			// add load more link, if we haven't gone through all the records
			if( (this.start+this.limit) < records.length) {
				dataArr.push("<a class='loadMoreBtn'>Show More...</a>");
			}
			this.updateAllToggle(selectionSet);;			// there is select all, we need to display appropriate UI for it
			$( ".loadMoreBtn" ).remove();
			$(".selectors").removeClass('filterMsg').append(dataArr.join('\n'));			// join array by new line and show on UI
			this.updateShowSelected();
			return this;
		},

		/*
		 * Show munber of rpeviously selecte items
		*/
		updateShowSelected : function(count){
			$(".selnum").html(i18n.get('icmadvanced.advsearch', 'showSelected')+" ("+$('.selectors > a.selected').length+")").show();
			return this;
		},

		/*
		 * Toggle selection of all or none of the items
		*/
		updateAllToggle : function(selectionSet){
			$(".select").removeClass('all').removeClass('none').removeClass('some').addClass(selectionSet);
			return this;
		},

		/*
		 * Load more records if any
		*/
		loadMore : function(e){
			this.start = this.start + this.limit;
			this.renderItems();
			return this;
		},

		/*
		 * Toggle all items and update UI
		*/
		toggleAll : function(e){
			var status = $(".selections > a.select").attr('class'),
			selector = $('.selectors a');

			if(status.indexOf('all') > 0){		// if all selected, set to none selected
				selector.removeClass("selected");
				this.updateAllToggle('none');
			}else if(status.indexOf('some') > 0){	// if some selected, remove exisiting and select all
				selector.removeClass("selected").addClass("selected");
				this.updateAllToggle('all');
			}else if(status.indexOf('none') > 0){	// if none selected, select all
				selector.addClass("selected");
				this.updateAllToggle('all');
			}
			$(".loadMoreBtn").removeClass("selected");			// we don't want load more to be selected
			this.updateShowSelected();
			return this;
		},

		/*
		 * Select item, but also update if all/none/some selected UI
		*/
		toggleItem: function(e){
			$(".button").removeClass("disabled");
			$(e.target).toggleClass("selected");
			this.updateShowSelected();
			if($('.selectors > a.selected').length == 0){
				this.updateAllToggle('none');
			}else if($('.selectors > a.selected').length ==  $('.selectors > a').length){
				this.updateAllToggle('all');
			}else{
				this.updateAllToggle('some');
			}
			return this;
		},

		/*
		 * Toggle (selected filters from un)show/hide) unselected filter values from filter box
		 *
		*/
		toggleSelected : function(){
			$(".selectors a").not(".selected").toggle(); //slideToggle( "fast" );
			return this;
		},

		/*
		 * Fire this when update button clicked. We get all selected items and then
		 * set these items in xegde to maintain state with other view and construct query
		*/
		updateDataByButton : function(e){
			if(xedge.currPage === 1 || xedge.currPage === 0){
				xedge.resetPagination();
			}
			var values = [];
			$('.selectors a').each(function(index, value) {
				if($(this).hasClass('selected')){
					values.push($(this).contents().get(0).nodeValue);
				}
			});
			var realValue = '';
			var displayValues = [];
			//xedge.clearFilter(this.colname);
			for(var i = 0; i < values.length; i++){
				realValue = values[i];
				if(this.colname === 'PERIOD_ORDER_NUMBER'){		// period has special mapping
					realValue = xedge.reverseMap[values[i].split(" (")[0]];
				}
				xedge.setFilter(this.colname, realValue);
				displayValues.push(values[i]);
				values[i] = realValue;
			}

			var values = _.union(this.model.get('filterValues'), values);
			var displayValues = _.union(this.model.get('displayValues'), displayValues);

			//set filter (DB) and display value in model
			this.model.set('filterValues', values);
			this.model.set('displayValues', displayValues);
			$(".filter-change-menu").remove();
			// update data on table on parent view
			this.parent.loadData({loadEdgemart : false, executeCountQuery : true, fromFilter:true});
			this.hideSelectBox(e);
			return this;
		},

		updateSelectedItems : function(self){
			var n = self.getSelectedFilter("filter-element-list");
			if(n.length > 0){
				$("#selectFilterPopup").removeClass("deactive").addClass("x-button-enabled");
			}else{
				$("#selectFilterPopup").removeClass("x-button-enabled").addClass("deactive");
			}
		},

		getSelectedFilter : function(elem){
			var selectedFilterList = [];
			$('#'+elem+' input:checked').each(function(index, value) {
				selectedFilterList.push($(value).val());
			});
			return selectedFilterList;
		},

		updateDataBySelectButton : function(self){
			//console.log("updateDataBySelectButton triggered");
			if(xedge.currPage === 1 || xedge.currPage === 0){
				xedge.resetPagination();
			}
			var values = self.getSelectedFilter("filter-element-list");
			var realValue = '';
			var displayValues = [];
			// console.log(values);
			//xedge.clearFilter(this.colname);
			for(var i = 0; i < values.length; i++){
				realValue = values[i];
				if(self.colname === 'PERIOD_ORDER_NUMBER'){		// period has special mapping
					realValue = xedge.reverseMap[values[i].split(" (")[0]];
				}
				xedge.setFilter(this.colname, realValue);
				displayValues.push(values[i]);
				values[i] = realValue;
			}
			var values = _.union(this.model.get('filterValues'), values);
			var displayValues = _.union(this.model.get('displayValues'), displayValues);

			//set filter (DB) and display value in model
			this.model.set('filterValues', values);
			this.model.set('displayValues', displayValues);
			$(".filter-change-menu").remove();
			// update data on table on parent view
			self.parent.loadData({loadEdgemart : false, executeCountQuery : true, fromFilter:true});
			self.hideFilterPopup();
			return this;
		},

		updateDataByDeleteButton :function(e){
			if(xedge.currPage === 1 || xedge.currPage === 0){
				xedge.resetPagination();
			}
			var target = $(e.target);
				li = target.closest("li"),
				value = li.data('item'),
				index = li.data('index');
			li.remove();

			xedge.removeFilter(this.colname, value);
			var filterValues = this.model.get('filterValues');
			filterValues.splice(index, 1);
			var displayValues = this.model.get('displayValues');
			displayValues.splice(index, 1);

			//set filter (DB) and display value in model
			this.model.set('filterValues', filterValues, {slient: true});
			this.model.set('displayValues', displayValues);
			$(".filter-change-menu").remove();
			// update data on table on parent view
			this.parent.loadData({loadEdgemart : false, executeCountQuery : true, fromFilter:true});
			this.hideSelectBox(e);
			return this;
		},

		showFilterList : function(e){
			if(this.model.get("disabled")) return; // dont do anything on disabled filters
			var target = $(e.target),
				inputId = '#'+target.parent(".inputFieldStyle").attr("id");

			$(".filter-change-menu").remove();
			var parentDiv = $(e.currentTarget).closest(".control");
			parentDiv.append($("#filterSelection").html());
			$(".searchInputTextBox").attr('placeholder', i18n.get('icmadvanced.advsearch', 'search'));		// add i18n label in placeholder

			$("body").off("click", this.hideSelectBox);  // clean up event listener, if any
			$("body").on("click", this.hideSelectBox);	// attach event listener on body to close the filter box
			$(this.$el).xlate( {namespace : 'icmadvanced.advsearch'} , $("#filterControls"));		// translate all labels
			//window.trackMixPanel("Advance Search Filter Used",{}) ;

			setTimeout(function(){
				$(inputId).find(".searchInputTextBox").focus();
			}, 100)
		},

		/*
		 * When filter UI box is clicked show the selector with fetched data.
		 * Set input field to accept values from keyboard/copy-paste
		 * Add event handler on body so when user clicks anywhere on body, besides filter box, it is closed.
		*/
		showSelectorPopup : function(e, queryterm){
			var self = this;
			if(this.model.get("disabled")) return; // dont do anything on disabled filters
			var target = $(e.target);
			var filtName = i18n.get('icmadvanced.advsearch', this.colname) ? i18n.get('icmadvanced.advsearch', this.colname) : this.colname;
			if(queryterm!=="first"){
				this.showFilterPopup(filtName);
			}
			queryterm = "";
			var showAllData = function(data){
				self.setDataInFilter(data);
			};
			var results = Q(this).then(xedge.getFilteredResults(this.colname, queryterm, 0, xedge.filterRows, showAllData, this.filterFailure)).done();
			return this;
		},

		updatePopupList: function(self, isClear){
			var queryTerm = "";
			$('#results-total-filter').empty();
			if(!isClear){
				queryTerm = $("#search-text").val();
				if(queryTerm==""){
					return;
				}
				$("#all-results-label").hide();
				$("#search-results-label").show();
			}else{
				xedge.filters = {};
				$("#search-text").val('');
				$("#all-results-label").show();
				$("#search-results-label").hide();
			}
			var results = Q(self).then(xedge.getFilteredResults(self.colname, queryTerm, 0, xedge.filterRows, self.setDataInFilter, self.filterFailure)).done();
			return this;
		},

		showSelector : function(e, queryterm){
			var target = $(e.target);
			this.fetchFilterData(queryterm, 0, xedge.filterRows);
			return this;
		},

		showFilterPopup :function(filtName){
			var self = this;
			var output = _.template($("#filterBox").html(), {
                filterName: filtName
            });
            $("#popupDiv").show().html(output);
			$("#cancelFilterPopup").on("click", this.hideFilterPopup);  // clean up event listener, if any
			$("#search-button").on("click", function(){self.updatePopupList(self)});  // clean up event listener, if any
			$("#clear-search").on("click", function(){self.updatePopupList(self, true)});  // clean up event listener, if any
			$("#selectFilterPopup").on("click", function(){self.updateDataBySelectButton(self)});  // clean up event listener, if any
			$("#popupDiv").on("click","input[name=selectType]", function(e){self.toggleSelectedFilter(self, e)});  // clean up event listener, if any

			$("#filter-element-list").on('click', 'input[type=checkbox]', function(){self.updateSelectedItems(self)});
			$('.modal-backdrop').removeClass('hide').addClass('in');
		},

		toggleSelectedFilter :function(self, e){
			var self = this,
				target = $(e.target),
				value = $(target).val(),
				$element,
				count = 0,
				hiddenCount = 0,
				itemCount,
				parent;
			
			$('#filter-element-list').find('input[type=checkbox]').each(function(index, element){
				$element = $(element);
				parent = $element.parents('li')
				count++;
				if(value === 'All'){
					parent.show();
				}else{
					if(!$element.prop('checked')){
						parent.hide();
						hiddenCount++;
					}
				}
			});
			if(value === 'All'){
				itemCount = '('+ count +')';
			}else{
				itemCount = (count - hiddenCount);
				itemCount = '('+ itemCount +')';
			}
			$('#results-total-filter').html(itemCount);
		},

		hideFilterPopup:function(){
			$("#popupDiv").hide().html();
			$('.modal-backdrop').removeClass('in').addClass('hide');
		},

		setDataInFilter:function(data){
			var self = this;
			var colName = this.colname;

			if(!colName && data.records && data.records.length > 0){
				var keys = _.keys(data.records[0]);
				colName = _.without(keys, 'count')[0];
			}
			
			var filters = xedge.filters[colName] || [];

			var records = data.records.map(function(obj, index){
				var rowObj = {},
					value = obj[colName];

				rowObj.value = value;
				rowObj.count = obj.count;
				rowObj.checked = '';

				if(colName === 'PERIOD_ORDER_NUMBER'){
					value = xedge.reversePeriodMap[value];
				}

				if(filters.indexOf(value) > -1){
					rowObj.checked = 'checked';
				}
				return rowObj;
			});

			var output = _.template($("#filterListBox").html(), {
                data: records
            });
           	
           	$("#filter-element-list").html(output);
           	$("#results-total-filter").html("("+data.records.length+")");
           	this.filterRows = records;
		},

		/*
		 * Hide filter box when a click event occurs on body, but keep it open if click event is on filter box
		 *
		*/
		hideSelectBox : function(e){
			if(!e) return;
			var target = $(e.target);
			// retrun when someone click on container containing input field so we can show the popup
			if($(target).hasClass("value") || target[0].nodeName == 'EM' || $(target).hasClass("loadMoreBtn") ){
				return;
			}

			var parent = target.parents(".filter-change-menu");
			if(parent.length == 0 ){
				$(".filter-change-menu").remove();
			}
			return this;
		},

		/*
		 * Get filter data based on the filter. We can get all data or partial data
		 * depending on other factors on the page. Once retrieve, render the data on filter box.
		*/
		fetchFilterData : function(value, offset, limit){
			var self = this;
			// success ajax call back...closure to maintain context in Q lib
			filterSuccess = function(data){
				$(".selectors").html('');	//clear up exisiting data
				$(".resnum").html('');
				self.filterData = data;		// data returned from server
				self.start = 0;				// start and limit to show
				self.limit = 50;
				self.renderItems();			// render result
			};

			this.parent.showSpinner();
			// get the result
			var results = Q(this).then(xedge.getFilteredResults(this.colname, value, offset, limit, filterSuccess, this.filterFailure)).done();
			return this;
		},

		/*
		 *	Message to show when server comes back with error
		 *
		*/
		filterFailure : function(error){
			setTimeout(function(){
				$(".selectors").html(
					"<div class='filterMsg'> "+i18n.get('icmadvanced.advsearch', 'serverError')+"</div>"
					);
			}, 0);
			return this;
		},

		/*
		 * fire this function when clear pressed on filter. If disabled, return.
		 * Then load data in table with updated/clered filter values
		*/
		clearFilter : function(){
			if(this.model.get("disabled")) return; // dont do anything on disabled filters
			if(xedge.currPage === 1 || xedge.currPage === 0){
				xedge.resetPagination();
			}
			this.clearFilterFromModel();
			this.parent.loadData({loadEdgemart : false, executeCountQuery : true, fromFilter:true});
			return this;
		},

		/*
		 * clear out all filter values from model.
		 * update xedge lib so we are in same state when query fires
		*/
		clearFilterFromModel : function(){
			this.model.set('filterValues', []);
			this.model.set('displayValues', []);
			xedge.clearFilter(this.colname);
			$('.searchInputTextBox').val('');
			return this;
		},

		/*
		 * Add filter value to model so we can use to filter out the results
		 * Display values is what you see on UI, filter value is whats in DB.
		*/
		addToModel : function(filterValue, displayValue){
			this.model.get('filterValues').push(filterValue);
			this.model.get('displayValues').push(displayValue);
			this.render();
			return this;
		},

		/*
		 * Depending on tab we may need to diable this instance of filter view.
		 * This is because the filter data may not be applicable to the tab
		*/
		toggleFilter : function(index){
			this.model.set("disabled", (index == -1));
			return this;
		}
	});
});
