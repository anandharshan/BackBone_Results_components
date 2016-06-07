define([
  'jquery',
  'underscore',
  'config',
  'backbone',
  'baseModel'
], function($, _, config, Backbone, BaseModel) {

    var BusinessGrpModel = BaseModel.extend({

        urlRoot: '../../api/v1/businessGroups',
        isSelected: false,

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
            if (typeof model === "undefined") {
                defaults = {
                    "id": null,
                    "name": null,
                    "description": ""
                };
            }
            this.set(defaults);
        }

    });

    return BusinessGrpModel;
});
