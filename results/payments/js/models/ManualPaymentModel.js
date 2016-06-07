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
  var ManualPaymentModel = CommissionModel.extend({

    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = systemConfig.appContext+"/api/payments/v1"
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

    itemAmountWithUnitType : function(){
      if(!this.get("amount")) return;
      return this.formatNumber(this.get("amount"), this.get("amountUnitTypeId")) + this.format(config.unitSymbolObject[ this.get("amountUnitTypeId") ]);
    },

    toJSON: function() {
      var j = CommissionModel.prototype.toJSON.call(this);
      j.itemAmountWithUnitType = this.itemAmountWithUnitType();
      return j;
    }

  });

  return ManualPaymentModel;
});
