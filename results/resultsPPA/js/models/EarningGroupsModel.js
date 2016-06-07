define([
  'jquery',
  'underscore',
  'config',
  'backbone',
  'baseModel'
], function($, _, config, Backbone, BaseModel) {

  var EarningGroupsModel = BaseModel.extend({ 

    urlRoot: config.appContext + "/api/v1/typecodes/earninggroups",

    mutators: {
    	
      isSelected: {
        get: function() {
          return this.isSelected;
        },
        set: function(key, value, options, set) {
          this.isSelected = value;
        },
        transient: true
      }
    }, 

    initialize: function(model, options) {
      var defaults;

      // Only do the following for a new model
      if (typeof model === "undefined") {
        defaults = {
          id: null,
          name: "",
          description: ""
        };
      }

      this.set(defaults);
    }

  });

  return EarningGroupsModel;
});
