"use strict";
define([
  "jquery",
  "backbone",
  "config"
], function($, Backbone, Config) {
  var ResultsPPACollection = Backbone.Model.extend({

    initialize: function(models, options) {
      var searchParams = options.searchParams;

      this.url = Config.appContext + "/api/v1/pppResults?unitTypeId=" + searchParams.unitTypeId + 
                  "&fromPeriodId=" + searchParams.periodFromId + 
                  "&toPeriodId=" + searchParams.periodToId + "&" +
                  decodeURIComponent($.param( { participantId : searchParams.personId } )) + "&" +
                  decodeURIComponent($.param( { earningGroupName : searchParams.earningGroupNames } )) + "&" +
                  decodeURIComponent($.param( { businessGroupId : searchParams.businessGrpIds } )) +
                  "&type=" + searchParams.resultsTypeName;
    },

  });
  
  return ResultsPPACollection;
});