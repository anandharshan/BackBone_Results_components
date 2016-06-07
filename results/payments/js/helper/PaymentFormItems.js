define([
	'underscore',
    'i18n',
    'config',
    'FormInputConfigs',
    'UnfinalizedBizGrpCollection',
    'BizGrpWithPaymentsCollection'
], function(_, i18n, config, FormInputConfigs, UnfinalizedBizGrpCollection, BizGrpWithPaymentsCollection){

	var PaymentFormItems = {

		resultType : "payments",

		getPaymentFromGroups : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payment"; 

			return [
				this.generateBasicSeachGroupPayment(true),
				this.generateOrderInformationGroup(false),
				this.generatePaymentInformationGroup(false)
			];
		},
		
		/** Payment basic FORM GROUPS **/		
		generateBasicSeachGroupPayment : function(visible){
			return {
				id : 'basicSearch',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "basicSearch") || '[Basic Search]',
				formElements : [
					this.participantName(),
					//this.earningGroupName(),
					this.positionName(),
					this.orderCode(),
					this.businessGroup(),
					this.orderItemCode()
				],
				visible : visible,
				className: ''
			};
		},

		generateOrderInformationGroup : function(visible){
			return {
				id : 'orderInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "orderInformation") || '[Order Information]',
				formElements : [
					this.customerName(),
					this._incentiveDate(false, null, 'incentiveDate-fromDate', 'incentiveDate-toDate'),
					this.geoName(),
					this._incentiveDate(false, null, 'incentiveDate-toDate'),
					this.productName()
				],
				visible : visible,
				className : 'border'
			};
		},

		generatePaymentInformationGroup : function(visible){
			var required = false;

			return {
				id : 'paymentInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "paymentInformation") || '[Payment Information]',
				formElements : [					
					this._amountWithUnitType(required, null, 'bizPaymentFrom'),
					this._amountWithUnitType(required, null, 'itemPaymentFrom'),
					this.toAmountTextInput(required, null, 'bizPaymentTo'),
					this.toAmountTextInput(required, null, 'itemPaymentTo'),
					this._amountWithUnitType(required, null, 'bizGroupPaymentFrom'),
					this._amountWithUnitType(required, null, 'paymentFrom'),
					this.toAmountTextInput(required, null, 'bizGroupPaymentTo'),
					this.toAmountTextInput(required, null, 'paymentTo'),
					this.finalized(),
					this.paymentStatus()
				],
				visible : visible,
				className : 'border'
			};
		},

		/** Payment Balances FORM GROUPS **/		
		getPaymentBalancesFromGroups : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payment"; 

			return [
				this.generateBasicSeachGroupBalance(true),
				this.generateBalanceInformationGroup(false),
			];
		},

		generateBasicSeachGroupBalance : function(visible){
			return {
				id : 'basicSearch',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "basicSearch") || '[Basic Search]',
				formElements : [
					this.participantName(),
					//this.earningGroup(),
					this.positionName(),
					//this.balanceType(),
					this.businessGroup(),
				],
				visible : visible,
				className: ''
			};
		},
		
		generateBalanceInformationGroup : function(visible){
			var required = false;

			return {
				id : 'balanceInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "balanceInformation") || '[Balance Information]',
				formElements : [
					// balance from
					this._amountWithUnitType(required, null, 'periodBalanceFrom'),
					this._amountWithUnitType(required, null, 'previousBalanceFrom'),				
					this.toAmountTextInput(required, null, 'periodBalanceTo'),
					this.toAmountTextInput(required, null, 'previousBalanceTo'),
					this._amountWithUnitType(required, null, 'recoveredBalanceFrom'),
					this._amountWithUnitType(required, null, 'remainingBalanceFrom'),					
					this.toAmountTextInput(required, null, 'recoveredBalanceTo'),
					this.toAmountTextInput(required, null, 'remainingBalanceTo')
				],
				visible : visible,
				className : 'border'
			};
		},

		getManualPaymentsSidebarFromGroup : function(namespace, objectType, data, adminDefinedInputs){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payment"; 
			
			var sideBarheldInputs = [];
			if(adminDefinedInputs && adminDefinedInputs.length > 0){
				adminDefinedInputs.forEach(function(inputName){
					if(inputName.indexOf('fromDate') > -1){
						var toInputName = inputName.replace('fromDate', 'toDate');
						sideBarheldInputs.push( this[inputName](null, null, inputName, toInputName) );
					}else if(inputName.indexOf('toDate') > -1 || inputName.indexOf('WithUnitType') > -1){
						sideBarheldInputs.push( this[inputName](null, null, inputName) );
					}else{
						sideBarheldInputs.push( this[inputName](null, null, inputName) );
					}
				}, this);
			}else{
				var defaultInputs = this.generateManualPaymentInformationGroup(true);
				sideBarheldInputs = defaultInputs.formElements;
				var second = sideBarheldInputs[1], 
					third = sideBarheldInputs[2];

				sideBarheldInputs[1] = third;
				sideBarheldInputs[2] = second;
				// set all required to false
				_.each(sideBarheldInputs, function(input){
					input.required = false;
				});
			}

			return [{
				id : 'sidebarManualPaymentSearch',
				type: 'formElementGroup',
				label : null,
				formElements : sideBarheldInputs,
				visible : true,
				className: ''
			}];
		},	

		getPaymentsSidebarFromGroup : function(namespace, objectType, data, adminDefinedInputs){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payments"; 

			var sideBarheldInputs = [];
			if(adminDefinedInputs && adminDefinedInputs.length > 0){
				adminDefinedInputs.forEach(function(inputName){
					if(inputName.indexOf('-fromDate') > -1){
						var nameParts = inputName.split('-');
						sideBarheldInputs.push( this[inputName](null, null, inputName, nameParts[0]+'-toDate') );
					}else{
						sideBarheldInputs.push( this[inputName](null, null, inputName) );
					}
				}, this);
			}else{
				sideBarheldInputs = [
					this.participantName(),
					this.positionName(),
					this.businessGroup(),
					this.orderCode(),
					this.orderItemCode(),
					this.earningGroupName()
				];
			}

			return [{
				id : 'sidebarPaymentsSearch',
				type: 'formElementGroup',
				label : null,
				formElements : sideBarheldInputs,
				visible : true,
				className: ''
			}];
		},

		/** Payment Balances FORM GROUPS **/		
		getBalanceResultSidebarFromGroup : function(namespace, objectType, data, adminDefinedInputs){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "balances";  

			var sideBarheldInputs = [];
			if(adminDefinedInputs && adminDefinedInputs.length > 0){
				adminDefinedInputs.forEach(function(inputName){
					sideBarheldInputs.push( this[inputName](null, null, inputName) );
				}, this);
			}else{
				sideBarheldInputs = [
					this.participantName(),
					this.positionName(),
					this.businessGroup(),
					//this.earningGroup()
				]
			}

			return [{
				id : 'sidebarBalancesSearch',
				type: 'formElementGroup',
				label : null,
				formElements : sideBarheldInputs,
				visible : true,
				className: ''
			}];
		},

		/** Payment Balances FORM GROUPS **/		
		getPreviewFinalizeFromGroups : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payment"; 
			var businessGroup = this.businessGroup();
			businessGroup.multiSelect = true;
			businessGroup.defaultValue = [];

			var periodInputConfig = this.periodSelect();

			var userOptions = this.getPeriodForUnfinalize();			
			periodInputConfig.defaultValue = userOptions[0].id;
			periodInputConfig.userOptions = userOptions;

			businessGroup = this.pointToUnfinalizedBizGrpAPI(businessGroup, userOptions[0].id);

			return [
				periodInputConfig,
				businessGroup
			];
		},

		getPaymentReleaseFromGroups : function(namespace, objectType, data, selectedPeriod){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payment"; 			
			var businessGroup = this.businessGroup();
			businessGroup.multiSelect = true;
			businessGroup = this.pointToBizGrpWithPaymentsCollectionAPI(businessGroup, selectedPeriod.get("id"));
			return [
				businessGroup
			];
		},

		/*
         * This method reconfigures Business Group Input object to point to
         * another API where business groups that have payment items linked to them. These business
         * groups are retrieved via separate API (different from api used on form items).
         *
         * Here a custom collection is attached to the object with table headers
         * that would be displayed on corresponsing popup. 
         *  
         */
		pointToBizGrpWithPaymentsCollectionAPI : function(businessGroup, periodId){
			businessGroup.collection = new BizGrpWithPaymentsCollection({
				periodId : periodId,
				namespace : this.namespace
			});

			businessGroup.headerCols = {
				headers : ['select', 'businessGroup'], // i18n label properties
				sortProperties : [false, true],	// sort properties. true== sortable
				sortFields: [null, 'businessGroup'],	// sort field name, because lable(prettyname) can be different
				namespace : businessGroup.namespace
            };
			return businessGroup;
		},

		/*
         * This method reconfigures Business Group Input object to point to
         * another API where business groups that aren't released, finalized
         * and haven't had balances calculated upon them. These business
         * groups are retrieved via separate API (different from api used on form items).
         *
         * Here a custom collection is attached to the object with table headers
         * that would be displayed on corresponsing popup. 
         *  
         */
		pointToUnfinalizedBizGrpAPI : function(businessGroup, periodId){
			businessGroup.collection = new UnfinalizedBizGrpCollection({
				periodId : periodId,
				namespace : this.namespace
			});
			businessGroup.headerCols = {
				headers : ['select', 'businessGroup', 'lastFinalizedPeriodName', 'status'], // i18n label properties
				sortProperties : [false, true, false, false],	// sort properties. true== sortable
				sortFields: [null, 'businessGroup', null, null],	// sort field name, because lable(prettyname) can be different
				namespace : businessGroup.namespace
            };
			return businessGroup;
		},

		/*
         * This method generate array of period objects that would be used
         * in calculate balances or finalize payments on Results -> Payments page.
         *
         * On this popup we are required to show open periods only with first open
         * period as default.
         */
		getPeriodForUnfinalize : function(){
			var cachedPeriods = config.tempCache && config.tempCache['visiblePeriodsCollection'];
			cachedPeriods = cachedPeriods || (this.data.processedPeriod) || [];

			var userOptions = [],
				open = i18n.get("icmadvanced.default", 'periodOpen') || '(Open)';

			cachedPeriods.forEach(function(model){
				if(model.get('open') !== true){
					return;
				}
				userOptions.push({
					id: model.get('id'), 
					displayLabel: model.get('name') +' '+ open
				});
			});
			return userOptions;
		},

		/** Manual Payment FORM GROUPS **/		
		getManualPaymentsFromGroups : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payment"; 

			return [
				this.generateBasicSeachGroupManualPayment(true),
				this.generateManualPaymentInformationGroup(false),
			];
		},

		generateBasicSeachGroupManualPayment : function(visible){
			_.extend(this, FormInputConfigs);
			return {
				id : 'basicSearch',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "basicSearch") || '[Basic Search]',
				formElements : [
					this.participantName(),
					this._incentiveDate(false, null, 'incentiveDate-fromDate', 'incentiveDate-toDate'),
					this.positionName(),
					this._incentiveDate(false, null, 'incentiveDate-toDate'),
					this.businessGroup()
				],
				visible : visible,
				className: ''
			};
		},

		generateManualPaymentInformationGroup : function(visible){
			var required = false;
			return {
				id : 'manualPaymentInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "manualPaymentInformation") || '[Manual Payment Information]',
				formElements : [
					// Amount from
					this._amountWithUnitType(required, null, 'fromAmountWithUnitType'),
					//this.orderCode(),
					// Amount to
					this.toAmountTextInput(required, null, 'toAmount'),
					//this.orderItemCode(),
					this.reasonCodeName(),
					this.earningGroup()
				],
				visible : visible,
				className : 'border'
			};
		},

		generateAddManualPage : function(visible, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			var required = true;
			var participantNameValidation = {
				'participantName' :{
					required: true
				}
			};
			var amountWithUnitTypeValidation = {
				'amountWithUnitType' :{
					required: true
				}
			};
			var incentiveDateValidation = {
				'incentiveDate' :{
					required: true
				}
			};
			var orderCodeConfig = {};
			orderCodeConfig.searchfield = ["periodId"];
			orderCodeConfig.searchtext = [data.periodId];
			//same cofig for OrderItemCode as well
			var participantNameFieldConfig = this.participantName(required, participantNameValidation);
			participantNameFieldConfig.editable = false;
			return [
					participantNameFieldConfig,
					this.amountWithUnitType(required,amountWithUnitTypeValidation),
					this.incentiveDate(required,incentiveDateValidation),
					this.earningGroup(),
					//this.orderCode(false,{},orderCodeConfig),
					//this.orderItemCode(false,{},orderCodeConfig),
					this.reasonCodeName()
				];
		},

		/** Upload Manual payments form **/		
		generateUploadManualPaymentPage : function(namespace, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace; 
						
			var fileInpuValidation = {
				'templateFile' :{
					required: true
				}
			};
			return [
				this.templateFileInput(true, fileInpuValidation)
			];
		},
	}
	return PaymentFormItems;
});