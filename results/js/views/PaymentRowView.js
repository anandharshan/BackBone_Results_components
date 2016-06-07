define([
	'jquery',
    'underscore',
    'ReleasedRowView'
], function($, _, ReleasedRowView){

    /**
    * A Backbone View to render payment data row
    *
    * @module PaymentRowView
    */
    var PaymentRowView = ReleasedRowView.extend({

        template : _.template( $('#payment-row-template').html() ),

    });
    
    return PaymentRowView;
});
