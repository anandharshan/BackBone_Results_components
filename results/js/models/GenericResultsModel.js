define([
  "jquery",
  "baseModel",
  "systemConfig"
], function($, BaseModel, systemConfig) {
  /**
   * A Backbone Model to hold results (credits, commissions, etc.) data.
   * 
   * Populated by {@link module:GenericResultsCollection}
   *
   * @module GenericResultsModel
   */
  var GenericResultsModel = BaseModel.extend({

    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = this.urlRoot;
      if(this.id){
        url = url + '/' +this.id;
      }
      return url;
    }
  });

  return GenericResultsModel;
});
