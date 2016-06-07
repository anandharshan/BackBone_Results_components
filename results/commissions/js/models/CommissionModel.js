define([
  "jquery",
  "baseModel",
  "systemConfig",
  "config",
  "userConfig",
  "i18n",
  "moment",
  "momentTZ",
  "momentTZData",
], function($, BaseModel, systemConfig, config, userConfig, i18n, moment, momentTZ, momentTZData) {
  /**
   * A Backbone Model to hold workflow event items.
   * 
   * Populated by {@link module:CommissionCollection}
   *
   * @module CommissionModel
   */
  var CommissionModel = BaseModel.extend({

    heldYes : i18n.get('icmadvanced.results', 'yes') || "[Yes]",
    heldNo : i18n.get('icmadvanced.results', 'no') || "[No]",
    
    outputFormat : "MM/DD/YYYY",

    datesToFormat : [ 'releaseDate', 'incentiveDate', 'estimatedReleaseDate'], //'createdDate' is removed as no formatting will be done for this

    initialize: function(){
      userConfig.setReportDecimalDisplayRate(userConfig.getPreferences().commissionRateDecimals);
      userConfig.setReportDecimalDisplayCurrency(userConfig.getPreferences().reportCurrencyDecimalDisplay);
      this.preferences = userConfig.getPreferences();
      this.timeZone = (this.preferences && this.preferences.timeZone) || "UTC";
      if(this.preferences && this.preferences.rawDateFormat){
          this.outputFormat = this.preferences.rawDateFormat.toUpperCase();
      }
    },

    /**
     * A methof to return an REST API endpoint for the model to perform GET/PUT/POST/DELETE method.
     *
     * If an id property is defined on this model than the value of id property is appened to the URL.
     *
     * @type {String}
     */
    url: function(){
      var url = systemConfig.appContext+"/api/commissions/v1"
      if(this.id){
        url = url + '/' +this.id;
      }
      return url;
    },

    /**
     *
     */
    formatUnitType : function(unitType){
      if(unitType === 'PERCENT'){
        return "%";
      }
      return " "+unitType;
    },

    /**
     *
     */
    formatDates : function(){
      var day;
      if(this.datasource === 'solr'){
        this.datesToFormat.forEach(function(date){
          if(this.get(date)){
            day = moment(this.get(date));
            this.set(date, day.format(this.outputFormat));
          }
        }, this);
      }
    },

    /**
     *
     */
    formatNumber: function(num, unitTypeId){
      if(num === null){
        //if it is null it should be displayed empty
        return;
      }
      if((num && !isNaN(num)) || num === 0){
        return userConfig.formatNumber(num, unitTypeId);
      }    
      return num;
    },

    /**
     *
     */    
    amountWithUnitType : function(){
      if(!this.get("amount") && this.get("amount") !== 0) return;
      this.set('amountWithUnitType', this.formatNumber(this.get("amount"), this.get("amountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("amountUnitTypeId") ]);
      return this.get('amountWithUnitType');
    },

    /**
     *
     */
    originaAmountWithUnitType : function(){
      if(!this.get("amount") && this.get("amount") !== 0) return;
      this.set('originaAmountWithUnitType', this.formatNumber(this.get("amount"), this.get("amountUnitTypeId") ) + ' ' + config.unitSymbolObject[ this.get("amountUnitTypeId") ]);
      return this.get('originaAmountWithUnitType');
    },

    /**
     *
     */    
    rateWithUnitType : function(){
      if(this.get("rateAmount")){
        this.set('rateWithUnitType', userConfig.formatRate(this.get("rateAmount")) + ' %');
      }else{
        this.set('rateWithUnitType', this.get("rateAmount"));
      }
      return this.get('rateWithUnitType');
    },

    /**
     *
     */    
    creditAmountWithUnitType : function(){
      if(!this.get("creditAmount") && this.get("creditAmount") !== 0) return;
      this.set('creditAmountWithUnitType', this.formatNumber(this.get("creditAmount"), this.get("creditAmtUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("creditAmtUnitTypeId") ]);
      return this.get('creditAmountWithUnitType');
    },

    /**
     *
     */
    held : function(){
      this.set('held', this.get("isHeld") ? this.heldYes : this.heldNo);
      return this.get('held');
    },

    /**
     *
     */    
    releaseAmountWithUnitType : function(){
      if(!this.get("releasedAmount") && this.get("releasedAmount") !== 0) return;
      // Using amountUnitTypeId since releaseAmountUnitTypeId is not present in response
      this.set('releaseAmountWithUnitType', this.formatNumber(this.get("releasedAmount"), this.get("amountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("amountUnitTypeId") ]);
      return this.get('releaseAmountWithUnitType');
    },

    /**
     *
     */
    heldAmountWithUnitType : function(){
      if(!this.get("heldAmount") && this.get("heldAmount") !== 0) return;
      this.set('heldAmountWithUnitType', this.formatNumber(this.get("heldAmount"), this.get("amountUnitTypeId")) + ' ' + config.unitSymbolObject[ this.get("amountUnitTypeId") ]);
      return this.get('heldAmountWithUnitType');
    },

    /**
     *
     */    
    formatMiscValues : function(){
      if(this.get("measureValue")) {
        this.set('measureValue', this.formatNumber(this.get("measureValue")) );
      }
      if(this.get("rollingMeasureValue")) {
        this.set('rollingMeasureValue', this.formatNumber(this.get("rollingMeasureValue")) );
      }
      if(this.get("attainmentValue")) {
        this.set('attainmentValue', this.formatNumber(this.get("attainmentValue")) );
      }
      if(this.get("rollingAttainmentValue")) {
        this.set('rollingAttainmentValue', this.formatNumber(this.get("rollingAttainmentValue")) );
      }
      if(this.get("creditApplied")) {
        this.set('creditApplied', this.formatNumber(this.get("creditApplied")) );
      }
    },

    /**
     *
     */
    toJSON: function() {
      this.formatMiscValues();
      this.formatDates();
      var j = _(this.attributes).clone();
      j.amountWithUnitType = this.amountWithUnitType();
      j.originaAmountWithUnitType = this.originaAmountWithUnitType();
      j.rateWithUnitType = this.rateWithUnitType();
      j.creditAmountWithUnitType = this.creditAmountWithUnitType();
      j.releaseAmountWithUnitType = this.releaseAmountWithUnitType();
      j.heldAmountWithUnitType = this.heldAmountWithUnitType();
      j.held = this.held();
      if(this.get('earningGroupName')){
        j.earningGroup = this.get('earningGroupName');
      }
      if(this.get('creditTypeName')){
        j.creditType = this.get('creditTypeName');
      }
      if(this.get('businessGroupName')){
        j.businessGroup = this.get('businessGroupName');
      }
      return j;
    }

  });

  return CommissionModel;
});
