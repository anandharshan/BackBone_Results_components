define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    'ResultsView'
], function($, _, Backbone, Config, i18n, pageUtils, ResultsView){

    /**
    * A Backbone View to render AdvancedSearch data
    *
    * @module AdvancedSearchView
    */

    var AdvancedSearchView = ResultsView.extend({

        useLatestPeriod: false,

        events :{

        },

        render : function(){
            this.renderPage();
        },

        processMenuEvent : function(target){
            //console.log('processMenuEvent ', target.html());
        }
    });

    return AdvancedSearchView;
});