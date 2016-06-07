define([
  "jquery",
  "backbone",
  "CommissionModel",
  "systemConfig",
  "config",
  "i18n"
], function($, Backbone, CommissionModel, systemConfig, config, i18n) {
  /**
   * A Backbone Model to hold payment balances.
   * 
   * Populated by {@link module:PaymentCollection}
   *
   * @module PaymentBalanceModel
   */
  var PaymentBalanceModel = CommissionModel.extend({

    bcfToIncentive : i18n.get('icmadvanced.results', 'BCF') || "[Incentive]",
    
    ppaBalanceToPriorPeriod : i18n.get('icmadvanced.results', 'PPA_BALANCE') || "[Prior Period]",

    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = systemConfig.appContext+"/api/v1/balances"
      if(this.id){
        url = url + '/' +this.id;
      }
      return url;
    },

    periodBalanceWithUnitType : function(){
      if(!this.get("balance") && this.get("balance") !== 0) return; 
      this.set('periodBalanceWithUnitType', this.formatNumber(this.get("balance"), this.get("unitTypeId")) + ' ' + config.unitSymbolObject[ this.get("unitTypeId") ]);
      return this.get('periodBalanceWithUnitType');
    },

    prevBalanceWithUnitType : function(){
      if(!this.get("bcfPreviousBalance") && this.get("bcfPreviousBalance") !== 0) return;
      this.set('prevBalanceWithUnitType', this.formatNumber(this.get("bcfPreviousBalance"), this.get("unitTypeId")) + ' ' + config.unitSymbolObject[ this.get("unitTypeId") ]);
      return this.get('prevBalanceWithUnitType');
    },

    recoveredBalanceWithUnitType : function(){
      if(!this.get("paymentAmount") && this.get("paymentAmount") !== 0) return;
      this.set('recoveredBalanceWithUnitType', this.formatNumber(this.get("paymentAmount"), this.get("unitTypeId")) + ' ' + config.unitSymbolObject[ this.get("unitTypeId") ]);
      return this.get('recoveredBalanceWithUnitType');
    },

    remainingBalanceWithUnitType : function(){
      if(!this.get("totalBalance") && this.get("totalBalance") !== 0) return;
      this.set('remainingBalanceWithUnitType', this.formatNumber(this.get("totalBalance"), this.get("unitTypeId")) + ' ' + config.unitSymbolObject[ this.get("unitTypeId") ]);
      return this.get('remainingBalanceWithUnitType');
    },
    // balance owed to employee
    balanceOwedWithUnitType : function(){
      if(!this.get("balanceOwed")) return;
      this.set('balanceOwedWithUnitType', this.formatNumber(this.get("balanceOwed"), this.get("unitTypeId")) + ' ' + config.unitSymbolObject[ this.get("unitTypeId") ]);
      return this.get('balanceOwedWithUnitType');
    },
    // balance owed to employee from Solr
    calcBalanceOwedWithUnitType : function(){
      if(!this.get("totalBalance") && this.get("totalBalance") !== 0 ||
         !this.get("balance") && this.get("balance") !== 0) return; 
      var balanceOwedToEmployee = this.get("totalBalance") + this.get("balance");
      this.set('balanceOwedWithUnitType', this.formatNumber(balanceOwedToEmployee, this.get("unitTypeId")) + ' ' + config.unitSymbolObject[ this.get("unitTypeId") ]);
      return this.get('balanceOwedWithUnitType');
    },         
    convertBalanceType : function(){
      if(this.get("balanceType") === 'BCF') {
        this.set("balanceType", this.bcfToIncentive);
      }else if(this.get("balanceType") === 'PPA_BALANCE'){
        this.set("balanceType", this.ppaBalanceToPriorPeriod);
      }
    },

    toJSON: function() {
      this.formatDates(); // in comm model
      this.convertBalanceType();
      var j = CommissionModel.prototype.toJSON.call(this);
      j.periodBalanceWithUnitType = this.periodBalanceWithUnitType();
      j.prevBalanceWithUnitType = this.prevBalanceWithUnitType();
      j.recoveredBalanceWithUnitType = this.recoveredBalanceWithUnitType();
      j.remainingBalanceWithUnitType = this.remainingBalanceWithUnitType();
      if(this.datasource === 'solr'){
        j.balanceOwedWithUnitType = this.calcBalanceOwedWithUnitType();
      }else{
        j.balanceOwedWithUnitType = this.balanceOwedWithUnitType();
      }
      j.businessGroup = this.get('businessGroupName') || this.get('businessGroup');
      return j;
    }

  });

  return PaymentBalanceModel;
});
