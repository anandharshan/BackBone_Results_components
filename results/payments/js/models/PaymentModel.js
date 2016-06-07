define([
  "jquery",
  "CommissionModel",
  "systemConfig",
  "config",
  "i18n"
], function($, CommissionModel, systemConfig, config, i18n) {
  /**
   * A Backbone Model to hold payment.
   * 
   * Populated by {@link module:PaymentCollection}
   *
   * @module PaymentModel
   */
  var PaymentModel = CommissionModel.extend({

    heldYes : i18n.get('icmadvanced.results', 'yes') || "[Yes]",
    heldNo : i18n.get('icmadvanced.results', 'no') || "[No]",
    pending : i18n.get('icmadvanced.results', 'pending') || '[PENDING]',
    released : i18n.get('icmadvanced.results', 'released') || '[RELEASED]',

    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = systemConfig.appContext+"/api/payments/v1"
      if(this.id){
        url = url + '/' +this.id;
      }
      return url;
    },

    itemAmountWithUnitType : function(){
      if(!this.get("itemAmount") && this.get("itemAmount") !== 0) return;
      return  this.formatNumber(this.get("itemAmount"), this.get("itemAmountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("itemAmountUnitTypeId") ];
    },

    drawBalanceWithUnitType :function(){
      if(!this.get("drawBalances") && this.get("drawBalances") !== 0) return;
      return this.formatNumber(this.get("drawBalances"), this.get("drawBalanceUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("drawBalanceUnitTypeId") ];
    },
  
    paymentBalanceWithUnitType :function(){
      if(!this.get("bcfBalance") && this.get("bcfBalance") !== 0) return;
      return this.formatNumber(this.get("bcfBalance"), this.get("bcfBalanceUnitTypeId") ) + ' ' + config.unitSymbolObject[ this.get("bcfBalanceUnitTypeId") ];
    },

    paymentWithUnitType : function(){
      if(!this.get("payment") && this.get("payment") !== 0) return;
      return this.formatNumber(this.get("payment"), this.get("paymentCurrencyAmountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("paymentCurrencyAmountUnitTypeId") ];
    },

    negativePaymentWithUnitType : function(){
      if(!this.get("paymentCurrencyAmountBkup") && this.get("paymentCurrencyAmountBkup") !== 0) return;
      return this.formatNumber(this.get("paymentCurrencyAmountBkup"), this.get("paymentCurrencyAmountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("paymentCurrencyAmountUnitTypeId") ];
    },

    itemPaymentWithUnitType : function(){
      if(!this.get("itemPaymentAmt") && this.get("itemPaymentAmt") !== 0) return;
      return this.formatNumber(this.get("itemPaymentAmt"), this.get("itemPaymentAmtUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("itemPaymentAmtUnitTypeId") ];
    },

    businessGroupAmountWithUnitType : function(){
      if(!this.get("businessGroupAmount") && this.get("businessGroupAmount") !== 0) return;
      return this.formatNumber(this.get("businessGroupAmount"), this.get("businessGroupAmountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("businessGroupAmountUnitTypeId") ];
    },

    businessPaymentWithUnitType : function(){
      if(!this.get("businessAmount") && this.get("businessAmount") !== 0) return;
      return this.formatNumber(this.get("businessAmount"), this.get("businessAmountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("businessAmountUnitTypeId") ];
    },

    drawPaymentWithUnitType : function(){
      if(!this.get("drawProjectedAmount") && this.get("drawProjectedAmount") !== 0) return;
      return this.formatNumber(this.get("drawProjectedAmount"), this.get("drawBalanceUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("drawBalanceUnitTypeId") ];
    },

    finalized : function(){
      var paymentFlag  = this.get("paymentFlag");
      if(paymentFlag === '0'){
        paymentFlag = this.heldNo;
      }else if(paymentFlag === '1'){
        paymentFlag = this.heldYes;
      }
      this.set("paymentFlag", paymentFlag);
      return this.get("paymentFlag");    
    },

    status : function(){
      var status  = this.get("status");
      if(status === '0'){
        status = this.pending;
      }else if(status === '1'){
        status = this.released;
      }
      this.set("status", status);
      return this.get("status");
    },

    toJSON: function() {
      this.formatDates(); // in comm model
      var j = CommissionModel.prototype.toJSON.call(this);
      j.itemAmountWithUnitType = this.itemAmountWithUnitType();
      j.drawBalanceWithUnitType = this.drawBalanceWithUnitType();
      j.paymentBalanceWithUnitType = this.paymentBalanceWithUnitType();
      j.paymentWithUnitType = this.paymentWithUnitType();
      j.negativePaymentWithUnitType = this.negativePaymentWithUnitType();
      j.itemPaymentWithUnitType = this.itemPaymentWithUnitType();
      j.businessGroupPaymentWithUnitType = this.businessGroupAmountWithUnitType();
      j.businessPaymentWithUnitType = this.businessPaymentWithUnitType();
      j.businessGroupName = this.get('businessGroup');
      j.drawPaymentWithUnitType = this.drawPaymentWithUnitType();

      j.finalized = this.finalized();
      j.status = this.status();
      j.paymentType = this.get('sourceType');

      j.earningGroupName = this.get('earningGroupName');
     
      j.itemPaymentFXRate = this.formatNumber(this.get('itemPaymentConvRate'));
      j.businessFXRate = this.formatNumber(this.get('busConversionRate'));
      j.paymentFXRate = this.formatNumber(this.get('conversionRate'));
      j.businessGroupFXRate = this.formatNumber(this.get('busGroupConvRate'));

      var nameArr;
      if(this.get('bonuses') && this.get('bonuses').length > 0){
        nameArr = _.map(this.get('bonuses'), function(item){
          return item.name;
        });
        j.bonusResultName = nameArr.join('<br>');
      }

      if(this.get('commissions') && this.get('commissions').length > 0){
        nameArr = _.map(this.get('commissions'), function(item){
          return item.name;
        });
        j.commissionResultName = nameArr.join('<br>');
      }

      if(this.get('credits') && this.get('credits').length > 0){
        nameArr = _.map(this.get('credits'), function(item){
          return item.name;
        });
        j.creditName = nameArr.join('<br>');
      }
      //console.log(j);
      return j;
    }

  });

  return PaymentModel;
});
