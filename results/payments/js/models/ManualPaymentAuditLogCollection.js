define([
  "jquery",
  "PagedCollection",
  "ManualPaymentAuditModel",
  "systemConfig",
  "config"
], function($, PagedCollection, ManualPaymentAuditModel, systemConfig, config) {
  /**
   * A Backbone Model to Manual Payment Audit log.
   * 
   *
   * @module ManualPaymentAuditLogCollection
   */
  var ManualPaymentAuditLogCollection = PagedCollection.extend({

  	outputFormat : "MM/DD/YYYY",

  	model : ManualPaymentAuditModel,

	initialize: function(options){
		this.id = options.id;
		PagedCollection.prototype.initialize.call(this);
	},

	/**
	* A method to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
	*
	* If an id property is defined on this model than the value of id property is appened to the URL.
	*
	* @type {String}
	*/
	url: function(){
		if(!this.id){
			throw new Error("Manual payment audit id required.");
			return;
		}
		return systemConfig.appContext+"/api/v1/manualpayment/" + this.id + '/audit' ;
	}
  });

  return ManualPaymentAuditLogCollection;
});
