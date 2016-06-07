define([
    "jquery",
    'underscore'
], function($, _) {
	
	/*
	 * 1. Add entry in main.js     SolrUITest : 'results/js/helper/SolrUITest',
	 * 2. Copy runUITest method in ResultView.js. (end of this file).
	 *
	 */
	var SolrUITest = {

		init : function(parent){

			var pages =['commissions', 'commissions_held', 
						'credit', 'credit_held',
						'bonus', 'bonus_held',
						'manual_payments', 'payments', 'payment_balances'
						];
			var collection = parent.dataCollection;
			if(collection.length === 0) {
				console.log("No data.");
			}
			var model = collection.at(0);
			var json = model.toJSON();
			
			var self = this,
				counter = 0,
				pageName = parent.pageName;

			if(parent.type === 'held'){
				pageName = pageName+'_held';
			}
//console.log(pageName, this[pageName].filters, json);
			var keys = this[pageName].filters;

			// foreach key
			var interval = setInterval(function(){
				self.runSearch(counter, keys[counter], parent, model);
				counter++;
				if(counter >= keys.length){
					clearInterval(interval);
				}
			}, 5000);
		},

		runSearch : function(counter, key, parent, model){
			//parent.formInputValues = {};// add to formInputValue
			var value = model.get(key);
			if(!value) {
				console.log(counter, " VALUE NOT PRESENT FOR ", key);
				return;
			}else{
				//console.log('processing ', key, value)
			}
			//parent.formInputValues[key] = value;
			parent.searchfields = [key];
			parent.searchtext = [value];
			parent.displaytext[value];
			parent.updateSearchResults(); // trigger search

			// wait for data
			setTimeout(function(){
				var newmodel = parent.dataCollection.at(0);
				console.log(counter, " === ", key, (value == newmodel.get(key)), value, newmodel.get(key));
			}, 2000);
			// compare data all returned results should have matchig value as filter
		},

		/**
		 * Following method is to be copied into ResultView.js
		 * and executed from ResultView.postRenderTableTask method
		 */
		runUITest : function(){
			var parent = this;
			if(!this.uiTestAppLoaded){
				requirejs(["SolrUITest"], function(SolrUITest) {
					SolrUITest.init(parent);
					parent.uiTestAppLoaded = true;
				});
			} 
		},




		// fitlers and columns for released commission
		commissions : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 'earningGroup', 
				'amountWithUnitType', 'productName', 'customerName', 'geoName', 'reasonCodeName', 'name',
				'ruleName', 'rateTableName', 'quotaName', 'quotaPeriodType', 'estimatedReleaseDate', 'incentiveDate'
			], // 18 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'rateWithUnitType', 'held', 'businessGroup', 
				'earningGroup', 'ruleName', 'quotaPeriodType', 'paymentFX',
				'creditAmountWithUnitType', 'createdDate', 'releaseDate', 'creditApplied',
				'attainmentValue', 'estimatedReleaseDate', 'incentiveDate',
				'measureValue', 'periodName', 'quotaName', 'rateTableName',
				'rateTableTier', 'rollingAttainmentValue', 'rollingMeasureValue', 'source'
			], // 26 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 'earningGroup'],
			
			defaultSearchViews : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'rateWithUnitType', 'held',
				'earningGroup', 'ruleName', 'quotaPeriodType', 'paymentFX',
				'creditAmountWithUnitType', 'createdDate'
			],
		},

		// fitlers and columns for held commission
		commissions_held : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate',
				'originaAmountWithUnitType', 'productName', 'customerName', 'geoName',
				'reasonCodeName', 'name', 'ruleName', 'rateTableName', 'quotaName', 
				'quotaPeriodType', 'positionName', 'businessGroup', 'earningGroup'
			], // 19 items

			// array to determine what to show in column section. Null = All
			columns : [
				'reasonCodeName', 'name', 'participantName','positionName',
                'originaAmountWithUnitType', 'releaseAmountWithUnitType', 'heldAmountWithUnitType',
                'orderCode','orderItemCode', 'rateWithUnitType',
                'held', 'earningGroup', 'ruleName','paymentFX', 'creditAmountWithUnitType', 
                'releaseDate', 'creditApplied', 'attainmentValue', 'businessGroup',
				'estimatedReleaseDate', 'incentiveDate', 'measureValue', 'quotaName', 
				'rateTableName', 'rateTableTier', 'rollingAttainmentValue', 
				'rollingMeasureValue', 'createdDate'
			], // 28 items

			defaultSearchFilters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate'],
			
			defaultSearchViews : [
				'reasonCodeName', 'name', 'participantName','positionName',
                'originaAmountWithUnitType', 'releaseAmountWithUnitType', 'heldAmountWithUnitType',
                'orderCode','orderItemCode', 'rateWithUnitType',
                'held', 'earningGroup', 'ruleName','paymentFX', 'creditAmountWithUnitType'
			],
		},

		// fitlers and columns for released credits
		credit : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode',
				'creditType', 'amountWithUnitType', 'productName', 'customerName', 
				'geoName', 'reasonCodeName', 'name', 'ruleName', 'incentiveDate', 'estimatedReleaseDate'
			], // 15 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'reasonCodeName', 'ruleName', 'createdDate', 'releaseDate', 
				'businessGroup', 'estimatedReleaseDate', 'incentiveDate',
				'periodName'
			], // 16 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 'creditType'],
			
			defaultSearchViews : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'reasonCodeName', 'ruleName', 'createdDate'
			],
		},

		credit_held : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate',
				'amountWithUnitType', 'creditType', 'productName', 'customerName', 'geoName',
				'reasonCodeName', 'name', 'ruleName', 'positionName', 'businessGroup'
			], // 16 items

			// array to determine what to show in column section. Null = All
			columns : [
				'reasonCodeName', 'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'ruleName', 'createdDate', 'releaseDate', 
				'businessGroup', 'estimatedReleaseDate', 'incentiveDate',
			], // 15 items

			defaultSearchFilters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate'],
			
			defaultSearchViews : [
				'reasonCodeName', 'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'ruleName'
			],
		},

		// fitlers and columns for released bonuses
		bonus : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 
				'earningGroup', 'amountWithUnitType', 'productName', 'customerName', 'geoName', 
				'reasonCodeName', 'name', 'ruleName', 'estimatedReleaseDate', 'incentiveDate', 
				'releaseDate'
			], // 16 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'earningGroup',
				'ruleName', 'createdDate', 'releaseDate', 
				'businessGroup', 'estimatedReleaseDate', 'incentiveDate',
				'periodName', 'reasonCodeName', 'inputType'
			], // 17 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 'earningGroup'],
			
			defaultSearchViews : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'earningGroup',
				'ruleName', 'createdDate'
			],
		},

		bonus_held : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate',
				'amountWithUnitType', 'productName', 'customerName', 'geoName',
				'reasonCodeName', 'name', 'ruleName', 'positionName', 'businessGroup', 'earningGroup'
			], 

			// array to determine what to show in column section. Null = All
			columns : [
				'reasonCodeName', 'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'earningGroup', 'ruleName', 
				'createdDate', 'releaseDate', 'businessGroup', 'estimatedReleaseDate', 
				'incentiveDate', 'inputType'
				
			], 

			defaultSearchFilters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate'],
			
			defaultSearchViews : [
				'reasonCodeName', 'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'earningGroup', 'ruleName', 'createdDate'
			],
		},

		manual_payments : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'orderCode', 'orderItemCode', 'reasonCodeName', 
				'earningGroup', 'fromAmountWithUnitType', 'toAmount',
				'incentiveDate-fromDate','incentiveDate-toDate', 'positionName', 'businessGroup',
			], //9items

			// array to determine what to show in column section. Null = All
			columns : [
				'participantName', 'orderCode', 'orderItemCode', 'itemAmountWithUnitType', 
				'earningGroup', 'positionName', 'businessGroup', 'incentiveDate',
				'reasonCodeName'
			], //9 items

			defaultSearchFilters : [
				'participantName', 'orderCode', 'orderItemCode', 'reasonCodeName',  
				'earningGroup', 'fromAmountWithUnitType', 'toAmount',
				'incentiveDate-fromDate','incentiveDate-toDate'
			],
			
			defaultSearchViews : [
				'participantName', 'orderCode', 'orderItemCode', 
				'itemAmountWithUnitType', 'earningGroup'
			],
		},

		payments : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 
				'orderCode', 'orderItemCode', 'earningGroup', 'paymentStatus',
				'finalized', 'productName', 'customerName', 'geoName','incentiveDate', 
				'paymentFrom', 'paymentTo',
				'bizPaymentFrom', 'bizPaymentTo',
				'bizGroupPaymentFrom', 'bizGroupPaymentTo',
				'itemPaymentFrom', 'itemPaymentTo'
			],

			// array to determine what to show in column section. Null = All
			columns : [
				"status", "finalized", "paymentType", "participantName",
				"orderCode", "orderItemCode", "itemAmountWithUnitType", "creditName",
				"earningGroup", "drawBalanceWithUnitType", "paymentBalanceWithUnitType",
				"paymentWithUnitType", "paymentFX", "negativePaymentWithUnitType",
				"itemPaymentWithUnitType", "itemPaymentFXRate",
				"businessGroupPaymentWithUnitType", "businessGroupFXRate",
				"businessPaymentWithUnitType", "businessFXRate", "customerName",
				"productName", "incentiveDate", "positionName", "businessGroupName", "geoName"
			], 

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 
				'orderCode', 'orderItemCode', 'earningGroup'
			],

			defaultSearchViews : [
				"status", "finalized", "paymentType", "participantName",
				"orderCode", "orderItemCode", "itemAmountWithUnitType", "creditName",
				"earningGroup", "drawBalanceWithUnitType", "paymentBalanceWithUnitType",
				"paymentWithUnitType", "paymentFX", "negativePaymentWithUnitType",
				"itemPaymentWithUnitType", "itemPaymentFXRate",
				"businessGroupPaymentWithUnitType", "businessGroupFXRate",
				"businessPaymentWithUnitType", "businessFXRate", "customerName",
				"productName", "incentiveDate", "positionName", "businessGroupName", "geoName"
			],
		},

		payment_balances : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'businessGroup', 'balanceType', //'earningGroup',
				'fromAmountWithUnitType', 'toAmount',
				'retiredAmount', 'retiredAmountTo',
				'owedAmount', 'owedAmountTo',
				'prevAmount', 'prevAmountTo',
				'totalAmount', 'totalAmountTo'				
			], // 

			// array to determine what to show in column section. Null = All
			columns : [
				'participantName', 'balanceType', //'earningGroup',
				'amountWithUnitType', 'prevBalanceWithUnitType', 
				'recoveredBalanceWithUnitType', 'totalBalanceWithUnitType', 'createdDate'
			], // 

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup' ], //, 'earningGroup'
			
			defaultSearchViews : [
				'participantName', 'positionName', 'balanceType', //'earningGroup',
				'amountWithUnitType', 'prevBalanceWithUnitType', 
				'recoveredBalanceWithUnitType', 'totalBalanceWithUnitType'
			],
		},
	};
	return SolrUITest;
});