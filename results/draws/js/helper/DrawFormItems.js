define([
	'underscore',
    'i18n',
    'config',
    'FormInputConfigs'
], function(_, i18n, config, FormInputConfigs){

	var DrawFormItems = {

		resultType : "draws",

		getDrawsSidebarFromGroup : function(namespace, objectType, data, adminDefinedInputs){
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
				var defaultInputs = this.generateDefaultSideBarGroup(true);
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
				id : 'sidebarDrawSearch',
				type: 'formElementGroup',
				label : null,
				formElements : sideBarheldInputs,
				visible : true,
				className: ''
			}];
		},


		/** Manual Payment FORM GROUPS **/		
		getDrawsFromGroups : function(namespace, objectType, data){
			_.extend(this, FormInputConfigs);
			this.data = data;
			this.namespace = namespace;
			this.objectType = objectType;
			this.type = "payment"; 

			return [
				this.generateBasicSeachGroupDraw(true),
				this.generateDrawInformationGroup(false),
			];
		},

		generateDefaultSideBarGroup : function(visible){
			_.extend(this, FormInputConfigs);
			return {
				id : 'basicSearch',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "basicSearch") || '[Basic Search]',
				formElements : [
					this.participantName(),
					this.businessGroup(),
					this.positionName(),
					this.drawName(),
					this.drawType(),
					this.earningGroup()
				],
				visible : visible,
				className: ''
			};
		},


		generateBasicSeachGroupDraw : function(visible){
			_.extend(this, FormInputConfigs);
			return {
				id : 'basicSearch',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "basicSearch") || '[Basic Search]',
				formElements : [
					this.participantName(),
					this.drawName(),
					this.positionName(),
					this.drawType(),
					this.businessGroup(),
					this.earningGroup()
				],
				visible : visible,
				className: ''
			};
		},

		generateDrawInformationGroup : function(visible){
			var required = false;
			return {
				id : 'drawInformation',
				type: 'formElementGroup',
				label : i18n.get(this.namespace, "drawInformation") || '[Draw Information]',
				formElements : [
					// Amount from
					this._amountWithUnitType(false, null, 'eligibleAmountFrom'),
					//fromfinalizedDate
					this._incentiveDate(false, null, 'finalizedDate-fromDate', 'finalizedDate-toDate'),
					// Amount to
					this.toAmountTextInput(false, null, 'eligibleAmountTo'),
					//tofinalizedDate
					this._incentiveDate(false, null, 'finalizedDate-toDate'),
					this._amountWithUnitType(false, null, 'payAmountFrom'),
					this._amountWithUnitType(false, null, 'balanceFrom'),
					this.toAmountTextInput(false, null, 'payAmountTo'),
					this.toAmountTextInput(false, null, 'balanceTo'),
				],
				visible : visible,
				className : 'border'
			};
		},

	}
	return DrawFormItems;
});