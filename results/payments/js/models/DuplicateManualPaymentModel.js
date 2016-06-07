define([
  "jquery",
  "ManualPaymentModel",
  "systemConfig",
  "config",
  "i18n"
], function($, ManualPaymentModel, systemConfig, config, i18n) {
  /**
   * A Backbone Model to hold payment.
   * 
   * Populated by {@link module:PaymentCollection}
   *
   * @module ManualPaymentModel
   */
  var DuplicateManualPaymentModel = ManualPaymentModel.extend({

    rowIndex: function(){
      return this.get("rowIndex");
    },

    employeeId: function(){
      return this.get("participantName");
    },

    itemAmountWithUnitsymbol: function(){
      if(!this.get("amount") && this.get("amount") !== 0) return;
      return this.get("amount") + ' ' + this.get("amountDisplaySymbol");
    },

    toJSON: function() {
      var j = ManualPaymentModel.prototype.toJSON.call(this);
      j.id = this.rowIndex();
      j.row = this.rowIndex();
      j.employeeId = this.employeeId();
      j.itemAmountWithUnitType = this.itemAmountWithUnitsymbol();
      return j;
    }

  });

  return DuplicateManualPaymentModel;
});
