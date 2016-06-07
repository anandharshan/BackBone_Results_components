define([
  "jquery",
  "baseModel",
  "systemConfig",
  "config",
  "i18n"
], function($, BaseModel, systemConfig, config, i18n) {
  /**
   * A Backbone Model to transform data returned by result name api.
   * API URL: /api/v1/resultNames/...
   * ----->>>>>---THE MODEL IS REUSED IN DRAW NAMES AS WELL.... IMPORTANT<-----------<<<<<<----
   *
   * @module TransformedResultNameModel
   */
  var TransformedResultNameModel = BaseModel.extend({
    initialize: function(){
      this.set('id', this.get('name')); // setting name as id
    },
  });
  return TransformedResultNameModel;
});
