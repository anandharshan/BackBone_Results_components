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
   * Populated by {@link module:BonusCollection}
   *
   * @module BonusModel
   */
  var BonusModel = CommissionModel.extend({

    inputType_credit : i18n.get('icmadvanced.results', 'Credit') || "[Credit]", //0
    inputType_orderItem : i18n.get('icmadvanced.results', 'OrderItem') || "[Order Item]", //1
    
    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = systemConfig.appContext+"/api/bonuses/v1"
      if(this.id){
        url = url + '/' +this.id;
      }
      return url;
    },

    inputType : function(){
      if(typeof this.get("inputType") === 'undefined') return '';
      return this.get("inputType") === 0 ? this.inputType_credit : this.inputType_orderItem;
    },
            
    toJSON: function() {
      var j = CommissionModel.prototype.toJSON.call(this);
      j.inputType = this.inputType();
      return j;
    }
  });

  return BonusModel;
});
