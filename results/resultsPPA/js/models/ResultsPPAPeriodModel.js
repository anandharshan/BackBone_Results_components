"use strict";
define([
  "backbone",
  "config"
], function(Backbone, Config) {
  var ResultsPPAPeriodModel = Backbone.Model.extend({
    url: "../../"+ "api/v1/periods/lastXClosedPeriods?includeFirstOpenPeriod=y&numberOfPeriods=100"
  });
  return ResultsPPAPeriodModel;
});