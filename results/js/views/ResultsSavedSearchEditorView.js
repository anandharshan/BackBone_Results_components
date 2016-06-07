define([
    'jquery',
    'underscore',
    'SavedSearchEditorView',
    'i18n',
    'config',
    'ColumnFilterConfigs',
    'userConfig'
], function($, _, SavedSearchEditorView, i18n, config, ColumnFilterConfigs, userConfig){

    /**
    * A Backbone View to edit Settings and SavedSearch for results tab objects 
    *
    * @module ResultsSavedSearchEditorView
    */
    var ResultsSavedSearchEditorView = SavedSearchEditorView.extend({

		//map property to input type
		filtersInputMap : {
			'participantName' : 'containsInput', 
			'positionName' : 'containsInput', 
			'businessGroup' : 'containsInput', 
			'orderCode' : 'containsInput', 
			'orderItemCode' : 'containsInput', 
			'earningGroup' : 'containsInput', 
			'amountWithUnitType' : 'amountWithUnitType', 
			'productName' : 'containsInput', 
			'customerName' : 'containsInput', 
			'geoName' : 'containsInput', 
			'reasonCodeName' : 'containsInput', 
			'name' : 'containsInput',
			'ruleName' : 'containsInput', 
			'rateTableName' : 'containsInput', 
			'quotaName' : 'containsInput', 
			'quotaPeriodType' : 'singleSelect', 
			'processedPeriod' : 'singleSelect', 
			'estimatedReleaseDate' : 'dateInput', 
			'incentiveDate' : 'dateInput',
			'estReleaseDate-fromDate' : 'dateInput', 
			'estReleaseDate-toDate' : 'dateInput',
			'amount' : 'textField',
			'creditType' : 'containsInput',
			'actualReleaseDate' : 'dateInput',
			'finalized' : 'singleSelect',
			'paymentStatus' : 'singleSelect',
			'balanceType' : 'singleSelect',
			'releaseGroupId' : 'containsInput',
			'releaseDate' : 'dateInput',
			'incentiveDate-fromDate' : 'dateInput',
			'incentiveDate-toDate' : 'dateInput',
			'fromAmountWithUnitType' : 'amountWithUnitType', 
			'toAmount' : 'textField',
			'paymentWithUnitType' : 'amountWithUnitType', 
			'businessPaymentWithUnitType' : 'amountWithUnitType', 
			'businessGroupPaymentWithUnitType' : 'amountWithUnitType', 
			'itemPaymentWithUnitType' : 'amountWithUnitType', 
			'retiredAmountWithUnitType' : 'amountWithUnitType', 
			'owedAmountwithUnitType' : 'amountWithUnitType',
			'previousBalanceFrom' : 'amountWithUnitType',
			'previousBalanceTo' : 'textField',
			'recoveredBalanceFrom' : 'amountWithUnitType',
			'recoveredBalanceTo' : 'textField',
			'totalAmountFrom' : 'amountWithUnitType',
			'totalAmountTo' : 'textField',
			'drawName' : 'containsInput',
			'drawType' :  'singleSelect', 
			'eligibleAmountFrom' : 'amountWithUnitType',
			'finalizedDate-fromDate' : 'dateInput',
			'finalizedDate-toDate' : 'dateInput',
			'eligibleAmountTo' : 'textField',
			'payAmountFrom' : 'amountWithUnitType',
			'payAmountTo' : 'textField',
			'balanceFrom' : 'amountWithUnitType',
			'balanceTo' : 'textField',
			'AS_OF_PERIOD_ID' : 'singleSelect',
			'period' : 'singleSelect'
		}, 

		editableMap : {
			'participantName' : true,
			'positionName' : true,
			'name' : true,
			'ruleName' : true,
			'rateTableName' : true,
			'quotaName' : true,
			'drawName' : true			
		},

		requiredSearchFilters: [
			['participantName'], 
			['orderCode'], 
			['processedPeriod'], 
			['estReleaseDate-fromDate', 'estReleaseDate-toDate']
		],

		/**
         *
         */		
		initialize: function(options){
			this.ppaEnabled = userConfig.getPreferences().isPPAEnabled;       
			this.formatDefaultSearchFilters(options);
			this.formatDefaultSearchViews(options);
			options.inputOptions.filtersInputMap = this.filtersInputMap;

			if(options.type === 'settings'){
				if(options.objectStatus === 'held'){
					options.objectType = options.objectType+'_held_settings';
				}else{
					options.objectType = options.objectType+'_settings';
				}
			} 

			SavedSearchEditorView.prototype.initialize.call(this, options);
			config.saveSearch = null;
		},

		/**
         *
         * Overriding it here so we can manipulate from and to dates
         * fro nim,max and restriction of dates
         */
        renderPage : function(){  
			var fromDate;
			if(this.objectStatus === 'held'){
				var ids = _.pluck(this.model.get('searchFilters'), 'columnId');
				if(ids.indexOf('estReleaseDate-fromDate') > -1 && ids.indexOf('estReleaseDate-toDate') > -1){
					fromDate = _.findWhere(this.model.get('searchFilters'), {'columnId' : 'estReleaseDate-fromDate'});
					fromDate.toDateEl = 'estReleaseDate-toDate';
				}else if(ids.indexOf('incentiveDate-fromDate') > -1 && ids.indexOf('incentiveDate-toDate') > -1){
					fromDate = _.findWhere(this.model.get('searchFilters'), {'columnId' : 'incentiveDate-fromDate'});
					fromDate.toDateEl = 'incentiveDate-toDate';
				}
			}
			this.processDateFilters();

			SavedSearchEditorView.prototype.renderPage.call(this);
			if(this.type !== 'settings'){
				this.$el.find('#savedSearchColumns').hide();
			}
        },

		/**
         *
         */
		formatDefaultSearchFilters : function(options){
			var defaultSearchFilters = [],
				fromValue, toValue;
			this.defaultSearchFilters = [];

			this.filters = ColumnFilterConfigs[options.objectType].filters;
			defaultSearchFilters = ColumnFilterConfigs[options.objectType].defaultSearchFilters;
			if(options.objectStatus === 'held' && options.objectType.indexOf('held') === -1){
				this.filters = ColumnFilterConfigs[options.objectType+'_'+options.objectStatus].filters;
				defaultSearchFilters = ColumnFilterConfigs[options.objectType+'_'+options.objectStatus].defaultSearchFilters;
			}
			
			if(config.saveSearch && config.saveSearch.filters){
				defaultSearchFilters = config.saveSearch.filters;
			}else if(config.getSessionStorage('sideBarFilters')){
				// from settings;
				defaultSearchFilters = config.getSessionStorage('sideBarFilters', true);
				config.removeSessionStorage('sideBarFilters');
			}

			defaultSearchFilters.forEach(function(filter, index){
				fromValue = this.fromValue(filter);
				toValue = this.toValue(filter);
				var opts = {
					"columnId": filter,
					"displayName": i18n.get(options.inputOptions.objectNamespace, filter) || filter,
					"position": index,
					"type": "java.lang.String",
                    "fromValue" : fromValue,
                    "toValue" : toValue,
                    "editable" : this.editableMap[filter] || false
				};
				if(filter.toLowerCase().indexOf('date') > -1){
					opts.type = "java.lang.Date";
				}
				this.defaultSearchFilters.push(opts);
			}, this);
		},
		
		/**
         *
         */
        processDateFilters : function(){
			var inputValues = {};
			this.model.get('searchFilters').forEach(function(filter, index){
				inputValues[filter.columnId] = filter.fromValue;
			}, this);

			this.model.get('searchFilters').forEach(function(filter, index){
				if(filter.columnId === 'incentiveDate-toDate'){
					this._getDateRange(filter, inputValues['incentiveDate-fromDate']);
					filter.maxDate = null;
				}else if(filter.columnId === 'estReleaseDate-toDate'){
					this._getDateRange(filter, inputValues['estReleaseDate-fromDate']);
				}else if(filter.columnId === 'incentiveDate-fromDate'){
					filter.restrictToDate = this.restrictIncentiveToDate;
					filter.toDateEl = 'incentiveDate-toDate';
				}else if(filter.columnId === 'estReleaseDate-fromDate'){
					filter.restrictToDate = this.restrictEstimatedToDate;
					filter.toDateEl = 'estReleaseDate-toDate';
				}

				if(filter.columnId.indexOf('Date') > -1){
					filter.userPref = userConfig.getPreferences();
				}
			}, this);
        },

		/**
         * used mainly for incentive and est to date 
         */
		_getDateRange : function(options, fromDate){
			if(!fromDate){
				return;
			}
			fromDate = this.formatDateForAPI(fromDate);
			var selectedDateArr = fromDate.split("/");
			var maxDate = selectedDateArr[0] + '/' + // month
				new Date(selectedDateArr[2], selectedDateArr[0], 0).getDate() + '/' + //date
				selectedDateArr[2]; // year
			options.maxDate = maxDate;
			options.minDate = fromDate;
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


		/*
		 *
		 */
		restrictEstimatedToDate : function(selectedDate){
			var toDateEl, 
				todate, todateArr, todateObject, 
				selectedDateArr, selectedDateObject,
				minDate = selectedDate,
				lastDate, maxDate;
			// 'this' value in is this function refers to dateInputView
			// since execution of this function will occurr in there
			if(this.data.toDateEl && selectedDate){
				toDateEl = $("#"+this.data.toDateEl);
				todate = toDateEl.datepicker( 'getDate' );// get todate

				var userFormat = userConfig.getPreferences().rawDateFormat;
				userFormat = userFormat.toUpperCase();
				selectedDateObject = moment(selectedDate, userFormat);
				
				if(todate && todate.getTime && selectedDateObject.isAfter(todate.getTime()) ){
					// compare with selected date and if selectedDate <= todate ==> do nothing
					toDateEl.datepicker('setDate', minDate);
				}
				lastDate = new Date(selectedDateObject.year(), selectedDateObject.month()+1, 0);
				maxDate = moment(lastDate).format(userFormat);
				toDateEl.datepicker("option", {"minDate" : minDate, "maxDate" : maxDate});
			}
		},
		/*
		 *
		 */
		restrictIncentiveToDate : function(selectedDate){
			var toDateEl, 
				todate, todateArr, todateObject, 
				selectedDateArr, selectedDateObject,
				minDate = selectedDate;				
			// 'this' value in is this function refers to dateInputView
			// since execution of this function will occurr in there
			if(this.data.toDateEl && selectedDate){
				toDateEl = $("#"+this.data.toDateEl);
				todate = toDateEl.datepicker( 'getDate' );// get todate

				var userFormat = userConfig.getPreferences().rawDateFormat;
				userFormat = userFormat.toUpperCase();
				selectedDateObject = moment(selectedDate, userFormat);
				
				if(todate && todate.getTime && selectedDateObject.isAfter(todate.getTime()) ){
					// compare with selected date and if selectedDate <= todate ==> do nothing
					toDateEl.datepicker('setDate', minDate);
				}
				toDateEl.datepicker("option", {"minDate" : minDate});
			}
		},

		/**
         *
         */
		fromValue : function(filter){
			var element = config.saveSearch && config.saveSearch.filterValues[filter];
			if(!element) {
				return '';
			}else if(typeof element === 'string'){
				return element;
			}else if(Array.isArray(element)){
				return element[0].name;
			}else if(typeof element === 'object') {
				return element.displayLabel;
			}else{
				return '';
			}
		},
		
		/**
         *
         */
		toValue : function(filter){
			var element = config.saveSearch && config.saveSearch.filterValues[filter];
			if(!element) {
				return '';
			}else if(Array.isArray(element)){
				return element[0].id;
			}else if(typeof element === 'object') {
				return element.id;
			}else{
				return '';
			}
		},

		/**
         *
         */
		formatDefaultSearchViews : function(options){
			var defaultSearchViews = [];
			this.defaultSearchViews = [];

			this.columns = ColumnFilterConfigs[options.objectType].columns;
			defaultSearchViews = ColumnFilterConfigs[options.objectType].defaultSearchViews;
			if(options.objectStatus === 'held' && options.objectType.indexOf('held') === -1){
				this.columns = ColumnFilterConfigs[options.objectType+'_'+options.objectStatus].columns;
				defaultSearchViews = ColumnFilterConfigs[options.objectType+'_'+options.objectStatus].defaultSearchViews;
			}
			if(config.saveSearch && config.saveSearch.columns){
				defaultSearchViews = config.saveSearch.columns;
			}

			if(options.objectType === 'payment_balances'){
				if(userConfig.getPreferences().isPPAEnabled){
					var balanceOwedIndex = this.columns.indexOf('balanceOwedWithUnitType');
					if(balanceOwedIndex === -1){
						this.columns.push('balanceOwedWithUnitType');
						defaultSearchViews.push('balanceOwedWithUnitType');
					}
				}
			}

			defaultSearchViews.forEach(function(column, index){
				this.defaultSearchViews.push({
					"columnId": column,
					"displayName": i18n.get(options.inputOptions.objectNamespace, column) || column,
					"position": index
				});
			}, this);
		},

		/**
         *
         */
		save : function(){
			var message;
			this.filterView.populateSelectedData();

			if(this.filterView.collection.length > 10){
				//Validation for restricting no of filter to a max of 10
				message = i18n.get(this.namespace, 'maxNumberofFilterAllowed') || "[Maximum number of filters allowed is ten (10).]";
				$('#errorGutter').html("<span class='errorWarningIcon'></span>"+message).show();
				return;
			}else if(this.filterView.collection.length === 0){
				message = i18n.get(this.namespace, 'filterEmpty') || "[You must select at least one Search Field.]";
				$('#errorGutter').html("<span class='errorWarningIcon'></span>"+message).show();
				return;
			}else{
				$('#errorGutter').empty().hide();
			}

			// perform validation on required filters
			if(this.type === 'savedSearch' && this.objectStatus === 'held'){
				var isValid = false;
				this.requiredSearchFilters.forEach(function(filters){
					if(!isValid){
						isValid = this.validate(filters);
					}
				}, this);

				if(!isValid){
					message = i18n.get(this.namespace, 'savedSearchValidation') || "[Need to add validation message]";
					// show invalid message
					$('#errorGutter').html("<span class='errorWarningIcon'></span>"+message).show();
					return;
				}else{
					$('#errorGutter').empty().hide();
				}
			}
			SavedSearchEditorView.prototype.save.call(this);
		},

		/**
         *
         */
		validate : function(requiredFilters){
			var columnsIds = _.pluck(this.model.get('searchFilters'), 'columnId');
			var intersection = _.intersection(requiredFilters, columnsIds);
			
			var valuePresent = true;
			if(intersection.length ===  requiredFilters.length){
				// required filter present, now check for value
				var searchFilterValues = this.model.get('searchFilters').map(function(filter){
					// columnId is present in intersection and has fromValue -> return 1
					if(intersection.indexOf(filter.columnId) > -1 && filter.fromValue){
						return 1;	// return 1 if value is present
					}else {
						return 0;	// else return 0
					}
				});
				// add values in searchFilterValues array
				var sum = _.reduce(searchFilterValues, function(val, total){ return val + total; }, 0);
				if(sum === intersection.length){
					return true; // satisfies validation requirements
				}
			}
		},

        /**
         *
         */
        cleanUp : function(){
			this.undelegateEvents();
            SavedSearchEditorView.prototype.cleanUp.call(this);
        }
    });
    return ResultsSavedSearchEditorView;
});