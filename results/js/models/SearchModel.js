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
   * A Backbone Model to hold SearchModel
   * 
   * Populated by {@link module:ResultSavedSearchCollection}
   *
   * @module SearchModel
   */
  var SearchModel = BaseModel.extend({

    nameMap : {
      'PAYMENTS' : i18n.get('icmadvanced.results', "payments") || '[Payments]',
      'PAYMENT_BALANCES' : i18n.get('icmadvanced.results', "balances") || '[Balances]',
      'MANUAL_PAYMENTS' : i18n.get('icmadvanced.results', "manualPayments") || '[Manual Payments]',
      'DRAW' : i18n.get('icmadvanced.results', "Draws") || '[Draws]',
      'COMMISSIONS' : i18n.get('icmadvanced.results', "Commissions") || '[Commissions]',
      'COMMISSIONS_HELD' : i18n.get('icmadvanced.results', "commissionHeld") || '[Commissions Held ]',
      'CREDIT' : i18n.get('icmadvanced.results', "Credits") || '[Credits]',
      'CREDIT_HELD' : i18n.get('icmadvanced.results', "creditsHeld") || '[Credits Held ]',
      'BONUS' : i18n.get('icmadvanced.results', "Bonuses") || '[Bonus]',
      'BONUS_HELD' : i18n.get('icmadvanced.results', "bonusHeld") || '[Bonus Held ]',
    },
    
    outputFormat : "MM/DD/YYYY",

    datesToFormat : ['createdDate', 'releaseDate', 'incentiveDate', 'estimatedReleaseDate'],

    initialize: function(){
      
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
      return config.appContext + "/api/v1/savedsearches/"+options.type+"/" + options.id;
    },

    /**
     *
     */
    formatDates : function(){
      var day;
      this.datesToFormat.forEach(function(date){
        if(this.get(date)){
          day = moment.utc(this.get(date)).tz(this.timeZone);
          this.set(date+'Formatted', day.format(this.outputFormat));
        }
      }, this);
    },

    /**
     *
     */
    toJSON: function() {    
      var j = _(this.attributes).clone();
      j.searchType = this.nameMap[ this.get('type')];
      return j;
    }

  });

  return SearchModel;
});
