define([
  "jquery",
  "CommissionModel",
  "systemConfig",
  "config",
  "i18n"
], function($, CommissionModel, systemConfig, config, i18n) {
  /**
   * A Backbone Model to hold workflow event items.
   * 
   * Populated by {@link module:CreditsCollection}
   *
   * @module CreditsModel
   */
  var CreditsModel = CommissionModel.extend({

    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = systemConfig.appContext+"/api/credits/v1"
      if(this.id){
        url = url + '/' +this.id;
      }
      return url;
    }
  });

  return CreditsModel;
});
