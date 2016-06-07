define([
	'jquery',
    'underscore',
    'ReleasedRowView'
], function($, _, ReleasedRowView){

    /**
    * A Backbone View to render held data row
    *
    * @module HeldRowView
    */
    var HeldRowView = ReleasedRowView.extend({

        template : _.template( $('#held-row-template').html() ),

    });
    
    return HeldRowView;
});
