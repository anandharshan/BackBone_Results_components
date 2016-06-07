define([
  "jquery",
  "CommissionModel",
  "systemConfig",
  "config",
  "i18n"
], function($, CommissionModel, systemConfig, config, i18n) {
  /**
   * A Backbone Model to hold payment.
   * 
   * Populated by {@link module:PaymentCollection}
   *
   * @module ManualPaymentModel
   */
  var DrawModel = CommissionModel.extend({

    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = systemConfig.appContext+"/v1/api/draws"
      if(this.id){
        url = url + '/' +this.id;
      }
      return url;
    },

    format : function(unityType){
      if(unityType === 'PERCENT'){
        return "%";
      }
      return " "+unityType;
    },

    eligibleAmountWithUnitType : function(){
      if(!this.get("projectedAmount") && this.get("projectedAmount") !== 0) return;
      return  this.formatNumber(this.get("projectedAmount"), this.get("drawUnitTypeId")) + this.format(config.unitTypeObject[ this.get("drawUnitTypeId") ]);
    },
    payAmountWithUnitType : function(){
      if(!this.get("payAmount") && this.get("payAmount") !== 0) return;
      return  this.formatNumber(this.get("payAmount"), this.get("drawUnitTypeId") ) + this.format(config.unitTypeObject[ this.get("drawUnitTypeId") ]);
    },

    balanceWithUnitType : function(){
      if(!this.get("balance") && this.get("balance") !== 0) return;
      return  this.formatNumber(this.get("balance"), this.get("drawUnitTypeId") ) + this.format(config.unitTypeObject[ this.get("drawUnitTypeId") ]);
    },

    toJSON: function() {
      if(this.get("BALANCE") || this.get("BALANCE") === 0){
        this.set("balance", this.get("BALANCE"));
      }
      if(this.get("BALANCE_UNIT_TYPE_DISPLAY")){
        this.set("drawUnitTypeId", this.get("BALANCE_UNIT_TYPE_DISPLAY"));
      }
      var j = CommissionModel.prototype.toJSON.call(this);

      j.eligibleAmountWithUnitType = this.eligibleAmountWithUnitType();
      j.payAmountWithUnitType = this.payAmountWithUnitType();
      j.balanceWithUnitType = this.balanceWithUnitType();
      if(this.get('name')){
        j.drawName = this.get('name');
      }

      if(this.get('personName')){
        j.participantName = this.get('personName');
      }
      return j;
    }

  });

  return DrawModel;
});
