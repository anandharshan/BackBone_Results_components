define([
  "jquery",
  "baseModel",
  "systemConfig",
  "config",
  "i18n"
], function($, BaseModel, systemConfig, config, i18n) {
  /**
   * A Backbone Model to transform data returned by ItemCode and OrderCode.
   * API URL: /api/v1/orders/searchOrderField
   *
   * @module TransformedOrderAndItemCodeModel
   */
  var TransformedOrderAndItemCodeModel = BaseModel.extend({

    initialize: function(options){
      this.type = options.type;
      this.set('orderItemCode', this.get('itemCode')); // setting name as id
    },

    /**
     * Orverride JSON so data is returned with usable id and name properties
     * for TableView component. 
     *
     */
    toJSON: function() {
      var j = {};
      if(!this.get('id')){
        this.set('id', this.get(this.type)); // here type is orderCode or itemCode
      }
      if(!this.get('name')){
        this.set('name', this.get(this.type));
      }
      j.orderItemCode = this.get('itemCode');
      j.id = this.get(this.type) || this.get('id');
      j.name = this.get(this.type) || this.get('name');
      j[this.type] = this.get(this.type) || this.get(this.type);
      return j;
    }
  });

  return TransformedOrderAndItemCodeModel;
});
