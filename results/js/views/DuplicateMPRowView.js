define([
	'jquery',
    'underscore',
    'backbone',
    'i18n',
    'pageUtils'
], function($, _, Backbone, i18n, pageUtils){

    /**
    * A Backbone View to render released data row
    *
    * @module ReleasedRowView
    */
    var DuplicateMPRowView = Backbone.View.extend({

        template : _.template( $('#duplicates-row-template').html() ),

        initialize: function(options){
            this.options = options;
            this.model = options.model;
            this.render();
        },

        render : function(){
            this.$el.html(this.template({
                headers: this.options.headers,
                data : this.model.toJSON()
            }));
        }
    });
    
    return DuplicateMPRowView;
});
