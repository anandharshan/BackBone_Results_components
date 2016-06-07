define([], function(){
	var ColumnFilterConfigs = {
		// fitlers and columns for released commission
		commissions : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 
				'orderCode', 'orderItemCode', 'earningGroup', 
				'amountWithUnitType', 'productName', 'customerName', 
				'geoName', 'reasonCodeName', 'name',
				'ruleName', 'rateTableName', 'quotaName', 'quotaPeriodType', 
				'estimatedReleaseDate', 'incentiveDate-fromDate','incentiveDate-toDate'
			], // 18 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'rateWithUnitType', 'rateTableName',
				'quotaName', 'quotaPeriodType', 'creditAmountWithUnitType', 'incentiveDate', 
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 
				'measureValue', 'rollingMeasureValue', 
				'attainmentValue', 'rollingAttainmentValue',
				'held', 'earningGroup', 'businessGroup', 
				'ruleName',  'paymentFX', 'periodName', 'source',
				'createdDate', 'rateTableTier', 'creditApplied'
			], // 31 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 'earningGroup'],
			
			defaultSearchViews : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'rateWithUnitType', 'held',
				'earningGroup', 'ruleName', 'quotaPeriodType', 'paymentFX',
				'creditAmountWithUnitType', 'createdDate'
			],

			download : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'rateWithUnitType', 'rateTableName',
				'quotaName', 'quotaPeriodType', 'creditAmountWithUnitType', 'incentiveDate', 
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 
				'measureValue', 'rollingMeasureValue', 
				'attainmentValue', 'rollingAttainmentValue',
				'held', 'earningGroup', 'businessGroup', 
				'ruleName',  'paymentFX', 'periodName', 'source',
				'createdDate', 'rateTableTier', 'creditApplied'
			] // 31 items
		},

		// fitlers and columns for held commission
		commissions_held : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate',
				'originaAmountWithUnitType', 'productName', 'customerName', 'geoName',
				'reasonCodeName', 'name', 'ruleName', 'rateTableName', 'quotaName', 
				'quotaPeriodType', 'positionName', 'businessGroup', 'earningGroup',
				'incentiveDate-fromDate','incentiveDate-toDate'
			], // 19 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName','positionName','originaAmountWithUnitType', 
				'releaseAmountWithUnitType','heldAmountWithUnitType',
                'orderCode','orderItemCode', 'rateWithUnitType','rateTableName', 
                'quotaName', 'businessGroup', 'incentiveDate',
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate','releaseDate',
				'measureValue', 'rollingMeasureValue', 'attainmentValue', 'rollingAttainmentValue',
                'held', 'earningGroup', 'ruleName', 'reasonCodeName', 
                'createdDate', 'rateTableTier', 'creditApplied', 
                'paymentFX', 'creditAmountWithUnitType' // both not in download
			], // 31 items

			defaultSearchFilters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate'],
			
			defaultSearchViews : [
				'reasonCodeName', 'name', 'participantName','positionName',
                'originaAmountWithUnitType', 'releaseAmountWithUnitType', 'heldAmountWithUnitType',
                'orderCode','orderItemCode', 'rateWithUnitType',
                'held', 'earningGroup', 'ruleName','paymentFX', 'creditAmountWithUnitType'
			],

			download : [
				'name', 'participantName','positionName','originaAmountWithUnitType', 
				'releaseAmountWithUnitType','heldAmountWithUnitType',
                'orderCode','orderItemCode', 'rateWithUnitType','rateTableName', 
                'quotaName', 'businessGroup', 'incentiveDate',
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate','releaseDate',
				'measureValue', 'rollingMeasureValue', 'attainmentValue', 'rollingAttainmentValue',
                'held', 'earningGroup', 'ruleName', 'reasonCodeName', 
                'createdDate', 'rateTableTier', 'creditApplied'
			]
		},

		// fitlers and columns for released credits
		credit : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode',
				'creditType', 'amountWithUnitType', 'productName', 'customerName', 
				'geoName', 'reasonCodeName', 'name', 'ruleName', 
				'incentiveDate-fromDate','incentiveDate-toDate','estimatedReleaseDate'
			], // 15 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'reasonCodeName', 'ruleName', 'incentiveDate',
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 
				'businessGroup', 'periodName', 'createdDate',
			], // 19 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 'creditType'],
			
			defaultSearchViews : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'reasonCodeName', 'ruleName', 'createdDate'
			],

			download : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'reasonCodeName', 'ruleName', 'incentiveDate',
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 
				'businessGroup', 'periodName', 'createdDate',
			], // 19 items
		},

		credit_held : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate',
				'amountWithUnitType', 'creditType', 'productName', 'customerName', 'geoName',
				'reasonCodeName', 'name', 'ruleName', 'positionName', 'businessGroup',
				'incentiveDate-fromDate','incentiveDate-toDate'
			], // 16 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held', 'reasonCodeName', 
				'businessGroup', 'incentiveDate',
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'ruleName', 'releaseDate', 'createdDate'
			], // 18 items

			defaultSearchFilters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate'],
			
			defaultSearchViews : [
				'reasonCodeName', 'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held',
				'ruleName'
			],

			download : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'creditType', 'held', 'reasonCodeName', 
				'businessGroup', 'incentiveDate',
				'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'ruleName', 'releaseDate', 'createdDate'
			]
		},

		// fitlers and columns for released bonuses
		bonus : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 
				'earningGroup', 'amountWithUnitType', 'productName', 'customerName', 'geoName', 
				'reasonCodeName', 'name', 'ruleName', 'estimatedReleaseDate', 
				'incentiveDate-fromDate','incentiveDate-toDate','releaseDate'
			], // 16 items

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'inputType', 
				'earningGroup', 'businessGroup', 'ruleName', 'reasonCodeName', 
				'incentiveDate', 'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 'periodName', 'createdDate' 
			], // 20 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 'orderCode', 'orderItemCode', 'earningGroup'],
			
			defaultSearchViews : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'earningGroup',
				'ruleName', 'createdDate'
			],

			download : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'inputType', 
				'earningGroup', 'businessGroup', 'ruleName', 'reasonCodeName', 
				'incentiveDate', 'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 'periodName', 'createdDate' 
			]
		},

		bonus_held : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate',
				'amountWithUnitType', 'productName', 'customerName', 'geoName',
				'reasonCodeName', 'name', 'ruleName', 'positionName', 'businessGroup', 'earningGroup',
				'incentiveDate-fromDate','incentiveDate-toDate'
			], 

			// array to determine what to show in column section. Null = All
			columns : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'inputType', 
				'earningGroup', 'businessGroup', 'ruleName', 'reasonCodeName', 
				'incentiveDate',  'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 'createdDate'
			], //19 items

			defaultSearchFilters : [
				'participantName', 'orderCode', 'orderItemCode', 
				'processedPeriod', 'estReleaseDate-fromDate', 'estReleaseDate-toDate'],
			
			defaultSearchViews : [
				'reasonCodeName', 'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'earningGroup', 'ruleName', 'createdDate'
			],

			download : [
				'name', 'participantName', 'positionName', 'amountWithUnitType',
				'orderCode', 'orderItemCode', 'held', 'inputType', 
				'earningGroup', 'businessGroup', 'ruleName', 'reasonCodeName', 
				'incentiveDate',  'productName', 'customerName', 'geoName',
				'estimatedReleaseDate', 'releaseDate', 'periodName', 'createdDate'
			]
		},

		manual_payments : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'reasonCodeName', 
				'earningGroup', 'fromAmountWithUnitType', 'toAmount',
				'incentiveDate-fromDate','incentiveDate-toDate', 'positionName', 'businessGroup',
			], //9items //taken out -- 'orderCode', 'orderItemCode', for now

			// array to determine what to show in column section. Null = All
			columns : [
				'participantName', 'itemAmountWithUnitType', 
				'earningGroup', 'positionName', 'businessGroup', 'incentiveDate',
				'reasonCodeName'
			], //9 items //taken out -- 'orderCode', 'orderItemCode', for now

			defaultSearchFilters : [
				'participantName', 'reasonCodeName',  
				'earningGroup', 'fromAmountWithUnitType', 'toAmount',
				'incentiveDate-fromDate','incentiveDate-toDate'
			], //taken out -- 'orderCode', 'orderItemCode', for now
			
			defaultSearchViews : [
				'participantName',
				'itemAmountWithUnitType', 'earningGroup', 'reasonCodeName', 'incentiveDate'
			]//taken out -- 'orderCode', 'orderItemCode', for now
		},

		payments : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'positionName', 'businessGroup', 
				'orderCode', 'orderItemCode',  'paymentStatus', //'earningGroup',
				'finalized', 'productName', 'customerName', 'geoName',
				'incentiveDate-fromDate', 'incentiveDate-toDate',
				'paymentFrom', 'paymentTo',
				'bizPaymentFrom', 'bizPaymentTo',
				'bizGroupPaymentFrom', 'bizGroupPaymentTo',
				'itemPaymentFrom', 'itemPaymentTo'
			],

			// array to determine what to show in column section. Null = All
			columns : [
				"status", "finalized", "paymentType", "participantName",
				"orderCode", "orderItemCode", "itemAmountWithUnitType", "creditName",
				"drawBalanceWithUnitType", "paymentBalanceWithUnitType", //"earningGroup", 
				"paymentWithUnitType", "paymentFXRate", "negativePaymentWithUnitType",
				"itemPaymentWithUnitType", "itemPaymentFXRate",
				"businessGroupPaymentWithUnitType", "businessGroupFXRate",
				"businessPaymentWithUnitType", "businessFXRate", "customerName",
				"productName", "incentiveDate", "positionName", "businessGroup", 
				"geoName","commissionResultName", "bonusResultName", "drawName",
				"drawPaymentWithUnitType"
			], // 29 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup', 
				'orderCode', 'orderItemCode' //'earningGroup'
			],

			defaultSearchViews : [
				"status", "finalized", "paymentType", "participantName",
				"orderCode", "orderItemCode", "itemAmountWithUnitType", "creditName",
				"drawBalanceWithUnitType", "paymentBalanceWithUnitType", //"earningGroup", 
				"paymentWithUnitType", "paymentFXRate", "negativePaymentWithUnitType",
				"itemPaymentWithUnitType", "itemPaymentFXRate",
				"businessGroupPaymentWithUnitType", "businessGroupFXRate",
				"businessPaymentWithUnitType", "businessFXRate", "customerName",
				"productName", "incentiveDate", "positionName", "businessGroup", 
				"geoName","commissionResultName", "bonusResultName", "drawName",
				"drawPaymentWithUnitType"
			], // 27 items

			download : [
				"status", "participantName",
				//employee id missing
				"positionName", "paymentWithUnitType","negativePaymentWithUnitType",
				"commissionResultName", "bonusResultName", "drawName",
				"orderCode", "orderItemCode", "businessGroup", 
				"periodName", "finalized",
				"businessPaymentWithUnitType", "businessFXRate",
				"businessGroupPaymentWithUnitType", "businessGroupFXRate",
				"paymentFXRate",
				"paymentBalanceWithUnitType", "itemPaymentFXRate",
				"customerName", "productName", "geoName", "incentiveDate", 
				"paymentType", "drawBalanceWithUnitType",
				"createdDate"
			] 
		},

		payment_balances : {
			// array to determine what to show in filter section. Null = All
			filters : [
				'participantName', 'businessGroup', //'balanceType', //'earningGroup',
				'periodBalanceFrom', 'periodBalanceTo',
				'previousBalanceFrom', 'previousBalanceTo',
				'recoveredBalanceFrom', 'recoveredBalanceTo',
				'remainingBalanceFrom', 'remainingBalanceTo', 'positionName'			
			], // 11 items

			// array to determine what to show in column section. Null = All
			columns : [
				'participantName', 'positionName', 'businessGroup', 'balanceType',  //'earningGroup',
				'remainingBalanceWithUnitType', 'periodBalanceWithUnitType', 
				'recoveredBalanceWithUnitType', 'prevBalanceWithUnitType', 'createdDate'
				//'balanceOwedWithUnitType'
			], // 10 items

			defaultSearchFilters : ['participantName', 'positionName', 'businessGroup' ], //, 'earningGroup'
			
			defaultSearchViews : [
				'participantName', 'positionName', 'balanceType', //'earningGroup',
				'periodBalanceWithUnitType', 'prevBalanceWithUnitType', 
				'recoveredBalanceWithUnitType', 'remainingBalanceWithUnitType'
			],

			download : [
				'participantName', 'positionName', 'businessGroup', 'balanceType',  //'earningGroup',
				'remainingBalanceWithUnitType', 'periodBalanceWithUnitType', 
				'recoveredBalanceWithUnitType', 'prevBalanceWithUnitType', 'createdDate'
			]
		},

		draw : {
			filters : [
				'participantName', 'drawName', 'positionName', 'drawType',
				'businessGroup', 'earningGroup',
				'eligibleAmountFrom', 'eligibleAmountTo',
				'finalizedDate-fromDate', 'finalizedDate-toDate',
				'payAmountFrom', 'payAmountTo', 'balanceFrom', 'balanceTo'		
			], // 12 items

			// array to determine what to show in column section. Null = All
			columns : [		
				'drawName', 'participantName', 'positionName', 'drawType', 
				'eligibleAmountWithUnitType', 'payAmountWithUnitType', 'balanceWithUnitType',
				'finalizedDate', 'businessGroup', 'periodName', 'earningGroup',
				'createdDate'
			], // 12 items

			defaultSearchFilters : ['participantName', 'drawName', 
				'positionName', 'drawType', 'businessGroup', 'earningGroup' 
			], 
			
			defaultSearchViews : [
				'drawName', 'participantName', 'positionName', 'drawType', 
				'eligibleAmountWithUnitType', 'payAmountWithUnitType', 'balanceWithUnitType',
				'finalizedDate', 'earningGroup'
			],

			download : [		
				'drawName', 'participantName', 'positionName', 'drawType', 
				'eligibleAmountWithUnitType', 'payAmountWithUnitType', 'balanceWithUnitType',
				'finalizedDate', 'businessGroup', 'periodName', 'earningGroup',
				'createdDate'
			]
		},

		orders : {
			columns : [
				"amount",  "amountUnitTypeId", "assignment", "batchName", "batchType", "customerName", 
				"description",  "discount", "geoName", "incentiveDate", "orderItemCode", "orderCode", 
				"orderDate", "orderTypeId","productName","quantity", "relatedItemCode", "relatedOrderCode", 
				"itemStatus", "statusDate", "createdDate"
			],

			download : [
				"amount",  "amountUnitTypeId", "assignment", "batchName", "batchType", "customerName", 
				"description",  "discount", "geoName", "incentiveDate", "orderItemCode", "orderCode", 
				"orderDate", "orderTypeId","productName","quantity", "relatedItemCode", "relatedOrderCode", 
				"itemStatus", "statusDate", "createdDate"
			]
		}
	};
	ColumnFilterConfigs.commission = ColumnFilterConfigs.commissions;
	ColumnFilterConfigs.commission_held = ColumnFilterConfigs.commissions_held;
	ColumnFilterConfigs.paymentresult = ColumnFilterConfigs.payments;
	ColumnFilterConfigs.payment = ColumnFilterConfigs.payments;
	ColumnFilterConfigs.balances = ColumnFilterConfigs.payment_balances;

	return ColumnFilterConfigs;
});