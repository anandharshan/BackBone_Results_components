// TODO: Most, but not all, of this is dedicated to localization, but the rest is
// unrelated. We should separate out the two to enable easier reuse

define([
  'jquery',
  'sprintf',
  'kendo'
  //'kendoFR',
//userProfileHelper'
], function($, sprintf, kendo/*, kendoFR, UserProfileHelper*/) {

  // TODO: Do we need to implement PropertyManager per xmbo?
  var config = {};
  config.xlateTable = {};
  config.preferences = {};
  config.dataAPIMap = {};
  config.appContext = "/explorer";
  config.router = null;
  config.callbacks = {};
  config.hasChange = false;

  // load the translation table from server, and call the callback(normally a view renderer) afterward
  // TODO: Extract and reuse
  var load = function(url, view, callback){
    $.ajax({
      url: url,
      dataType: 'json',
      data: {},
      success: function(data){
        config.rawData = data.item;
        //console.log(config.rawData);
        if (view)
          config.xlateTable[view] = {};
        $.each(data.item.labelsAndMessages, function(key, val) {
          if (view)
            config.xlateTable[view][key] = val;
          else
            config.xlateTable[key] = val;
        });

        if (data.item.preferences) {
          config.preferences = data.item.preferences;
          if(config.preferences.locale && config.preferences.locale.length > 0) {
            var kendoLocale = config.preferences.locale.replace("_", "-");
            kendo.culture(kendoLocale);
          }
        }
        if (data.item.unitTypes)
          config.unitTypes = data.item.unitTypes;
        if (data.item.currencies)
          config.currencies = data.item.currencies;
        if (data.item.visiblePeriods){
          config.visiblePeriods = data.item.visiblePeriods;
          if (config.visiblePeriods.length > 0)
            config.visiblePeriods.shift();
        }
        if(data.item.dataAPIMap) {
          config.dataAPIMap = data.item.dataAPIMap;
        }
        callback(data);
      },
      error: function(jqXHR, textStatus, errorThrown){
        var json = JSON.parse(jqXHR.responseText);
        if(json && json.status == 401) {
          	console.log("in config 401 message");
			//var userProfileHelper = new UserProfileHelper();
          	//userProfileHelper.invalidSession(json.gotoMessage, json.gotoURL);
        } else {
          alert(jqXHR.responseText);
        }
      }
    });
  };

  // translate the text contents of descendants with "labelId" attribute
  // 1. if the "labelId" attribute contains a value, use that; otherwise,
  // 2. use the "id" attribute of the element
  var plain = function(el, view){
    var labels = $('[labelId]', el);
    labels.each(function(index){
      var labelId = getLabelId($(this));
      var labelText;
      if (view)
        labelText = config.xlateTable[view][labelId];
      else
        labelText = config.xlateTable[labelId];
      if (labelText) {
        if (labelText.search(/%\(/) == -1) { // skip over parameterized text
          if ($(this).is('textarea') || $(this).is('select')) {
            $(this).val(labelText);
          } else {
            $(this).html(labelText);
          }
        }
      } else {
        $(this).text('['+$(this).text()+']');
      }
    });
  };

  // translate the text content of DOM element el with named-parameters substitution
  // xObj is an object with values defined for each param.
  var param = function(el, xObj, view){
    var labelId = getLabelId($(el));
    var labelText;
    if (view)
      labelText = config.xlateTable[view][labelId] || '['+labelId+']';
    else
      labelText = config.xlateTable[labelId] || '['+labelId+']';
    if (labelText) {
      $(el).html(sprintf(labelText, xObj));
    }
  };

  // return the translated text given the text Id or id (with/without substitution)
  var getLabel = function(labelId, xObj, view){
    if (labelId) {
      var labelText;
      if (view)
        labelText = config.xlateTable[view][labelId] || '['+labelId+']';
      else
        labelText = config.xlateTable[labelId] || '['+labelId+']';
      if (xObj)
        labelText = sprintf(labelText, xObj);
      return labelText;
    }
    return "";
  };

  function getLabelId(el){
    if (el.attr('labelId'))
      return el.attr('labelId');
    if (el.attr('id'))
      return el.attr('id');
    return "";
  };

  function isCultureNumber(number){
    if (!number)
      return true;
    number = number.toString();
    var cultureCharacters = kendo.toString(-12345, 'n').replace(/[0-9]/g, '');	// get a sample first
    for (var i=0; i <cultureCharacters.length; i++) { // remove all culture characters
      number = number.split(cultureCharacters.charAt(i)).join('');
    }
    return /^\d+$/.test(number);
  };

  function getDateFormat(){
    return config.preferences.dateFormat;
  };

  function getCurrencyDecimalPlaces(){
    return config.preferences.decimalDisplayCurrencyFormat || 0;
  };

  function getDefaultCurrency() {
    return config.preferences.defaultCurrency;
  };

  function getDataAPI(apiKey) {
    return config.dataAPIMap[apiKey];
  };

  function getCurrencies(){
    return config.currencies;
  };

  function getUnitTypes(){
    return config.unitTypes;
  };

  function getVisiblePeriods(){
    return config.visiblePeriods;
  };

  function getConfigData(dataKey) {
    return config.rawData? config.rawData[dataKey] : null;
  };

  function setCallbacks(callbacks){
    config.callbacks.cancelCB = callbacks['cancel'];
    config.callbacks.dontSaveCB = callbacks['dontSave'];
    config.callbacks.saveCB = callbacks['save'];
  };

  function getCancelCB(){
    return config.callbacks.cancelCB;
  };

  function getDontSaveCB(){
    return config.callbacks.dontSaveCB;
  };

  function getSaveCB(){
    return config.callbacks.saveCB;
  };

  function getUserInfo(){
    return config.userInfo;
  };


  return {
    load: load,
    loadAppConfig: function(url, callback) {
      var self = this;
      load(url, '', function(data) {
        config.appConfig = data.item;
        config.userInfo = config.appConfig.userInfo;
		/*
        var userProfileHelper = new UserProfileHelper({
          getLabel: self.getLabel,
          userInfo:  self.getUserInfo(),
          labelsAndMessages: self.getAppConfig('labelsAndMessages'),
          appContext: self.getAppConfig('module').incent.context,
          selectedUserParticipant: self.getSelectedUserParticipant(),
          userParticipants: self.getUserParticipants(),
          userInfoAPI: self.getAppConfig('userInfoAPI'),
          userProfileImage: self.getUserInfo().userProfileImage,
          firstTimeHelpStepsFactory: firstTimeHelpStepsFactory,
          logoutAPI: self.getAppConfig('logoutAPI'),
          logoutURL: self.getAppConfig('logoutURL')
        });
        userProfileHelper.initSaveProfile();
        config.userProfileHelper = userProfileHelper;
		*/
		console.log("in config  loading "+url);
        if (callback) callback(data);
      });
    },
    getUserProfileHelper: function() {
      return config.userProfileHelper;
    },
    getAppConfig: function(dataKey) {
      return config.appConfig? config.appConfig[dataKey] : null;
    },
    translateAllLabels: plain,
    param: param,
    getLabel: getLabel,
    getDateFormat: getDateFormat,
    getUnitTypes: getUnitTypes,
    getCurrencies: getCurrencies,
    getVisiblePeriods: getVisiblePeriods,
    appContext: config.appContext,
    period: config.period,
    getUserInfo: getUserInfo,
    getDataAPI: getDataAPI,
    getConfigData: getConfigData,
    getCurrencyDecimalPlaces: getCurrencyDecimalPlaces,
    getDefaultCurrency: getDefaultCurrency,
    hasChange: config.hasChange,
    setCallbacks: setCallbacks,
    getCancelCB: getCancelCB,
    getDontSaveCB: getDontSaveCB,
    getSaveCB: getSaveCB,
    isCultureNumber: isCultureNumber
  }
});