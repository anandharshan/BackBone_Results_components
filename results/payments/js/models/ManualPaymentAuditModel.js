define([
  "jquery",
  "CommissionModel",
  "systemConfig",
  "config",
  "i18n"
], function($, CommissionModel) {
  /**
   * A Backbone Model to hold manual payment audit information.
   * 
   * Populated by {@link module:PaymentCollection}
   *
   * @module ManualPaymentAuditModel
   */
  var ManualPaymentAuditModel = CommissionModel.extend({

	initialize: function(){
		CommissionModel.prototype.initialize.call(this);
		this.outputFormat += ', h:mm a z';
	},

	toJSON: function() {
		this.formatDates(); // in commission model
		var j = _(this.attributes).clone();
		return j;
    }
  });
  return ManualPaymentAuditModel;
});
