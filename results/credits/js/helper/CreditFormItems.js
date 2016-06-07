define([
	'underscore',
    'i18n',
    'config',
    'FormInputConfigs'
], function(_, i18n, config, FormInputConfigs){

	var CreditFormItems = {
		resultType : "credits",

		getHeldCreditsSidebarFromGroup : function(namespace, objectType, data, adminDefinedInputs){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "held"; 

			var sideBarheldInputs = [];
			if(adminDefinedInputs && adminDefinedInputs.length > 0){
				adminDefinedInputs.forEach(function(inputName){
					if(inputName === 'estReleaseDate-fromDate'){
						sideBarheldInputs.push( this[inputName](null, null, inputName, 'estReleaseDate-toDate') );
					}else if(inputName === 'incentiveDate-fromDate'){
						sideBarheldInputs.push( this[inputName](null, null, inputName, 'incentiveDate-toDate') );
					}else{
						sideBarheldInputs.push( this[inputName](null, null, inputName) );
					}
				}, this);
			}else{
				var heldInputs = this.getCreditHeldFromGroups(namespace, objectType, data);
				var sideBarheldInputs = _.map(heldInputs.tabFormInputs, function(arr, key){
					return arr;
				});
				sideBarheldInputs = _.flatten(sideBarheldInputs, true);

				// set all required to false
				_.each(sideBarheldInputs, function(input){
					input.required = false;
				});
			}

			return [{
				id : 'sidebarHeldSearch',
				type: 'formElementGroup',
				label : null,
				formElements : sideBarheldInputs,
				visible : true,
				className: ''
			}];
		},	
		
		getReleasedCreditsSidebarFromGroup : function(namespace, objectType, data, adminDefinedInputs){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "release"; 

			var sideBarheldInputs = [];
			if(adminDefinedInputs && adminDefinedInputs.length > 0){
				adminDefinedInputs.forEach(function(inputName){
					if(inputName === 'estReleaseDate-fromDate'){
						sideBarheldInputs.push( this[inputName](null, null, inputName, 'estReleaseDate-toDate') );
					}else if(inputName === 'incentiveDate-fromDate'){
						sideBarheldInputs.push( this[inputName](null, null, inputName, 'incentiveDate-toDate') );
					}else{
						sideBarheldInputs.push( this[inputName](null, null, inputName) );
					}
				}, this);
			}else{
				sideBarheldInputs = [
					this.participantName(),
					this.businessGroup(),
					this.orderCode(),
					this.orderItemCode(),
					this.positionName(),
					this.creditType()
				]
			}

			return [{
				id : 'sidebarSearch',
				type: 'formElementGroup',
				label : null,
				formElements : sideBarheldInputs,
				visible : true,
				className: ''
			}];
		},	

		getCreditReleaseFromGroups : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "release"; 

			return [
				this.generateBasicSeachGroup(true),
				this.generateGeneralResultsGroupRelease(false),
				this.generateOrderInformationRelease(false),
				this.generateCreditInformation(false)
			];
		},

		/** CREDIT RELEASE FORM GROUPS **/		
		generateBasicSeachGroup : function(visible){
			return {
				id : 'basicSearch',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "basicSearch") || '[Basic Search]',
				formElements : [
					this.participantName(),
					this.orderCode(),
					this.positionName(),
					this.orderItemCode(),
					this.businessGroup(),
					this.creditType()
				],
				visible : visible,
				className: ''
			};
		},

		generateGeneralResultsGroupRelease : function(visible){
			return {
				id : 'generalResultInfo',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "generalResultInfo") || '[General Result Information]',
				formElements : [
					this.estimatedReleaseDate(null, null, 'estimatedReleaseDate'),
					this.name(),
					this.reasonCodeName(),
					this.ruleName()
				],
				visible : visible,
				className : 'border'
			};
		},

		generateOrderInformationRelease : function(visible){
			return {
				id : 'orderInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "orderInformation") || '[Order Information]',
				formElements : [
					this.customerName(),
					this._incentiveDate(false, false, 'incentiveDate-fromDate', 'incentiveDate-toDate'),
					this.geoName(),
					this._incentiveDate(false, false, 'incentiveDate-toDate', null),
					this.productName()
				],
				visible : visible,
				className : 'border'
			};
		},

		generateCreditInformation : function(visible){
			return {
				id : 'creditInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "creditInformation") || '[Credit Information]',
				formElements : [
					this.amountWithUnitType(),
				],
				visible : visible,
				className : 'border'
			};
		},

		/** CREDIT HELD FORM GROUPS **/		
		getCreditHeldFromGroups : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "held"; 

			var required = true;
			var fromDateValidation = {
				'estReleaseDate-fromDatePrimary' :{
					required: true,
					cannotContain: '[]\;+"|'
				}
			};
			var toDateValidation = {
				'estReleaseDate-toDatePrimary' :{
					required: true,
					cannotContain: '[]\;+"|'
				}
			};
			var orderCodeValidation = {
				'orderCode' :{
					required: true
				}
			};
			
			var participantNameValidation = {
				'participantName' :{
					required: true
				}
			};
			var processedPeriodInputValidation = {
				'processedPeriod' :{
					required: true
				}
			};
			var tabFormInputs = {
				'erdTab' : [
					this.estimatedReleaseDate(required, fromDateValidation, 'estReleaseDate-fromDatePrimary', 'estReleaseDate-toDatePrimary'), 
					this.estimatedReleaseDate(required, toDateValidation, 'estReleaseDate-toDatePrimary')
				],
				'ordersTab' : [ 
					this.orderCode(required, orderCodeValidation),
					this.orderItemCode()
				],
				'personTab' : [
					this.participantName(required, participantNameValidation)
				],
				'processedPeriodTab':[
					this.processedPeriod(required, processedPeriodInputValidation)
				]
			};

			var hiddenFormInputs = [
				this.generateGeneralResultsGroupHeld(false),
				this.generatePersonInformationGroupHeld(false),
				this.generateOrderInformationHeld(false),
				this.generateCreditInformation(false)
			];

			return {
				'tabFormInputs' : tabFormInputs,
				'hiddenFormInputs' : hiddenFormInputs
			}
		},

		generateGeneralResultsGroupHeld : function(visible){
			return {
				id : 'generalResultInfo',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "generalResultInfo") || '[General Result Information]',
				formElements : [
					this.creditType(),
					this.reasonCodeName(),
					this.estimatedReleaseDate(false, null, 'estReleaseDate-fromDate', 'estReleaseDate-toDate'), 
					this.name(),
					this.estimatedReleaseDate(false, null, 'estReleaseDate-toDate'),				
					this.ruleName(),
					this.processedPeriod()
				],
				visible : visible,
				className : 'border'
			};
		},

		generatePersonInformationGroupHeld : function(visible){
			return {
				id : 'personInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "personInformation") || '[Person Information]',
				formElements : [
					this.businessGroup(),
					this.positionName(),
					this.participantName()
				],
				visible : visible,
				className : 'border'
			};
		},

		generateOrderInformationHeld : function(visible){
			return {
				id : 'orderInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "orderInformation") || '[Order Information]',
				formElements : [
					this.customerName(),
					this.orderCode(),
					this.geoName(),
					this.orderItemCode(),
					this._incentiveDate(false, false, 'incentiveDate-fromDate', 'incentiveDate-toDate'),
					this.productName(),
					this._incentiveDate(false, false, 'incentiveDate-toDate', null)
				],
				visible : visible,
				className : 'border'
			};
		},

		/** Release by template form **/		
		getReleaseBySelectedForm : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "held"; 
			var releaseDateValidation = {
				'releaseDate' :{
					required: true,
					cannotContain: '[]\;+"|'
				}
			};

			return [
				this.releaseDate(true, releaseDateValidation),
				this.releaseGroupId()
			];
		}
	};
	return CreditFormItems;
});