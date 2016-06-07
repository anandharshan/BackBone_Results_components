define([
	'jquery',
    'underscore',
    'backbone',
    'i18n',
    'pageUtils'
], function($, _, Backbone, i18n, pageUtils){

    /**
    * A Backbone View to render page menu..ternary Nav Menu
    *
    * @module PageMenuView
    */
    var PageMenuView = Backbone.View.extend({

        template : "<div class='helpmenu'>Menu Item</div>",

        events :{
            "click .helpmenu": "emitClickEventOnHelpmenu"
        },

        initialize: function(){
            this.render();
        },

        render : function(){
            this.$el.html(this.template);
        },

        emitClickEventOnHelpmenu : function(e){
            var target = $(e.currentTarget);
            this.trigger('click', target);
        }
    });
    
    return PageMenuView;
});
