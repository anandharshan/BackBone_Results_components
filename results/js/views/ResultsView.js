define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    'BaseEditView',
    'DownloadView',
    "moment",
    "momentTZ",
    "momentTZData",
    "PageMenuView",
    "TertiaryMenuView",
    "TableView",
	"SavedSearchView",
	"BreadCrumView",
	"FormGroupView",
	"LandingPageSidebarView",
	"ReleasedResultSidebarView",
	"userConfig",
	"savedSearchModel",
	"PeriodModel",
	"CommissionCollection",
], function($, _, Backbone, config, i18n, pageUtils, BaseEditView, DownloadView,  
			moment, momentTZ, momentTZData, PageMenuView, TertiaryMenuView, TableView, 
			SavedSearchView, BreadCrumView, FormGroupView, LandingPageSidebarView, 
			ReleasedResultSidebarView, userConfig, SavedSearchModel, PeriodModel,
			CommissionCollection){

	/**
	 * A Backbone View to render common "components" on pages under results tab.
	 * This view should act as a parent to all views responsible for rendering advancedsearch,
	 * credit, commission, bonuses, draws and payments ui.
	 *
	 * @module ResultsView
	 */
	var ResultsView = BaseEditView.extend({

		/**
		 * el
		 *
		 * @type jquery {Object} 
		 */
		el: $("#content"),

		/**
		 * i18n Namespace for this UI.
		 *
		 * @type {String} 
		 */
		namespace: "icmadvanced.results",

		/**
		 * default header. Override this property in your view.
		 *
		 * @type {String} 
		 */
		header : "Results",

		/**
		 * default ppaEnabled. Override this property in your view.
		 * Flag than enables as-of-period select box
		 *
		 * @type {Boolean} 
		 */
		ppaEnabled : false,

		/**
		 * default useLatestPeriod. Override this property in your view.
		 * This flag triggers showing data of latest period
		 *
		 * @type {Boolean} 
		 */
		useLatestPeriod: true,	// weather or not use all periods or not

		searchfields : [],
		searchtext : [],
		displaytext: [], // for breadcrums

		formInputValues: {}, //object to hold selected values for side bar

		// these are the columns than needs to be right aligned
        headerClassMap : {
            "amountWithUnitType" : "right-align",
            "rateWithUnitType" : "right-align",
            "creditAmountWithUnitType" : "right-align",
            "releaseAmountWithUnitType" : "right-align",
            "originaAmountWithUnitType" : "right-align",
            "heldAmountWithUnitType" : "right-align",
            "measureValue" : "right-align",
            "rollingMeasureValue" : "right-align",
            "attainmentValue" : "right-align",
            "rollingAttainmentValue" : "right-align",
            "creditApplied" : "right-align",
            "itemAmountWithUnitType" : "right-align",
            "drawBalanceWithUnitType" : "right-align",
            "paymentBalanceWithUnitType" : "right-align",
            "paymentWithUnitType" : "right-align",
            "negativePaymentWithUnitType" : "right-align",
            "itemPaymentWithUnitType" : "right-align",
            "businessGroupPaymentWithUnitType" : "right-align",
            "businessPaymentWithUnitType" : "right-align",
            "prevBalanceWithUnitType" : "right-align",
            "recoveredBalanceWithUnitType" : "right-align",
            "totalBalanceWithUnitType" : "right-align",
            "periodBalanceWithUnitType" : "right-align",
            "remainingBalanceWithUnitType" : "right-align",
            "drawPaymentWithUnitType" : "right-align",
            "eligibleAmountWithUnitType" : "right-align",
            "payAmountWithUnitType" : "right-align",
            "balanceWithUnitType" : "right-align",
            "originalPaymentWithUnitType" : "right-align",
            "differencePaymentWithUnitType" : "right-align",
            "balanceOwedWithUnitType" : "right-align"
        },

		/**
		 * Map to translate id with names used for http param name. 
		 * This key is id in model and value is an element in searchfields.
		 * This is a custom map for results tab. By default, we are using
		 * id as http request param name.
		 */
		paramNameMap : {
			"resultName" : "name",
			"amountWith" : "amount",
			"amountWith-unitType" : "amountUnitTypeId",
			"processedPeriod" : "processedPeriod",
			"estReleaseDate-fromDatePrimary" : "estReleaseDate-fromDate", 
			"estReleaseDate-toDatePrimary" : "estReleaseDate-toDate",
			"reasonCodeName": "reasonCode",
			"estimatedReleaseDate" : "estReleaseDate",
			"earningGroupName":"earningGroup",
			"originaAmountWithUnitType" : "amount",
			"originaAmountWithUnitType-unitType" : 'amountUnitTypeId',
			//payment balanaces
			'fromAmountWithUnitType' : 'amountFrom',
			'fromAmountWithUnitType-unitType' : 'amountUnitTypeId',
			'amountWithUnitType' : 'amount', 
			'amountWithUnitType-unitType' : 'amountUnitTypeId',
			'incentiveDate-toDate' : 'incentiveDate-toDate',
			'incentiveDate-fromDate' : 'incentiveDate-fromDate',
			'toAmount' : 'amountTo',
			//draws
			'fromEligibleAmountWithUnitType' : 'fromEligibleAmountWithUnitType',
			'toEligibleAmount' : 'toEligibleAmount',
			'finalizedDate-fromDate' : 'finalizedDate-fromDate',
			'finalizedDate-toDate' : 'finalizedDate-toDate',
			'fromPayAmountWithUnitType' : 'fromPayAmountWithUnitType',
			'toPayAmount' : 'toPayAmount'
		},

		/**
		 * Map to detemine if id or name||value to be used for http pram value. 
		 * This key is id and value is an element in searchfields.
		 * This is a custom map for results tab. By default, we are using
		 * value as http request param value.
		 */
		paramValueMap : {
			"businessGroup" : "id",
			"earningGroupName" : "id",
			"earningGroup" : "id",
			"reasonCode" : "id",
			"amountUnitTypeId" : "id",
			"creditType" : "id",
			"reasonCodeName" : "id"
		},

		// map for server side enums
		searchTypeMap : {
			"commissions" : "commissions",
			"credits" : "credit",
			"bonuses" : "bonus",
			"draws" : "draw",
			"payments" : "payments",
			"manualPayments" : 'manual_payments'
		},
			
		// map for server side enums
		solrEntityMap : {
			"commissions" : "commission",
			"credits" : "credit",
			"bonuses" : "bonus",
			"draws" : "draw",
			"payments" : "paymentresult",
			"balances" : "balances"
		},

		unitTypeParamMap : {
			"amountWithUnitType" : ['amountWithUnitType', 'amountWithUnitType-unitType'],
			"originaAmountWithUnitType" : ['amount', 'amountUnitTypeId'],
			"creditAmountWithUnitType" : ['creditAmount', 'creditAmtUnitTypeId'],
			"fromAmount" : ['fromAmount', 'amountUnitTypeId'],
			"fromAmountWithUnitType" : ['fromAmountWithUnitType', 'fromAmountWithUnitType-unitType'],
			"bizPaymentFrom" : ['bizPaymentFrom', 'bizPaymentFrom-unitType'],
			"itemPaymentFrom" : ['itemPaymentFrom', 'itemPaymentFrom-unitType'],
			"bizGroupPaymentFrom" : ['bizGroupPaymentFrom', 'bizGroupPaymentFrom-unitType'],
			"paymentFrom" : ['paymentFrom', 'paymentFrom-unitType'],
			"owedAmount" : ['owedAmount', 'owedAmount-unitType'],
			"previousBalance" : ['previousBalance', 'previousBalance-unitType'],
			"recoveredBalance" : ['recoveredBalance', 'recoveredBalance-unitType'],
			"totalAmount" : ['totalAmount', 'totalAmount-unitType'],
			"periodBalanceFrom" : ['periodBalanceFrom', 'periodBalanceFrom-unitType'],
			"previousBalanceFrom" : ['previousBalanceFrom', 'previousBalanceFrom-unitType'],
			"recoveredBalanceFrom" : ['recoveredBalanceFrom', 'recoveredBalanceFrom-unitType'],
			"remainingBalanceFrom" : ['remainingBalanceFrom', 'remainingBalanceFrom-unitType'],
			"eligibleAmountFrom" : ['eligibleAmountFrom', 'eligibleAmountFrom-unitType'],
			"payAmountFrom" : ['payAmountFrom', 'payAmountFrom-unitType'],
			"balanceFrom" : ['balanceFrom', 'balanceFrom-unitType']
		},

		singleSelects : ['quotaPeriodType', 'processedPeriod', 'finalized', 'paymentStatus','drawType'],

		requiredSearchFilters: {
			'personTab' : ['participantName'], 
			'ordersTab' : ['orderCode'], 
			'processedPeriodTab': ['processedPeriod'], 
			'erdTab' : ['estReleaseDate-fromDate', 'estReleaseDate-toDate']
		},

		detailsTemplate : _.template( $('#detail-row-template').html() ),

		triggerCountFetch : true,
			
		outputFormat : "MM/DD/YYYY", // for refreshdate

		events :{
            'click .searchNameTitle' : 'showSearchform',
            'click .searchOptionsBtn' : 'configureSettings',
            'click .legend' : 'toggleDetailAudit' // ManualPaymentView
        },

		/**
		 * An initialization method for Backbone.View. 
		 * 
		 * @param options {Object} data and object references required by this view.
		 */
		initialize: function (options) {
			config.sortBy = config.sortBy || this.tableHeaders[this.defaultSortIndex]; // this is in child views
            config.sortOrder = config.sortOrder || 'asc';
			this.isSessionStorageAvailable();
			this.pageName = this.header.toLowerCase();
			this.i18nPageName = i18n.get(this.namespace, this.header) || '['+this.header+']';
			this.track('Page Viewed'); // in baseview.js
			this.$el.html($('#credit-comm-bonus-tmpl').html());
			this.ppaEnabled = userConfig.getPreferences().isPPAEnabled;
			this.formInputValues = this.getSessionStorage('resultPageInputValues', true) || {};
			this.dataRefreshEl = this.$el.find('.data-refresh');
			this.dataRefreshEl.find('.data-refresh-label').text(i18n.get(this.namespace, 'ppaDataRefreshLabel') || '[PPA Data Refresh]:');
			
			this.preferences = userConfig.getPreferences();
      		this.timeZone = (this.preferences && this.preferences.timeZone) || "UTC";
      		if(this.preferences && this.preferences.rawDateFormat){
          		this.outputFormat = this.preferences.rawDateFormat.toUpperCase();
      		}
		},
		
		/**
         *
         */	
		setSessionStorage : function(key, value){
			if(this.sessionStore) {
				if(typeof value !== 'undefined' && typeof value !== null && typeof value !== 'string'){
					value = JSON.stringify(value); // either object or array
				}
				window.sessionStorage.setItem(key, value);
			}
		},

		/**
         *
         */	
		getSessionStorage : function(key, transformToObject){
			var value;
			if(this.sessionStore) {
				value = sessionStorage.getItem(key);
				if(value && transformToObject){
					value = JSON.parse(value);
				}
			}
			return value;
		},

		/**
         *
         */	
		removeSessionStorage : function(key){
			if(this.sessionStore) {
				sessionStorage.removeItem(key);
			}
		},	

		/**
         *
         */	
		isSessionStorageAvailable : function(){
			this.sessionStore = window.sessionStorage;
		},

		/**
         *
         */	
		loadSettings : function(){
			this.settingsEnum = this.searchTypeMap[this.pageName]+'_settings';
			if(this.type === 'held'){
				this.settingsEnum = this.searchTypeMap[this.pageName]+'_held_settings';
			}else if(this.type === 'manualPayments'){
				this.settingsEnum = 'manual_payments_settings';
			}else if(this.type === 'balances'){
				this.settingsEnum = 'payment_balances_settings';
			}

			this.settingsSavedSearchModel = new SavedSearchModel({
              type: this.settingsEnum
            });
            this.settingsSavedSearchModel.url = config.appContext + "/api/v1/savedsearches/settings/"+this.settingsEnum;
            this.listenTo(this.settingsSavedSearchModel, 'sync', this.setUpUsersSettings);
            this.listenTo(this.settingsSavedSearchModel, 'error', this.renderPage);
            this.settingsSavedSearchModel.fetch();
		},

		/**
         *
         */	
		setUpUsersSettings : function(){
			this.settingsId = this.settingsSavedSearchModel.get('id');
			if(this.settingsId){
				this.constructTableHeaders();
			}
			this.renderPage();
		},

		/**
         *
         */		
		constructTableHeaders : function(){
			this.tableHeaders = [];
			var sortedColumns = _.sortBy(this.settingsSavedSearchModel.get('searchViews'), 'position');
			sortedColumns.forEach(function(column){
				this.tableHeaders.push(column.columnId);
			}, this);

			var sortedSideBarFilters = _.sortBy(this.settingsSavedSearchModel.get('searchFilters'), 'position');			
			this.sideBarFilters = _.clone(sortedSideBarFilters);
			var filters = _.pluck(this.sideBarFilters, 'columnId');
			config.setSessionStorage("sideBarFilters", filters);
		},

		/*
		 * This method is executed once all data and properties are initiated in the extending view.
		 * This method will bind events. Make sure to implemente this method on your view to capture 
		 * these events for custom jobs.
		 *
		 */
		renderPage : function(){
			this.renderHeader(); // add header to page
			this.renderTertiaryMenuView();
			this.renderBasicSearchView();	// render basic search view
			this.renderSavedSearchView();   //render saved search table/view 
			this.$el.xlate({
                namespace: this.namespace 
            });
		},

		/**
         * 
         */		
        startSavedSearchExecution : function(){
			this.resultShown = true;
			this.$el.find('#results-table').removeClass('hide');
			this.$el.find('.saved-search-container').addClass('hide');
			this.$el.find('.search-section').hide(); 
			this.executeSavedSearch(config.tempCache.savedSearch);
			config.tempCache.savedSearch = null;
		},

		/**
         * 
         */		
        renderSavedSearchView : function(){
			var searchType = this.searchTypeMap[this.pageName];
			if(this.type === 'held'){
				searchType = searchType + '_' + this.type;
			}if(this.type === 'manualPayments'){
				searchType = 'manual_payments';
			}else if(this.type === 'balances'){
				searchType = 'payment_balances';
			}
			this.savedSearchView = new SavedSearchView({
				el : this.$el.find(".saved-search-container"),
				page: this.pageName,
				type: this.type,
				searchType : searchType
			});
			this.listenTo(this.savedSearchView, "search", this.executeSavedSearch);
			this.savedSearchView.render();
		},

		/**
         *
         */		
		executeSavedSearch : function(model){
			this.settingsSavedSearchModel = model;
			this.searchFromSidebar = false;
			this.searchName = this.settingsSavedSearchModel.get('title');
			this.constructDataFromSavedSearch(this.settingsSavedSearchModel);
			this.determineHeldTabFromSavedFilter();
			this.executeSearch();
		},

		/**
         *
         */
		determineHeldTabFromSavedFilter : function(){
			var self = this,
				searchFilters = this.settingsSavedSearchModel.get('searchFilters'),
				columnIds = _.pluck(searchFilters, 'columnId'),
				tabInputs, uniq, hasValues;

			// we'll set the last tab with all elements in columnsIds as default tab
			_.keys(this.requiredSearchFilters).forEach(function(tab){
				tabInputs = this.requiredSearchFilters[tab];
				hasValues = _.map(tabInputs, function(input){
					if(!self.formInputValues[input]){
						return false;
					}else if(self.formInputValues[input].length > 0){
						return true;
					}if(self.formInputValues[input]){
						return true;
					}
					return false;
				});
				uniq = _.uniq(hasValues);
				if(uniq.length === 1 && uniq[0] === true){ //intersect.length === tabInputs.length && 
					config.selectedHeldTab = tab;
				}
			}, this);
		},

		/**
         *
         */
		constructDataFromSavedSearch : function(){
			this.formInputValues = {};
			var searchFilters = this.settingsSavedSearchModel.get('searchFilters');
			searchFilters.forEach(function(filter){
				if(filter && filter.fromValue){
					if(filter.columnId.toLowerCase().indexOf('withunittype') > -1 ||
							this.unitTypeParamMap[filter.columnId] ){
						var mappedParams = this.unitTypeParamMap[filter.columnId];
						this.formInputValues[ mappedParams[0] ] = filter.fromValue;
						this.formInputValues[ mappedParams[1] ] = filter.toValue;
					}else if(filter.columnId.toLowerCase().indexOf('date') > -1){
						this.formInputValues[filter.columnId] = filter.fromValue;
						if(config.selectedHeldTab === 'erdTab' && filter.columnId.indexOf('estReleaseDate-') > -1){
							this.formInputValues[filter.columnId+'Primary'] = filter.fromValue;
						}
					}else if(filter.columnId === 'period'){
						this.triggerCountFetch = false;
						$("#period").select2("val", filter.toValue).trigger('change');
						//this.formInputValues['periodId'] = filter.toValue;
					}else if(filter.columnId === 'AS_OF_PERIOD_ID'){
						this.triggerCountFetch = false;
						$("#as-of-period").select2("val", filter.toValue).trigger('change');
						//this.formInputValues['AS_OF_PERIOD_ID'] = filter.toValue;
					// }else if(filter.columnId === 'name'){
					// 	this.formInputValues[filter.columnId] = filter.fromValue;
					}else{
						var data = {
							'id' : filter.toValue,
							'name' : filter.fromValue,
							'value' : filter.fromValue
						};
						data[filter.columnId] = filter.fromValue;
						this.formInputValues[filter.columnId] = [data];
						if(this.singleSelects.indexOf(filter.columnId) > -1){
							data.displayLabel = filter.fromValue;
							data[filter.columnId] = filter.toValue;
							this.formInputValues[filter.columnId] = data;
						}
					}
				}
			}, this);

			this.settingsSavedSearchModel.set('searchFilters', this.sideBarFilters);
		},

		/**
         *
         */
        search : function(){
			this.constructDataFromInputForm();
			this.searchName = i18n.get(this.namespace, 'basicSeachLabel') || "[Basic]";
			// if held -> get selected tab
			if(this.type === 'held'){
				var isFormvalid = this.formGroupView.isFormvalid();
				if(!isFormvalid){
					// show error gutter
					return;
				}
			}
			this.executeSearch();
		},

		/**
         *
         */		
		executeSearch : function(){
			var self = this,
				debug = false,
				id, valueProperty,
				paramName, paramValue, valid = true;

			this.searchName = this.searchName || i18n.get(this.namespace, 'basicSeachLabel') || "[Basic]";

			if(debug)console.log('this.formInputValues', this.formInputValues);

			self.searchfields = [];
			self.searchtext = [];
			self.displaytext = [];
			this.crumMapping = {};
			if(debug)console.log(self.searchfields, self.searchtext);

			_.each(this.formInputValues, function(paramValue, id){
				if(debug)console.log(id, paramValue);
				paramName = self.paramNameMap[id] || id; // paramName is either mapped value or id
				self.crumMapping[paramName] = id;
				valueProperty = 'value'; 
				if(!self.ppaEnabled){ 
					// if going to incent, ppa is not enabled, for data than map string or id
					valueProperty = self.paramValueMap[id] || 'value'; 
				}
				if(debug)console.log(self.ppaEnabled, id, self.paramValueMap[id], valueProperty);
				if(paramValue && Array.isArray(paramValue)){
					if(debug)console.log("--->", paramName, paramValue);
					paramValue.forEach(function(element){
						self.searchfields.push(paramName);
						self.searchtext.push(element[valueProperty]);
						self.displaytext.push(element.value || element.name); //either value or name
					});
				}else if( paramValue && (typeof paramValue === 'object') && paramValue.displayLabel){
					self.searchfields.push(paramName);
					self.searchtext.push(paramValue[ self.paramNameMap[id] || 'id' ] || paramValue.displayLabel );	
					self.displaytext.push(paramValue.displayLabel);		
				}else if(paramValue){
					self.populateSearchFields(paramName, paramValue, paramValue);	
				}
			});
			if(debug)console.log(self.searchfields, self.searchtext);

            this.resultShown = true;
			this.updateCachedPeriod();
			
			if(this.searchFromSidebar){
				// we want to init collection again since admin can toggle
				// between as of period and latest period. In case of latest
				// we are searching incent db, else we will search solr.
				// initCollection calls render table that fetches data
				this.initCollection();
			}else{
				this.renderResults();
			}
			this.setSessionStorage('resultPageInputValues', this.formInputValues);
        },

		/**
         * mainly for est date issue in held page
         *Place where we populate searchtext, searchfields, displaytext
         *so that seach , download and breadcrumb will be populated correctly.
         */
		populateSearchFields : function(field, text, displaytext){
			var index = this.searchfields.indexOf(field);
			if(index === -1){
				index = this.searchfields.length;
			}
			this.searchfields[index] = field;
			if(field.indexOf('Date') > -1){
				text = this.formatDateForAPI(text);
			}
			this.searchtext[index] = text;	
			this.displaytext[index] = displaytext;
		},
        
        /**
         * Format date to MM/DD/YYYY so API can understand 
         * 
         */
        formatDateForAPI : function(date){
			if(!date) return date;
			var userFormat = userConfig.getPreferences().rawDateFormat;
			userFormat = userFormat.toUpperCase();
			return moment.utc(date, userFormat).format('MM/DD/YYYY');
        },

		/**
         * ForStickiness
         */
        updateCachedPeriod : function(){
			if(this.type === 'held' && this.formInputValues['processedPeriod']){
				config.tempCache = config.tempCache || {};
				config.tempCache['selectedPeriod'] = new PeriodModel(this.formInputValues['processedPeriod']);
			}
		},

		/**
		 *Fuction that renders the result table when we hit the search from landing page and results page get loaded
		 *shows the result table
		 *hides the saved search section
		 *Hides the search section from the landing page
		 */
		renderTableView : function(){
			this.cleanTable();	
			this.tableView = new TableView({
				el : $('#results-table'),
				namespace : this.namespace,
				collection : this.dataCollection,
				headers : this.headerCols,
				jqUIScroll : true,
				cellClassName : 'cell',
				showError : true,
				rowView: this.rowView,
				headerTemplate : this.headerTemplate,
				multiSelect : true,
				expander: true
			});
			this.$el.find('#results-table').removeClass('hide');
			this.$el.find('.saved-search-container').addClass('hide');
			this.$el.find('.search-section').hide(); // hide class is overridden so using $.hide
			this.$el.find('#releaseCount').addClass('hide');
			
			this.listenTo(this.tableView, 'rowclick', this.rowClicked);
			this.listenTo(this.tableView, 'rowclick', this.toggleRowDetail);
			this.listenTo(this.tableView, 'rendered', this.postRenderTableTask);
			this.listenTo(this.tableView, 'expand', this.expandCollapseListener);

			// destroy form-groups
			if(this.formGroupView) this.formGroupView.cleanUp();
		},

		/**
		 *
		 */	
		cleanTable : function(e){
			if(this.tableView){
				this.tableView.cleanUp();
				this.tableView.undelegateEvents();
			}
		},

		/**
		 * Utility method to set up page header {@link module:ResultsView~header}
		 */
		renderHeader : function(){
			this.$el.find('#page-header').html(this.header); // title of the page
		},

		/**
		 *Does actions that needs to done after the render of resultsTable is rendered
		 */	
		postRenderTableTask : function(){
			this.togglePPAItems();
			if(this.resizeCommentsColumn){
				this.resizeCommentsColumn();
			}
			this.resetSelectedRows();
			this.triggerCountFetch = true;
			this.togglePPADate();
		},
		/**
		 *
		 */		
		togglePPADate : function(){
			if(this.ppaEnabled && this.selectedAsOfPeriod.get('open') === false && this.dataCollection.ppaLastUpdatedDate){ // solr data
				var dayPPA = moment(this.dataCollection.ppaLastUpdatedDate);
				var refreshDatePPA = dayPPA.format(this.outputFormat+'  HH:mm A', this.timeZone);
				this.dataRefreshEl.find('.data-refresh-label').text(i18n.get(this.namespace, 'ppaDataRefreshLabel') || '[PPA Data Refresh]:');
				this.dataRefreshEl.removeClass('hard-hide').find('.data-refresh-time').text(refreshDatePPA);
			}else if(this.ppaEnabled && this.selectedAsOfPeriod.get('open') === true && this.dataCollection.mdrLastUpdatedDate){
				var dayMDR = moment(this.dataCollection.mdrLastUpdatedDate);
				var refreshDatedayMDR = dayMDR.format(this.outputFormat+'  HH:mm A', this.timeZone);
				this.dataRefreshEl.find('.data-refresh-label').text(i18n.get(this.namespace, 'mdrDataRefreshLabel') || '[MDR Data Refresh]:');
				this.dataRefreshEl.removeClass('hard-hide').find('.data-refresh-time').text(refreshDatedayMDR);
			}else{ // incent data
				this.dataRefreshEl.addClass('hard-hide').find('.data-refresh-time').text('');
			}
		},

		/**
		 *
		 */		
		togglePPAItems : function(){
			var ppaExcludeElements = this.$el.find('.no-ppa');
			if(this.ppaEnabled || (this.dataCollection && this.dataCollection.length === 0)){ // solr data
				ppaExcludeElements.find('.arrow-box-container').addClass('hard-hide');
				ppaExcludeElements.addClass('disabled');
				this.hideCheckboxes();
				this.$el.find('.no-comments').hide();
			}else{ // incent data
				ppaExcludeElements.find('.arrow-box-container').removeClass('hard-hide');
				ppaExcludeElements.removeClass('disabled');
				if(this.dataCollection && this.dataCollection.length === 0){
					this.hideCheckboxes();
				}else{
					this.showCheckboxes();
				}
			}
		},

		/**
		 *
		 */		
		showCheckboxes : function(){
			if(this.tableView){
				this.tableView.$el.find('.action-cell > .select').show();
				this.tableView.$el.find('.all-select-control').show();
			}
		},

		/**
		 *
		 */		
		hideCheckboxes : function(){
			if(this.tableView){
				this.tableView.$el.find('.action-cell > .select').hide();
				this.tableView.$el.find('.all-select-control').hide();
			}
		},

		/**
		 *Does the housekeeping of the the checkboxes in the results Table.
		 */		
		resetSelectedRows : function(){
			var self = this,
				collectionIds, selectedIds, className, allSelected = true;

			self.rowsSelected = self.rowsSelected || [];
			if(this.type === 'payments'){
				self.rowsSelected = [];
				self.disableSidebarActions();
			}
			collectionIds = self.dataCollection.map(function(model){
				return model.get('id');
			});

			var allSelectionControl = $('#results-table').find('.all-select-control');
			allSelectionControl.removeClass('fa-check-square').addClass('fa-square-o');

			allSelectionControl.off( "click").on( "click", function(){
				var class1 = 'row-selected', class2 = 'row-not-selected';	

				if($(this).hasClass('fa-square-o')){
					// unselected...so selecte all rows
					self.rowsSelected = _.union(self.rowsSelected, self.dataCollection.toJSON());
					$(this).removeClass('fa-minus-square-o fa-square-o').addClass('fa-check-square');
				}else{
					// selected...so remove all rows on this page from rowSelection
					class1 = 'row-not-selected';
					class2 = 'row-selected';

					self.rowsSelected = _.filter(self.rowsSelected, function(row){
						return (collectionIds.indexOf(row.id) === -1);
					});
					$(this).removeClass('fa-minus-square-o fa-check-square').addClass('fa-square-o');
				}

				if(self.rowsSelected.length > 0){
					self.enableSidebarActions();
				}else{
					self.disableSidebarActions();
				}

				$('.list-item-row').each(function(index, row){
					var $row= $(row);
					$row.find('.action-cell > .select').addClass(class1).removeClass(class2);
				});
			});
			this.updateRowSelection();
		},
		
		/**
		 *
		 */
		updateRowSelection : function(){
			// select the rows that are selected
			if(this.rowsSelected.length > 0){
				// get selected ids in sting data type
				selectedIds = _.pluck(this.rowsSelected, 'id'); //.map(function(id){ return String(id);});
				
				// make row selected, if contained in selectedIds
				$('.list-item-row').each(function(index, row){
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
			if($('#results-table').find('.row-selected').length === this.dataCollection.length){
				allSelectionControl.addClass('fa-check-square').removeClass('fa-square-o');
			}else{
				allSelectionControl.removeClass('fa-check-square').addClass('fa-square-o');
			}
		},

		/**
		 * Returns record id which will be used to fetch details
		 * 
		 */
		getRecordId : function(model){
			var id = model.id;
			if(this.pageName === 'commissions' && this.type !== 'held') {
				id = model.commissionId;
			}
			return id;
		},

		/**
		 *
		 *
		 */
		toggleRowDetail : function(model, action, event){
			if($(event.target).hasClass('fa')){
				return;
			}

			var self = this,
				id = this.getRecordId(model),
				commissionCollection, cacheKey, apiUrl;
			
			cacheKey = this.type+'-'+id;

			config.tempCache = config.tempCache || {};
			cachedModel = config.tempCache[cacheKey];
			
			if(!this.ppaEnabled && !cachedModel && 
				this.pageName !== 'payments' && 
				this.pageName !== 'draws'){ // get data from server 
				commissionCollection = new CommissionCollection();

				apiUrl = config.appContext + "/api/v1/"+this.pageName+"/"+id;
				if(this.pageName === 'commissions'){
					apiUrl = config.appContext + "/api/v1/"+this.pageName+"/"+this.type+"/"+id;
				}

				commissionCollection.url = apiUrl;
				commissionCollection.fetch({
					success: function(commModel){
						if(commModel.length > 0){
							config.tempCache[cacheKey] = commModel.at(0).toJSON();	// add to cache
							self.showRowDetail(config.tempCache[cacheKey], action, event); // show details
						}else{
							self.showRowDetail(model, action, event);
						}
					},
					error:function(){
						self.showRowDetail(model, action, event);
					}
				});
			}else if(cachedModel){ 
				this.showRowDetail(cachedModel, action, event);
			}else{
				this.showRowDetail(model, action, event);
			}
		},

		/**
		 *
		 *
		 */
		showRowDetail : function(model, action, event){
			var target = $(event.target),
				element, width, hidden;
			if(this.rowExpandConfig && 
				(target.hasClass('res-row') || target.parent().hasClass('res-row'))){
				element = $(event.currentTarget).find('.res-row-details');
				if(element.html().length === 0){
					width = this.$el.find('#results-table').width() -75;
					if(width < 600){

					}
					element.html( this.detailsTemplate({
						config: this.rowExpandConfig,
						data : model
					}))
					.xlate({
						namespace: this.namespace 
					})
					.width(width);
				}
				hidden = element.is(':hidden');
				$('.res-row-details').hide();
				if(hidden){
					element.show();
				}
			}
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
			this.rowsSelected = this.rowsSelected || [];

			if(target.hasClass('row-comment')){
				this.addComment(true); // in *HeldViews.js
			}else if(target.hasClass('select')){
				var present = _.findWhere(this.rowsSelected, {id: model.id});
				if(present){ //remove
					this.rowsSelected = _.reject(this.rowsSelected, function(m){
						return model.id === m.id;
					});
					target.removeClass('row-selected').addClass('row-not-selected');
				}else{
					this.rowsSelected.push(model);
					target.removeClass('row-not-selected').addClass('row-selected');
				}
			}

			if(this.rowsSelected.length === 0){
				this.disableSidebarActions();
			}else{
				this.enableSidebarActions();
			}
			this.toggleAllSelect();
		},

		/**
		 *
		 */
		tertiaryMenuItemsConfig : function(){
			var releaseClass = 'activeLink', 
				heldClass = '';

			if(this.type === 'held'){
				releaseClass = '';
				heldClass = 'activeLink';
			}
			/* jshint ignore:start */
			this.menuItems = [
	            {
					id: 'released',
					className : releaseClass,
					label: i18n.get(this.namespace, 'released') || "[Released]",
					hash : 'results/' + this.pageName + '/release',
					hashTrigger : true
	            },
	            {
					id: 'held',
					className : heldClass,
					label: i18n.get(this.namespace, 'heldMenuLabel') || "[Held]",
					hash : 'results/' + this.pageName + '/held',
					hashTrigger : true
	            }
	        ];
	      
			if(config.heldPermissions && config.heldPermissions.value === 'NONE'){
                this.menuItems = [];
            }
			/* jshint ignore:end */
		},

		/**
		 *
		 */
		renderTertiaryMenuView : function(){
			this.tertiaryMenuItemsConfig();

			// call view...may be extended to handle custom events
			this.tertiaryMenuView = new TertiaryMenuView({
				el : ('#tertiary-nav'),
				menuItems: this.menuItems
			});
		},

		/**
		 *
		 */
		configureSettings : function(){
			var hash = 'settings/' + this.pageName;
			if(this.type === 'manualPayments'){
				hash = 'settings/manual_payments';
			}else if(this.type === 'balances'){
				hash = 'settings/payment_balances';
			}

			if(this.settingsId){
				hash = hash + '/' + this.settingsId;
			} 
			config.router.navigate(hash , {trigger: true});
		},

		/**
		 * for mixpanel tracking
		 */ 
		track : function(data){
			
		},

		/**
         * Trigger error event in case of server error
         */
        error : function(collection, jqXHR, options){
            this.trigger('error', collection, jqXHR, options);
            this.renderBreadCrumView();
            var errorCode, generateTmplEl,calcbalancesTmpEl, finalizeTmpEl, releasepaymentsTmpEl;
            try{
                var json = JSON.parse(jqXHR.responseText);
                errorCode = json.error;
            } catch(err){} 
            if(errorCode === 16000){
				generateTmplEl = this.$el.find('.generate-template');
				calcbalancesTmpEl = this.$el.find('.secondary-button.calcbalances');
				finalizeTmpEl = this.$el.find('.secondary-button.finalize');
				releasepaymentsTmpEl = this.$el.find('.secondary-button.release-payments');
				setTimeout(function(){
					generateTmplEl.removeClass('disabled').addClass('enabled').prop('disabled', false);
					calcbalancesTmpEl.removeClass('disabled').addClass('enabled').prop('disabled', false);
					finalizeTmpEl.removeClass('disabled').addClass('enabled').prop('disabled', false);
					releasepaymentsTmpEl.removeClass('disabled').addClass('enabled').prop('disabled', false);
					generateTmplEl.find('.arrow-box-container').removeClass('hard-hide');
				}, 100);
            }
        },

        /**
         *
         */
        loadHeaders : function(){
            var self = this,
				// determine sortby field, amount and rates are computed fields, 
				// so we need to drop unitType and ger amount field only
				// amountMapForSort maps field value to computed value
				_sortBy = this.amountMapForSort && this.amountMapForSort[config.sortBy] || config.sortBy, 
				sortIndex = this.tableHeaders.indexOf(_sortBy),
				tableHeaders = _.clone(this.tableHeaders);
            
			sortIndex = (sortIndex === -1) ? 0 : sortIndex; // default to 0 if -1
			
			config.sortBy = this.tableHeaders[sortIndex];
			// tableHeaders contains computed fields for amount and rates, 
			// so we need to reverse match from amountMapForSort and
			// set that fields and sortBy value
			if(this.amountMapForSort){
				config.sortBy = _.invert(this.amountMapForSort)[config.sortBy] || config.sortBy;
			}

			this.defaultSortIndex = sortIndex;

			if(this.ppaEnabled){
				tableHeaders.push('DATA_AS_OF');
			}
            // this needs to be come from default, xactly-default or saved seach
            this.headerCols = tableHeaders.map(function(name){
                obj = Object.create(null);
                obj.name= name;
                obj.label = i18n.get(self.namespace, name) || '['+name+']';
                obj.sortable = true;
                obj.sort = '';
                obj.className = 'cell '+ (self.headerClassMap[name] || '');
                return obj;
            });
            this.headerCols[this.defaultSortIndex].sort = config.sortOrder || 'asc';
        },

        /**
         *
         */
        updateSort : function(sortBy, sortOrder){
			if(!this.ppaEnabled){
				config.sortBy = sortBy.name;
				config.sortOrder = sortBy.sort;
			}
        },

        /**
         *
         */
		removeMiscSearchFildsFromBreadCrum : function(searchfields, displaytext){
			var indexOfTypeField,
				fieldsToRemove = ['type', 'PERIOD_ORDER_NUMBER', 'IS_HELD'];

			fieldsToRemove.forEach(function(field){
				indexOfTypeField = searchfields.indexOf(field);
				if(indexOfTypeField > -1){
					searchfields.splice(indexOfTypeField, 1);
					displaytext.splice(indexOfTypeField, 1);
				}
				indexOfTypeField = -1;
			});
		},

        /**
         *
         */
		renderBreadCrumView : function(){
			var self= this,
				searchfields = _.clone(this.searchfields),
				displaytext = _.clone(this.displaytext),
				nonDeletable = ['periodId'],
				renderOrder = ['periodId'],
				tooltip = {};

			searchfields = _.without(searchfields, 'paymentType');
			searchfields = _.without(searchfields, 'balanceType');

			this.removeMiscSearchFildsFromBreadCrum(searchfields, displaytext);

			searchfields.forEach(function(field, index){
				tooltip[field] = i18n.get(this.namespace, field) || null;
				if(field === 'paymentType' || field === 'balanceType'){
					displaytext[index] = $.trim(this.$el.find("[data-paymentType='" + this.searchtext[index] + "']").text());			
				}else if(field === 'periodId'){
					displaytext[index] = self.selectedPeriod.get('name');					
				}else if(field === 'AS_OF_PERIOD_ID'){
					nonDeletable.push('AS_OF_PERIOD_ID');
					displaytext[index] = self.selectedAsOfPeriod.get('name');
				}else if((field === "amountUnitTypeId" || field.indexOf('-unitType') > -1) && displaytext[index]){
					var unitType = _.find(userConfig.getBusinessInfo().unitTypes, function(unit){
						return unit.id == displaytext[index];
					});
					if(unitType){
						displaytext[index] = unitType.displaySymbol;
					}
				}
				if( (typeof displaytext[index] === 'object') && (displaytext[index].displayLabel)){
					displaytext[index] = displaytext[index].displayLabel;
				}
			}, this);

			if(this.type === 'held'){
				nonDeletable = _.map(this.tabFormInputs[config.selectedHeldTab], function(object){
					if(object.id == 'estReleaseDate-fromDatePrimary' || object.id == 'estReleaseDate-toDatePrimary'){
						return object.id.replace('Primary', '');
					}else{
						return object.id;	
					}
				});
				nonDeletable = _.without(nonDeletable, "orderItemCode");
				if(this.ppaEnabled === true){
					nonDeletable.unshift('AS_OF_PERIOD_ID');
				}
				renderOrder = nonDeletable;
			}
			
			if(this.breadCrumView){
				this.breadCrumView.undelegateEvents();
			}
			this.breadCrumView = new BreadCrumView({
				searchfield : searchfields,
				searchtext  : displaytext,
				nonDeletable : nonDeletable,
				renderOrder: renderOrder,
				namespace : this.namespace,
				tooltip : tooltip
			});
			this.listenTo(this.breadCrumView, "removecrum", this.removeCrum);

			this.$el.find('#searchName').html(this.searchName);
			setTimeout(function(){
				self.$el.find('.search-breadcrumb_container').removeClass('hide');
				self.resizeCrumbox();
			}, 100);
		},
 
		/**
         *
         */
        resizeCrumbox: function(){
            var container = this.$el.find('.search-breadcrumb_container');
				titleWidth = container.find('.searchNameTitle').outerWidth(true),
                searchTextWidth = container.find('#searchName').width(),
                containerWidth =  container.width(); 

           this.$el.find('.crums').width( containerWidth - (titleWidth + searchTextWidth + 50));
        },

        /**
         *
         */
        removeCrum : function(filterName, filterValue){
			this.formInputValues[ this.crumMapping[filterName] ] = null;
			this.dataCollection.removeFilter(filterName);  
			var index = this.searchfields.indexOf(filterName);
			if(index > -1){
				this.displaytext.splice(index, 1);
			}
			this.searchfields = this.dataCollection.params.searchfield;          
			this.searchtext = this.dataCollection.params.searchtext;          
			this.sideBarView.clearInput(this.crumMapping[filterName]);	// remove from sidebar
			if(filterName === 'AS_OF_PERIOD_ID'){
				this.sideBarView.resetAsOfPeriod();
			}
			this.setSessionStorage('resultPageInputValues', this.formInputValues);
        },

        /**
         *
         */
        renderFormGroups : function(){
			this.formGroupView = new FormGroupView({
				formGroups : this.formGroups,
				tabFormInputs: this.tabFormInputs,	// this will be undefined for all release pages
				el : this.formGroupEl,
				pageName : this.pageName,
				type: this.type,
				namespace : this.namespace
			});
			// need this to rinse out formelements that do not belong to this page
			// since we are mergging formelement from landing page and results page
			this.pageFormElements = _.map(this.formGroupView.formElementViews, function(view){
				return view.data.id;
			});
        },

        /**
         *This function is called when Basic Search Button is clicked
         */
        showSearchform : function(e){
			this.$el.find('#results-table').addClass('hide');
			this.$el.find('.search-section').show();
			this.$el.find('.saved-search-container').removeClass('hide');
			this.$el.find('#releaseCount').removeClass('hide');
			if(this.$el.find('.expander').hasClass('expand')){
				this.toggleExpandCollapse(this.$el.find('.expander'));
			}
			this.cleanTable();
			this.rowsSelected = [];
			this.constructDataFromInputForm();
            this.resultShown = false;
			this.renderBasicSearchView();
        },
		
		/**
		 *
		 */	
		expandCollapseListener : function(e){
			this.toggleExpandCollapse($(e.currentTarget));
		},

		/**
		 *
		 */	
		toggleExpandCollapse : function(target){
			var self = this,
                expanded = target.hasClass('expand');

			var sidebar_container = this.$el.find('.sidebar-item-container');
			if(expanded){
				// collapse
				sidebar_container.show().animate({
					// 'min-width' : "248px",
					// 'max-width' : "248px",
					width: "248px",
                    duration: 500,
                    queue: false
				}, function(){
					sidebar_container.show();
					target.removeClass('expand');
					self.tableView.resizeTable();
				});
			}else{
				// expand
				sidebar_container.animate({
					// 'min-width' : "10px",
					// 'max-width' : "10px",
					width: "10px",
                    duration: 500,
                    queue: false
				}, function(){
					sidebar_container.hide();
					target.addClass('expand');
					self.tableView.resizeTable();
				});
			}
		},

		/**
         *
         */
		constructDataFromInputForm : function(){
			var self = this,
				formValues,
				rawDataFromSidevar,
				amountParamName;

			this.searchFromSidebar = false;

			// formGroupView only renders on landing page so it's important to
			// clear up formGroupView when result is rendered. 
			formValues  = this.formGroupView.getData();
			
			if(formValues && _.keys(formValues).length === 0){
				// on result page form data will come from sidebar
				this.searchFromSidebar = true;
				formValues  = this.sideBarView.getData();
			}
			// merge data from sidebarview to formInputValues since sidebar is subset of formInputValues
			$.extend(this.formInputValues, formValues);

			// clean input values which do not belong to these page...part of stickyness feature
			_.keys(this.formInputValues).forEach(function(inputKey){
				if(inputKey.indexOf('-unitType') > -1){
					amountParamName = inputKey.split('-unitType')[0];
					if(self.pageFormElements.indexOf(amountParamName) > -1){
						// We want to skip unit type keys which has corresponsing amount fields. 
						// So skip amountWithUnitType-unitType when amountWithUnitType is present
						return; 
					}
				}
				// remove property with inputKey from this.formInputValues since it's not part of this page
				if(self.pageFormElements.indexOf(inputKey) === -1){
					delete self.formInputValues[inputKey];
				}
			});
		},

        /**
         *
         */
        renderResultSideBar : function(template){
			if(this.sideBarView) this.sideBarView.cleanUp();
			inputValues = _.clone(this.formInputValues);

            this.sideBarView = new ReleasedResultSidebarView({
                el : this.$el.find('.sidebar'),
                type: this.type,
                header: this.primaryButtonKey || this.header,
                namespace : this.namespace,
                template : template,
                inputValues: inputValues,
                selectedTab : config.selectedHeldTab,
                settingsSavedSearchModel : this.settingsSavedSearchModel,
                pageName: this.pageName
            });
			this.attachSideBarListeners();
        },
        
        /**
         *Render the Landing Page SideBar
         *primaryButtonKey is passed when we want to have a seperate text another than that of header
         *header is passed when u want to append the "Search" prior to the primaryButtonKey or Header
         */
        renderLandingSideBar : function(template){
			if(this.sideBarView) this.sideBarView.cleanUp();
            this.sideBarView = new LandingPageSidebarView({
                el : this.$el.find('.sidebar'),
                type: this.type,
                header: this.primaryButtonKey || this.header,
                primaryButtonKey : this.primaryButtonKey,
                namespace : this.namespace,
                template : template
            });
            this.attachSideBarListeners();
        },

        /**
         *This is the place where all  the SideBars Action listeners are added.
         *the Call back handler needs to be defined in the view that is extended from the ResultsView.js
         */
		attachSideBarListeners : function(){
			// period
			this.listenTo(this.sideBarView, "defaultPeriod", this.setDefaultPeriod);
			this.listenTo(this.sideBarView, "periodChange", this.periodChanged);

			// for search and download
			this.listenTo(this.sideBarView, "search", this.search);
			this.listenTo(this.sideBarView, "download", this.download);
			this.listenTo(this.sideBarView, "saveSearch", this.saveSearch);

			// for held pages
			this.listenTo(this.sideBarView, "generateTemplate", this.generateTemplate);
			this.listenTo(this.sideBarView, "addComment", this.addComment);
			this.listenTo(this.sideBarView, "releaseHolds", this.releaseHolds);

			// for payment page
			this.listenTo(this.sideBarView, "preview", this.preview);
			this.listenTo(this.sideBarView, "finalize", this.finalize);
			this.listenTo(this.sideBarView, "calcbalances", this.calcbalances);
			this.listenTo(this.sideBarView, "releasePayments", this.releasePayments);
			this.listenTo(this.sideBarView, "setSelectedType", this.setSelectedType);

			//for manual-payment
			this.listenTo(this.sideBarView, "addManualPayment", this.addManualPayment);
			this.listenTo(this.sideBarView, "downloadPayment", this.downloadPayment);//TODO :we have download already. shud i have this ?
			this.listenTo(this.sideBarView, "deletePayment", this.deletePayment);
			this.listenTo(this.sideBarView, "uploadManualPayment", this.uploadManualPayment);
		},

        /**
         *
         */
        updateSearchParams : function(key, value){
			var keyIndex = this.searchfields.indexOf(key);
			if(keyIndex > -1){
				this.searchtext[keyIndex] = value;
			}else{
				this.searchfields.push(key);
				this.searchtext.push( value );
			}
        },

		/**
		 * called from child pages
		 */
        updatePeriod : function(){
			var asOfPeriodId, keyIndex;
			if(!this.selectedPeriod){
				throw Error('Peroid selection required to initiate search.');
			}
			if(this.type !== 'held'){
				this.updateSearchParams('periodId', this.selectedPeriod.get('id'));   
				Backbone.trigger('period:period', this.selectedPeriod);
            }

			if(typeof this.selectedAsOfPeriod === 'object'){
				this.updateSearchParams('AS_OF_PERIOD_ID', this.selectedAsOfPeriod.get('id'));
				Backbone.trigger('period:as-of', this.selectedAsOfPeriod);
			}else if(this.selectedAsOfPeriod === 'latest'){
				// remove AS_OF_PERIOD_ID...latest period selected
				keyIndex = this.searchfields.indexOf('AS_OF_PERIOD_ID');
				if(keyIndex > -1){
					this.searchfields.splice(keyIndex, 1);
					this.searchtext.splice(keyIndex, 1);
				}
			}	
        },

		/**
		 * Backbone model of default period
		 */
		setDefaultPeriod : function(period){
			var cachedPeriod = config.getSessionStorage('selectedPeriod', true);
			if(!cachedPeriod){
				// I'm not interested in default period If I have already
				// selected a period
				this.selectedPeriod = period;
				this.defaultPeriod = period;
			}else{
				this.selectedPeriod = new PeriodModel(cachedPeriod);
				this.defaultPeriod = this.selectedPeriod;
			}
			if(config.tempCache && config.tempCache['selectedAsOfPeriod'] && this.type != "manualPayments"){
				this.selectedAsOfPeriod = config.tempCache['selectedAsOfPeriod'];
			}
			this.updatePPAFlag();            
			this.includePeriodAndType();
			if(config.tempCache && config.tempCache.savedSearch){
				this.startSavedSearchExecution();
			}else{
				// we dont' want to fetch count on going to saved search
				this.fetchAndRenderRecordCount();
			}
		},

        /**
		 *
		 */
		periodChanged : function(selectedObject, isAsOfPeriod){
			if(isAsOfPeriod){
				this.selectedAsOfPeriod = selectedObject;
			}else if(selectedObject.get('type') === 'period'){
				this.selectedPeriod = selectedObject;	
			}
			this.updatePPAFlag();            
			if(this.resultShown){
				this.executeSearch();
			}else if(this.triggerCountFetch) {
				this.fetchAndRenderRecordCount();
			}
		},

		/**
         *
         */
        updatePPAFlag : function(){
			this.ppaEnabled = false;
			if(typeof this.selectedAsOfPeriod === 'object'){
				var isDataExistInSOLR = this.checkHistoricalDataAvaiable();
				if(isDataExistInSOLR === "true"){
					this.ppaEnabled = true;
					console.log("Historical Data Exist...");
				}
			}
			this.togglePPAItems();	
        },

        checkHistoricalDataAvaiable : function(){
        	var self = this; 
        	var constructURL = "/api/v1/periods/isHavingHistoricalData/" 
        	constructURL += this.selectedPeriod.get("id") + "/" + this.selectedAsOfPeriod.get("id");
        	return $.ajax({
	                type: 'GET',
	                url: config.appContext + constructURL,
	                contentType: 'application/json',
	                async: false
	            }).responseText;
        },

		/**
         *
         */
        downloadTemplateUrl : function(){
            return config.appContext + "/api/v1/"+this.pageName+"/downloadTemplate";
        },

        /**
         *
         */
        downloadUrl : function(){
            return config.appContext + "/api/v1/"+this.pageName+"/download/";
        },
        
        /**
         *
         */
        download : function(){
            this.showDownloadForm();
        },

        getAllIndexes : function(arr, val) {
            var indexes = [], i = -1;
            while ((i = arr.indexOf(val, i+1)) != -1){
                indexes.push(i);
            }
            return indexes;
        },

        /**
         *
         */
        showDownloadForm : function(){
            var downloadNameLabel = i18n.get(this.namespace, 'downloadName') || "[Download Name]",
                downloadFormatLabel = i18n.get(this.namespace, 'downloadFormatLabel') || "[Download Format]",
                successMessage = i18n.get(this.namespace, 'downloadSubmitted') || "Sent to Downloads",
                entityName = this.solrEntityMap[this.pageName];

			if(this.type === 'balances'){
				entityName = 'balances';
			}

            var formElements = [
                {
                    type: 'textField',
                    label: downloadNameLabel,
                    required: true,
                    id: 'downloadName',
                    defaultValue: '',    // value to be placed in text field
                    validation: {
                        downloadName : {    // should be same as id
                            required: true,
                            maxLength : 128,
                            cannotContain: "\"'\\/\r\n:{}()[]<>&%#~`!@$^*+=?|,.;"
                        }
                    },
                    className : ''
                }
            ];
            
			this.includePeriodAndType();

            this.downloadView = new DownloadView({
                el : $('#modalContainer'),
                // the reason following line "sucessBtnLabel" is not "downloadBtnLabel" is because, 
                // I'm forcing you to think in terms that user is done with completing form
                // and all is validated and success event triggered for you to do your logic
                sucessBtnLabel: i18n.get(this.namespace, 'downloadButtonLabel') || "[Download]",
                title : i18n.get(this.namespace, 'downloadTitle') || "[Download]",
                cancelBtnLabel: i18n.get(this.namespace, 'cancel') || "[Cancel]",
                formElements : formElements,
                downloadUrl : this.downloadUrl(),
                successMessage: successMessage,
                namespace : this.namespace,
                formTemplate : $('#downloadAndTemplateDownload-tmpl').html(),
                searchfields : this.searchfields,
                searchtext : this.searchtext,

                // for solr download
				entityName : entityName,
                objectType : entityName,
                objectStatus : this.type,
                header : this.header,
                ppaEnabled : this.ppaEnabled
            });
            this.downloadView.render();
            this.listenToOnce(this.downloadView, 'cancel', this.cancelDownload);
            this.listenToOnce(this.downloadView, 'success', this.downloadDone); 
        },

        /**
         *
         */
        downloadDone : function(data){
           this.downloadView.cleanUp();
           this.downloadNotificationIcon();
        },

        /**
         *
         */
        downloadNotificationIcon : function(){
			if(pageUtils && pageUtils.xRootContainer()){
				try{
					pageUtils.xRootContainer().Notifications.unreadCount += 1;
					pageUtils.xRootContainer().Notifications.updateBadge(pageUtils.xRootContainer().Notifications.unreadCount);
				}catch(e){}
			}
        },


        /**
        *
        */
        saveSearch : function(){
            var filterValues = {},
				transformedKey;

            // get filters and their values	
			_.keys(this.formInputValues).forEach(function(key){
				if(!this.formInputValues[key]) return;
				transformedKey = key.replace('Primary', '');
				filterValues[transformedKey] = this.formInputValues[key];
			}, this);
            
            this.joinAmountAndUnitTypes(filterValues);
			this.persistSavedSearchCriteria(filterValues);
			var searchType = this.getSavedSearchHash();

            config.router.navigate("addnewsearch/"+searchType, {trigger: true});
        },

        /**
         *
         */
        persistSavedSearchCriteria : function(filterValues){
			var filterKeys = _.keys(filterValues);
			if(filterKeys.length > 0){
				config['saveSearch'] = {};
				config['saveSearch'].columns = this.tableHeaders;
				config['saveSearch'].filters = filterKeys;
				config['saveSearch'].filterValues = filterValues;
			}
        },

        /**
         *
         */
        getSavedSearchHash : function(){
			var searchType = this.searchTypeMap[this.pageName];
			if(this.type === 'held'){
				searchType = searchType+'_held';
			}else if(this.type === 'manualPayments'){
				searchType = 'manual_payments';
			}else if(this.type === 'balances'){
				searchType = 'payment_balances';
			}
			return searchType;
        },

        /**
         *
         */
        joinAmountAndUnitTypes : function(filterValues){
			var keys = _.keys(filterValues);

			keys.forEach(function(key){
				if(filterValues[key+'-unitType']){
					filterValues[key] = [{
						'name' : filterValues[key], 
						'id' : filterValues[key+'-unitType'],
					}];
					delete filterValues[key+'-unitType'];
				}
			});

			// remove all unitTypes
			keys.forEach(function(key){
				if(key.indexOf('-unitType') > -1){
					delete filterValues[key];
				}
			});
        },

        /**
         *
         */
        fetchAndRenderRecordCount :function(){
			this.$el.find('#releaseCount').empty();
            if(this.resultShown || this.type === 'held'){
                return;
            }

			var message = [],
				objectType = this.header,
				resultsLable = i18n.get(this.namespace, 'resultsLable') || "[Results]",
				asOfLable = i18n.get(this.namespace, 'asOfLable') || "[as of]";

			message.push(this.selectedPeriod.get('name'));
			if(this.ppaEnabled){
				message.push(asOfLable);
				message.push(this.selectedAsOfPeriod.get('name'));
			}
			if(this.type === 'manualPayments'){
				objectType = i18n.get(this.namespace, 'manualPayments') || "[Manual Payments]";			
			}else if(this.type === 'balances'){
				objectType = i18n.get(this.namespace, 'balances') || "[Balances]";			
			}
			message.push(objectType);
			message.push(resultsLable+':');

			if(this.ppaEnabled){
				this.renderTotalCountFromSolr(message);
			}else{
				this.renderTotalCountFromIncent(message);
			}
		},

		/**
         *
         */
        renderTotalCountFromIncent :function(message){
			var self = this,
				formattedNumber,
				countUri = this.pageName;

			if(this.pageName === 'payments'){
				countUri = this.type;
				if(this.type === 'manualPayments'){
					countUri = 'manualpayment';
				} else if(this.type === 'balances'){
					countUri = 'balances';
				}
			}

            $.ajax({
                type: 'GET',
                url: config.appContext + "/api/v1/"+countUri+"/count?searchfield=type&searchfield=periodId&searchtext="+this.type+"&searchtext=" + this.selectedPeriod.get('id'),
                contentType: 'application/json',
                cache: false,
                global : false, // supress spinner
            }).done(function(response, textStatus, jqXHR) {
				//if result count preference setting is "NO", then it will return result as 0, otherwise the count WSO
                if(response && response.count >= 0 ){
                    formattedNumber = userConfig._formatNumber(response.count, userConfig.getPreferences().numberFormat);
                    message.push(formattedNumber);
                    self.$el.find('#releaseCount').html(message.join(' '));
                }else{
					this.resultCountDisabled = true;
                }
            });
        },

		/**
         *
         */
        renderTotalCountFromSolr :function(message){
			var self = this,
				formattedNumber,
				entityName = this.solrEntityMap[this.pageName];

			if(this.type === 'balances'){
				entityName = 'balances';
			}

			var payload = {
				"entityName": entityName,
				"total_count":"",
				"start":0,
				"row":1,
				"filtersMap":{
					"PERIOD_ORDER_NUMBER":[this.selectedPeriod.get('id')],
					"AS_OF_PERIOD_ID":[this.selectedAsOfPeriod.get('id')]
				},
				"fieldList":[
					"PERIOD_ORDER_NUMBER"
				],
				"last":false,
				"cursorMark":"*"
			};

			if(this.pageName !== 'draws' && this.pageName !== 'payments'){
				payload.filtersMap.IS_HELD = ['No'];
			}

            $.ajax({
                type: 'POST',
                url: config.appContext + "/api/advsearch/query",
                contentType: 'application/json',
                cache: false,
                global : false, // supress spinner
                data: JSON.stringify(payload)
            }).done(function(response, textStatus, jqXHR) {
                if(response && response.total_count >= 0 ){
                    formattedNumber = userConfig._formatNumber(response.total_count, userConfig.getPreferences().numberFormat);
                    message.push(formattedNumber);
                    self.$el.find('#releaseCount').html(message.join(' '));
                }else{
					this.resultCountDisabled = true;
                }
            });
        },        

        /**
         *If not READ_WRITE, then remove the flyover menu for relese hold
         */
        enableItemsForWritePermission : function(){
			if(config.heldPermissions && config.heldPermissions.value === 'READ_WRITE'){
				this.$el.find('.release-holds').addClass('enabled').prop('disabled', false);
				this.$el.find('.generate-template').addClass('enabled').prop('disabled', false);
				this.$el.find('.primary-button.download-button').remove();
			}else{
				// remove the release hold button and fly outs
				this.$el.find('.release-holds').remove();
				this.$el.find('.release-holds > .menu-popup-container').remove();
				this.$el.find('.generate-template > .menu-popup-container').remove();
				this.$el.find('.secondary-button.generate-template').remove();
				this.$el.find('.secondary-button.add-comment').remove();
				this.$el.find('.secondary-button.download-button').remove();
			}
        },

        /**
         *Disables the release by selected and generate Template
         */
        disableSelectedReleaseAction : function(){
			this.$el.find('.release-by-selected').addClass('disabled').prop('disabled', true);
			this.$el.find('.generate-template-selected').addClass('disabled').prop('disabled', true);
			this.$el.find('.release-payment-by-selected').addClass('disabled').prop('disabled', true);
        },

        /**
         *Enables the release by selected and generate Template
         */
        enableSelectedReleaseAction : function(){
			this.$el.find('.release-by-selected').removeClass('disabled').prop('disabled', false);
			this.$el.find('.generate-template-selected').removeClass('disabled').prop('disabled', false);
			this.$el.find('.release-payment-by-selected').removeClass('disabled').prop('disabled', false);
        },        

        /*
        *Disables the Release Holds and comments
        */
        disableSidebarActions : function(){
			this.disableSelectedReleaseAction();
			this.disableAddCommentActions();
        },

        /*
        *Enables the Release Holds and comments
        */
        enableSidebarActions : function(){
			this.enableSelectedReleaseAction();
			this.enableAddCommentActions();
        },

        /*
        *Disables the Add comments
        */
        disableAddCommentActions : function(){
			this.$el.find('.add-comment').removeClass('enabled').addClass('disabled').prop('disabled', true);
        },

        /*
        *Enables the Add comments
        */
        enableAddCommentActions : function(){
			this.$el.find('.add-comment').addClass('enabled').removeClass('disabled').prop('disabled', false);
        },

		/**
		 *
		 */
		cleanUp : function(){
			this.undelegateEvents();
			//this.pageMenuView.undelegateEvents(); 
			if(this.tertiaryMenuView) this.tertiaryMenuView.undelegateEvents();
			if(this.tableView) this.tableView.cleanUp();
			if(this.breadCrumView) this.breadCrumView.undelegateEvents();
			if(this.formGroupView) this.formGroupView.cleanUp();
			if(this.sideBarView) this.sideBarView.cleanUp();
			if(this.downloadView) this.downloadView.cleanUp();
			if(this.savedSearchView) this.savedSearchView.cleanUp();
			this.stopListening(this.settingsSavedSearchModel);
		}
	});

	return ResultsView;
});