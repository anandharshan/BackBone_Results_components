
define([
    "PagedCollection",
    "systemConfig",
   	"ManualPaymentModel"
], function(PagedCollection, systemConfig, DuplicateManualPaymentModel) {


    var DuplicateManualPaymentCollection = PagedCollection.extend({

    	 /**
         * A Backbone model representing each object in this collection.
         *
         * @type {Backbone.Model} {@link module:CommissionModel}
         */
        model: DuplicateManualPaymentModel,

        /**
         * An REST API endpoint URL accepting GET method.
         *
         * @type {String}
         */
        url: systemConfig.appContext+"/api/v1/manualpayment/upload/status",


    });
    return DuplicateManualPaymentCollection;

});