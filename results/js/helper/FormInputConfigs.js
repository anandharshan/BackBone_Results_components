define([
	'underscore',
    'i18n',
    'userConfig',
    'config',
    'GenericResultsCollection',
    'GenericResultsLegacyCollection',
    'orderCodeModel',
    'personModel',
    'LegacyPagedCollection',
    'TransformedOrderAndItemCodeModel',
    'TransformedResultNameModel'
], function(_, i18n, userConfig, config, GenericResultsCollection, GenericResultsLegacyCollection,
		OrderCodeModel, PersonModel, LegacyPagedCollection, TransformedOrderAndItemCodeModel,
		TransformedResultNameModel){

	var FormInputConfigs = {

/** INPUTS **/
		generateOptions : function(id){
			var options = Object.create(null);
			options.id = id;
			options.namespace = this.namespace;
			
			options.label = i18n.get(this.namespace, options.id) || options.id;
			options.placeholder = i18n.get(this.namespace, options.id+'PlaceHolder') || "";
			options.overlayLinkTitle = i18n.get(this.namespace, options.id+'OverLayLink') || '[Select]';
			options.emptyMatchMessage = i18n.get(this.namespace, 'emptyMatchMessage') || "[0 results matching]";
			
			options.maxlength = 128;
			options.className = '';
			options.fieldSize = 'narrow'; // wide
			options.multiSelect = false;
			options.editable = false;

			return options;
		},

		participantName : function(required, validation){
			/** person name **/
			var options = this.generateOptions('participantName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.editable = true;
			return options;
		},

		/** orderCode **/
		orderCode : function(required, validation, otherOptionConfig){
			var prop,
				options = this.generateOptions('orderCode');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.includePeriodIdInSearch = true;
			if(otherOptionConfig){
				for (prop in otherOptionConfig) {
					options[prop] = otherOptionConfig[prop];
				}
			}
			return options;
		},

		/** Position Name **/
		positionName : function(required, validation){
			var options = this.generateOptions('positionName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.editable = true;
			return options;
		},

		/** Item Code **/
		orderItemCode : function(required, validation, otherOptionConfig){
			var prop,
				options = this.generateOptions('orderItemCode');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.includePeriodIdInSearch = true;
			if(otherOptionConfig){
				for (prop in otherOptionConfig) {
					options[prop] = otherOptionConfig[prop];
				}
			}
			return options;
		},

		/**  Business Group **/
		businessGroup : function(required, validation){
			var options = this.generateOptions('businessGroup');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},

		/**  Business Group **/
		drawName : function(required, validation){
			var options = this.generateOptions('drawName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.editable = true;
			return options;
		},

		/** Earning Group **/
		earningGroupName : function(required, validation){
			var options = this.generateOptions('earningGroupName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || this.data['earningGroup'] || [];
			return options;
		},

		/** Processed Period - Single Select**/
		processedPeriod : function(required, validation){
			var options = this.generateOptions('processedPeriod');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || "";

			if(config.selectedHeldTab === 'processedPeriodTab' && config.tempCache){
				options.defaultValue =  config.tempCache['selectedPeriod'] || '';
			}

			options.userOptions = [{id:'', displayLabel:''}];// unselected option
			var cachedPeriods, defaultValue, periodJSON;

			// NOTE: We will always have cachedPeriods since the released result page
			// is loaded first. On released landing page will have period dropdown.
			// Here we store periods retrieved from server and store them in config.tempCache.visiblePeriodsCollection
			// You may want to get the period before calling this method 
			cachedPeriods = (config.tempCache && config.tempCache['visiblePeriodsCollection']) || [];

			cachedPeriods.forEach(function(model){
				periodJSON = model.toJSON();
				periodJSON.displayLabel = model.get('name');
				periodJSON.processedPeriod = model.get('id');
				options.userOptions.push(periodJSON);
			});

			return options;
		},
	
		/**  Result Name or Name **/
		name : function(required, validation){
			var options = this.generateOptions('name');
			options.required = required;
			options.validation = validation;
			options.objectType = this.objectType;
			options.defaultValue = this.data[options.id] || '';
			//option.objectStatus will be used while framing the API to retrieve the result Result Name
			//this.type will have value = release/held
			options.objectStatus = this.type;
			options.editable = true;
			return options;
		},

		/**  Reason Code **/
		reasonCodeName : function(required, validation){
			var options = this.generateOptions('reasonCodeName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},

		/**  Rule Name **/
		ruleName : function(required, validation){
			var options = this.generateOptions('ruleName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.editable = true;
			return options;
		},
	
		/**  Customer Name **/
		customerName : function(required, validation){
			var options = this.generateOptions('customerName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},
		
		/**  Incentive Date - date**/
		incentiveDate : function(required, validation){
			return this._incentiveDate(required, validation, 'incentiveDate');
		},

		/**  Wrapper written for Backward compactibility -- USE THIS NOW ONWARDS**/
		_incentiveDate : function(required, validation, id, toDateEl){
			var options = this.generateOptions(id);
			options.required = required;
			options.validation = validation;
			options.userPref = userConfig.getPreferences();

			options.defaultValue = this.data[options.id] || '';
			options.toDateEl = toDateEl;
			if(id === 'incentiveDate-toDate'){
				this._getDateRange(options, this.data['incentiveDate-fromDate']);
			}
			options.restrictToDate = function(selectedDate){
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
			};
			options.maxDate = null; // we're only interested in setting minDate
			return options;
		},
		
		/**  Geography Name **/
		geoName : function(required, validation){
			var options = this.generateOptions('geoName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},
		
		/**  Product Name **/
		productName : function(required, validation){
			var options = this.generateOptions('productName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},
		
		/**  Amount */
		amount : function(required, validation){
			var options = this.generateOptions('amount');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || '';
			options.editable = true; 
			return options;
		},

		/**  AmountWithUnitTypeInput --> custom include select unity type field **/
		amountWithUnitType : function(required, validation){
			return this._amountWithUnitType(required, validation, 'amountWithUnitType');
		},
		/**  AmountWithUnitTypeInput --> custom include select unity type field **/
		originaAmountWithUnitType : function(required, validation){
			return this._amountWithUnitType(required, validation, 'originaAmountWithUnitType');
		},
		_amountWithUnitType : function(required, validation, id){
			var options = this.generateOptions(id);
			options.required = required;
			options.validation = validation;
			options.editable = true; 

			options.userOptions = [];
			userConfig.getBusinessInfo().unitTypes.forEach(function(unitType){
				options.userOptions.push({
					'_id' : unitType.id,
					'id': String(unitType.value), 
					'name': unitType.name,
					'displayLabel' : unitType.label,
					'amountUnitTypeId' : unitType.value
				});
			});

			options.defaultAmountValue = this.data[id] || '';
			options.defaultUnitType = this.data[id + '-unitType'] || '';
			
			return options;
		},

		/**  Quota Period -- single select **/
		quotaPeriodType : function(required, validation){
			var options = this.generateOptions('quotaPeriodType');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || '';
			return options;
		},

		/**  Quota Period -- single select **/
		drawType : function(required, validation){
			var options = this.generateOptions('drawType');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || '';
			return options;
		},
		
		/**  TODO Est. Release Date -- date **/
		estimatedReleaseDate : function(required, validation, id, toDateEl){
			var options = this.generateOptions(id);
			options.required = required;
			options.validation = validation;
			options.userPref = userConfig.getPreferences();
			options.defaultValue = this.data[options.id] || '';
			options.toDateEl = toDateEl;
			
			// get date from *-fromDate to limit the range
			if(id === 'estReleaseDate-toDate'){
				this._getDateRange(options, this.data['estReleaseDate-fromDate']);
			} else if(id === 'estReleaseDate-toDatePrimary'){
				this._getDateRange(options, this.data['estReleaseDate-fromDatePrimary']);
			}

			if(id.indexOf('fromDate') > -1){
				options.restrictToDate = function(selectedDate){
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
				};
			}
			return options;
		},
		/** used mainly for incentive and est to date **/
		_getDateRange : function(options, fromDate){
			if(!fromDate){
				return;
			}
			var userFormat = userConfig.getPreferences().rawDateFormat;
			userFormat = userFormat.toUpperCase();
			var selectedDateObject = moment(fromDate, userFormat);

			var lastDate = new Date(selectedDateObject.year(), selectedDateObject.month()+1, 0);
			var maxDate = moment(lastDate).format(userFormat);

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
			return moment(date, userFormat).format('MM/DD/YYYY');
        },

		/**  Rate Table Name **/
		rateTableName : function(required, validation){
			var options = this.generateOptions('rateTableName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.editable = true;
			return options;
		},
		
		/** Quota Name **/
		quotaName : function(required, validation){
			var options = this.generateOptions('quotaName');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			options.editable = true;
			return options;
		},

		/**  TODO credit type **/
		creditType : function(required, validation){
			var options = this.generateOptions('creditType');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},

		/**  Actual Release Date -- date **/
		actualReleaseDate : function(required, validation){
			var options = this.generateOptions('actualReleaseDate');
			options.required = required;
			options.validation = validation;
			options.userPref = userConfig.getPreferences();
			options.defaultValue = this.data[options.id] || '';
			return options;
		},

		/**  Finalized -- single select **/
		finalized : function(required, validation, id){
			var options = this.generateOptions('finalized');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || '';

			return options;
		},

		/**  Payment Status -- single select **/
		paymentStatus : function(required, validation){
			var options = this.generateOptions('paymentStatus');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || '';
			
			return options;
		},

		/** Balance Type **/
		balanceType : function(required, validation){
			var options = this.generateOptions('balanceType');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},

		/** Release Group **/
		releaseGroupId : function(required, validation){
			var options = this.generateOptions('releaseGroupId');
			options.required = required;
			options.validation = validation;
			options.defaultValue = this.data[options.id] || [];
			return options;
		},

		/** Release Date **/
		releaseDate : function(required, validation){
			var options = this.generateOptions('releaseDate');
			options.required = required;
			options.validation = validation;
			options.userPref = userConfig.getPreferences();
			options.defaultValue = this.data[options.id] || '';
			return options;
		},

		/** template input **/
		templateFileInput : function(required, validation){
			var options = this.generateOptions('templateFile');
			options.label = i18n.get(this.namespace, 'selectFile') || "[Select File]";
			options.placeholder = i18n.get(this.namespace, 'selectFile') || "[Select File]";
			options.defaultValue = '';
			options.required = required;
			options.validation = validation;
			return options;
		},

		/** Amount To **/
		toAmountTextInput : function(required, validation, id){
			var options = this.generateOptions(id);
			options.label = i18n.get(this.namespace, id) || "[Amount To]";
			options.defaultValue = this.data[id];
			if(Array.isArray(this.data[id]) && this.data[id].length  === 1){
				options.defaultValue = this.data[id][0].value || '';
			}
			options.required = required;
			options.validation = validation;
			options.inputType = 'number';
			return options;
		},

		// Utility methods for instantiation
		ContainsInput : function(options){
			return {
				type: 'containsInput', //containsInput
				placeholder : options.placeholder || '',
				label: options.label,
				required: options.required, // false
				id: options.id,
				defaultValue: options.defaultValue,	
				maxlength: 128,
				fieldSize: options.fieldSize || 'narrow', // 'wide',
				multiSelect: options.multiSelect || false, // 'multi' --> drives placement of close button on narrow
				editable: options.editable || false, 
				className : options.className || '',
				validation : options.validation,
				overlayLinkTitle: options.overlayLinkTitle,
				namespace : options.namespace,
				overlayOpts : { // options for overlay
					collection: options.collection,
					headers: options.headerCols,
					searchKey: options.searchKey || 'name'
				}
			};
		},

		DateInput : function(options){
			options.defaultValue = (this.data.actualReleaseDate) || '';
			return {
				type: 'dateInput', //containsInput
				label: options.label,
				required: options.required, // false
				id: options.id,
				defaultValue: options.defaultValue,	// value to be placed in text field
				maxlength: 128,
				fieldSize: options.fieldSize || 'narrow', // 'wide',
				className : '',
				namespace : options.namespace || this.namespace,
				validation : options.validation,
				userPref : userConfig.getPreferences()
			};
		},

		TextFieldInput : function(options){
			options.defaultValue = (this.data[options.id]) || '';
			return {
				type: 'textField', //containsInput
				label: options.label,
				required: options.required, // false
				id: options.id,
				defaultValue: options.defaultValue,	// value to be placed in text field
				maxlength: 128,
				fieldSize: options.fieldSize || 'narrow', // 'wide',
				multiSelect: false, // 'multi' --> drives placement of close button on narrow
				editable: options.editable || false, 
				className : '',
				validation: options.validation,
				namespace : options.namespace || this.namespace
			};
		},

		FileInput : function(options){
			options.defaultValue = '';
			return {
				type: 'fileInput', //fileInput
				label: options.label,
				required: options.required, // false
				id: options.id,
				defaultValue: options.defaultValue,	// value to be placed in text field
				maxlength: 128,
				fieldSize: options.fieldSize || 'narrow', // 'wide',
				className : '',
				validation : options.validation,
				namespace : options.namespace || this.namespace
			};
		},

		periodSelect : function(required, validation){
			var userOptions = [], defaultValue, openCloseText,
				open = i18n.get("icmadvanced.default", 'periodOpen') || '(Open)',
                closed = i18n.get("icmadvanced.default", 'periodClosed') || '(Closed)';
		
			var cachedPeriods = config.tempCache && config.tempCache['visiblePeriodsCollection'];
			cachedPeriods = cachedPeriods || (this.data.processedPeriod) || [];

			defaultValue = null;
			if(config.tempCache && config.tempCache['selectedPeriod']){
				defaultValue = config.tempCache['selectedPeriod'].get('id');
			}
			cachedPeriods.forEach(function(model){
				if(!defaultValue && model.get('open') === true){
					defaultValue = model.get('id');
				}
				openCloseText = closed;
				if(model.get('open') === true){
					openCloseText = open;
				}
				userOptions.push({
					id: model.get('id'), 
					displayLabel: model.get('name') +' '+ openCloseText
				});
			});
			return {
				type: 'singleSelect', //containsInput
				label: i18n.get(this.namespace, 'period') || "[Period]",
				required: required, // false
				id: 'period',
				defaultValue: defaultValue,	// value to be placed in text field
				maxlength: 128,
				fieldSize: 'narrow', // 'wide',
				multiSelect: false, // 'multi' --> drives placement of close button on narrow
				className : '',
				validation : validation,
				userOptions : userOptions,
				namespace : this.namespace
			};
		},
		
		AS_OF_PERIOD_ID : function(required, validation){
			var userOptions = [], defaultValue, openCloseText,
				open = i18n.get("icmadvanced.default", 'periodOpen') || '(Open)',
                closed = i18n.get("icmadvanced.default", 'periodClosed') || '(Closed)';
		
			var cachedPeriods = config.tempCache && config.tempCache['visiblePeriodsCollection'];
			cachedPeriods = cachedPeriods || (this.data.processedPeriod) || [];

			defaultValue = null;
			if(config.tempCache && config.tempCache['selectedAsOfPeriod']){
				if(typeof config.tempCache['selectedAsOfPeriod'] === 'object'){
					defaultValue = config.tempCache['selectedAsOfPeriod'].get('id');
				}else{
					defaultValue = 'latest';
				}
			}
			cachedPeriods.forEach(function(model){
				if(!defaultValue && model.get('open') === true){
					defaultValue = model.get('id');
				}
				openCloseText = closed;
				if(model.get('open') === true){
					openCloseText = open;
				}
				userOptions.push({
					id: model.get('id'), 
					displayLabel: model.get('name') +' '+ openCloseText
				});
			});
			return {
				type: 'singleSelect', //containsInput
				label: i18n.get(this.namespace, 'AS_OF_PERIOD_ID') || "[AS_OF_PERIOD_ID]",
				required: required, // false
				id: 'AS_OF_PERIOD_ID',
				defaultValue: defaultValue,	// value to be placed in text field
				maxlength: 128,
				fieldSize: 'narrow', // 'wide',
				multiSelect: false, // 'multi' --> drives placement of close button on narrow
				className : '',
				validation : validation,
				userOptions : userOptions,
				namespace : this.namespace
			};
		}		
	};
	FormInputConfigs['estReleaseDate-fromDatePrimary'] = FormInputConfigs.estimatedReleaseDate;
	FormInputConfigs['estReleaseDate-toDatePrimary'] = FormInputConfigs.estimatedReleaseDate;
	FormInputConfigs['estReleaseDate-fromDate'] = FormInputConfigs.estimatedReleaseDate;
	FormInputConfigs['estReleaseDate-toDate'] = FormInputConfigs.estimatedReleaseDate;
	FormInputConfigs['incentiveDate-fromDate'] = FormInputConfigs._incentiveDate;
	FormInputConfigs['incentiveDate-toDate'] = FormInputConfigs._incentiveDate;
	FormInputConfigs['earningGroup'] = FormInputConfigs.earningGroupName;
	FormInputConfigs['downloadName'] = FormInputConfigs.TextFieldInput;
	FormInputConfigs['releasePercent'] = FormInputConfigs.TextFieldInput;

	FormInputConfigs['fromAmountWithUnitType'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['toAmount'] = FormInputConfigs.toAmountTextInput;
	
	// for payments
	FormInputConfigs['bizPaymentFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['itemPaymentFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['bizGroupPaymentFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['paymentFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['paymentTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['bizPaymentTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['bizGroupPaymentTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['itemPaymentTo'] = FormInputConfigs.toAmountTextInput;

	FormInputConfigs['periodBalanceFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['previousBalanceFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['recoveredBalanceFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['remainingBalanceFrom'] = FormInputConfigs._amountWithUnitType;

	FormInputConfigs['periodBalanceTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['previousBalanceTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['recoveredBalanceTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['remainingBalanceTo'] = FormInputConfigs.toAmountTextInput;

	//draws configs
	FormInputConfigs['eligibleAmountFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['eligibleAmountTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['finalizedDate-fromDate'] = FormInputConfigs._incentiveDate;
	FormInputConfigs['finalizedDate-toDate'] = FormInputConfigs._incentiveDate;
	FormInputConfigs['payAmountFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['payAmountTo'] = FormInputConfigs.toAmountTextInput;
	FormInputConfigs['balanceFrom'] = FormInputConfigs._amountWithUnitType;
	FormInputConfigs['balanceTo'] = FormInputConfigs.toAmountTextInput;
	return FormInputConfigs;
});