define([
  "jquery",
  "underscore",
  "backbone",
  "config",
  "i18n",
  "orderTypesCollection",
  "currencyUnitTypesCollection",
  "loglevel",
  "pageUtils"
], function($, _, Backbone, config, i18n, OrderTypesCollection, 
            CurrencyUnitTypesCollection, Log, pageUtils) {

  var AppRouter = Backbone.Router.extend({

    searchTypeMap : {
      "commissions" :"commissions",
      "credits" :"credit",
      "bonuses" :"bonus",
      "draws" :"draw",
      "payments" :"payments"
    },

    routefrag : "results/commissions",

    routes: {
            
      "results/home": "resultsHomePage",
      //"results/advancedSearch": "advancedSearch",
      //"results/advancedSearch/:tab": "loadAdvancedSearchTab",

      "results/commissions/release": "commissionsRelease",
      "results/commissions/held": "commissionsHeld",

      "results/credits/release": "creditsRelease",
      "results/credits/held": "creditsHeld",

      "results/bonuses/release": "bonusesRelease",
      "results/bonuses/held": "bonusesHeld",

      "results/draws": "draws",
      "results/payments/payments": "payments",
      "results/payments/balances": "balances",
      "results/payments/manualpayments": "manualPayments",

      //add Manual Payment
      "results/payments/addmanualpayments/:periodId": "addmanualPayments",

      // saved search
      "addnewsearch/:objectType" : "addNewSearch",
      "editSavedSearch/:objectType/:id" : "editSavedSearch",
      "copySavedSearch/:objectType/:id" : "copySavedSearch",

      // settings 
      "settings/:objectType" : "settings",
      "settings/:objectType/:id" : "settingsEdit",

      //PPA Results
      "results/ppa" : "listPPAResults",
      
      // General
      "*actions": "defaultAction"
    },
    /**
     *
     */ 
    updateSecondaryMenu : function(secondaryTab){
      try{
        pageUtils.xRootContainer() && pageUtils.xRootContainer().hideProgress(-1);
        if(secondaryTab){
          var i = 0,
              topFrame = pageUtils.xRootContainer().findFrame('topFrame');
              
          $(topFrame.document.getElementById('RESULTS_TAB')).find('a').css('font-weight', 'normal');
          for(i = 0; i < secondaryTab.length; i++){
            $(topFrame.document.getElementById(secondaryTab[i])).find('a').css('font-weight', 'bold');
          }
        }
      }catch(err){
        Log.error(err);
      }
    },

    _loadView : function(view, secondaryMenu){
      if(!view) return;
      this.view && this.view.cleanUp();
      this.view = view;
      this.view.render();
      this.constructRouteFrag();
      this.loadPreRequiredData();
      this.updateSecondaryMenu(secondaryMenu);
    },

    constructRouteFrag : function(){
      var fragment = Backbone.history.getFragment();
      if( fragment && $.trim(fragment.length) !== 0 ){
        // this may be used by future calls to return to a page where user came from.
        this.routefrag = fragment;
      }
    },

    listPPAResults: function(){
      console.log("Listing PPA");
      var self = this;
      requirejs(["PPAView"], function(PPAView) {
          self.PPAView = new PPAView({
              el: $("#content")
          });
          self.PPAView.render();
      });
    },

    advancedSearch: function() {
      var self = this;
      requirejs(["AdvancedSearchView"], function(AdvancedSearchView) {
        self.advancedSearchView =  new AdvancedSearchView();
        self._loadView(self.advancedSearchView, ['RESULTS_TAB_RESULTS_SEARCH']);
      });   
    },

    resultsHomePage: function() {
      var self = this;
      requirejs(["ResultsHomeView"], function(ResultsHomeView) {
        self.resultsHomeView = new ResultsHomeView();
        self._loadView(self.resultsHomeView, ['RESULTS_TAB_RESULTS_SEARCH']);
      });    
    },

    creditsRelease: function() {
      var self = this;
      requirejs(["CreditsResultView"], function(CreditsResultView) {
        self.creditsResultView = new CreditsResultView();
        self._loadView(self.creditsResultView, ['RESULTS_TAB_RESULTS_CREDITS']);
      });    
    },

    creditsHeld: function() {
      var self = this;
      requirejs(["CreditsHeldView"], function(CreditsHeldView) {
        self.creditsHeldView = new CreditsHeldView();
        self._loadView(self.creditsHeldView, ['RESULTS_TAB_RESULTS_CREDITS']);
      });    
    },

    commissionsRelease: function() {
      var self = this;
      requirejs(["CommissionsResultView"], function(CommissionsResultView) {
        self.commissionsResultView = new CommissionsResultView();
        self._loadView(self.commissionsResultView, ['RESULTS_TAB_RESULTS_COMMISSION']);
      });      
    },

    commissionsHeld: function() {
      var self = this;
      requirejs(["CommissionsHeldView"], function(CommissionsHeldView) {
        self.commissionsHeldView = new CommissionsHeldView();
        self._loadView(self.commissionsHeldView, ['RESULTS_TAB_RESULTS_COMMISSION']);
      });      
    },

    bonusesRelease: function() {
      var self = this;
      requirejs(["BonusesResultView"], function(BonusesResultView) {
        self.bonusesResultView = new BonusesResultView();
        self._loadView(self.bonusesResultView, ['RESULTS_TAB_RESULTS_BONUS']);
      });  
    },

    bonusesHeld: function() {
      var self = this;
      requirejs(["BonusesHeldView"], function(BonusesHeldView) {
        self.bonusesHeldView = new BonusesHeldView();
        self._loadView(self.bonusesHeldView, ['RESULTS_TAB_RESULTS_BONUS']);
      });  
    },

    draws: function() {
      var self = this;
      requirejs(["DrawsResultView"], function(DrawsResultView) {
        self.drawsResultView = new DrawsResultView();
        self._loadView(self.drawsResultView, ['RESULTS_TAB_RESULTS_DRAW']);
      });     
    },

    payments: function() {
      var self = this;
      requirejs(["PaymentsResultView"], function(PaymentsResultView) {
        self.paymentsResultView = new PaymentsResultView();
        self._loadView(self.paymentsResultView, ['RESULTS_TAB_RESULTS_PAYMENTS_READWRITE', 'RESULTS_TAB_RESULTS_PAYMENTS_READONLY']);
      }); 
    },

    balances: function() {
      var self = this;
      Log.info("Balances Router is triggerred.");
      requirejs(["PaymentBalancesView"], function(PaymentBalancesResultView) {
        self.paymentBalancesResultView = new PaymentBalancesResultView();
        self._loadView(self.paymentBalancesResultView, ['RESULTS_TAB_RESULTS_PAYMENTS_READWRITE', 'RESULTS_TAB_RESULTS_PAYMENTS_READONLY']);
      }); 
    },

    manualPayments: function() {
      var self = this;
      Log.info("Manual Payments Router is triggerred.");
      requirejs(["ManualPaymentsView"], function(ManualPaymentsView) {
        self.ManualPaymentsView = new ManualPaymentsView();
        self._loadView(self.ManualPaymentsView, ['RESULTS_TAB_RESULTS_PAYMENTS_READWRITE', 'RESULTS_TAB_RESULTS_PAYMENTS_READONLY']);
      }); 
    },

    addmanualPayments: function(id) {
      var self = this, options = {};
      Log.info("Add Manual Payments Router is triggerred.");
      
      options.returnURL= this.routefrag;
      options.el = $('#content');
      options.periodId = id;
      this.setInputOptions(options);

      i18n.load("icmadvanced.orders", "../../../icmadvanced/api/messages").then(function(){ 
        requirejs(["AddManualPaymentView"], function(AddManualPaymentView) {
          self.addManualPaymentView =  new AddManualPaymentView(options);
          self._loadView(self.addManualPaymentView);
        });
      });
    },

    addNewSearch: function(objectType){
      var options = {
        mode: 'new',
        type : 'savedSearch',
        objectType: objectType
      }; 
      this.loadSavedSearchPage(options);
    },

    editSavedSearch: function(objectType, id){
      var options = {
        mode: 'edit',
        type : 'savedSearch',
        objectType: objectType,
        searchId : id
      };
      this.loadSavedSearchPage(options);
    },

    copySavedSearch: function(objectType, id){
      var options = {
        mode: 'copy',
        type : 'savedSearch',
        objectType: objectType,
        searchId : id
      };  

      this.loadSavedSearchPage(options);
    },

    settings : function(objectType){
       var options = {
        mode: 'new',
        type : 'settings',
        objectType: objectType
      }; 
      this.loadSavedSearchPage(options);
    },

    settingsEdit : function(objectType, id){
       var options = {
        mode: 'edit',
        type : 'settings',
        objectType: objectType,
        searchId : id
      }; 
      this.loadSavedSearchPage(options);
    },

    setInputOptions: function(options){
      options.inputOptions = {};
      options.inputOptions.objectType = options.objectType;
      options.inputOptions.objectNamespace = 'icmadvanced.results';

      options.objectStatus = null;
      if(options.returnURL && options.returnURL.indexOf('release') > -1){
        options.objectStatus = 'release'; 
      }else if(options.returnURL &&  options.returnURL.indexOf('held') > -1){
        options.objectStatus = 'held'; 
      }
      options.inputOptions.objectStatus = options.objectStatus;
    },

    loadSavedSearchPage : function(options){
      options.returnURL= this.routefrag;
      options.el = $('#content');
      // map it for backend
      options.objectType = this.searchTypeMap[options.objectType] || options.objectType; 

      this.setInputOptions(options);

      var self = this;
      i18n.load("icmadvanced.orders", "../../../icmadvanced/api/messages").then(function(){ 
        requirejs(["ResultsSavedSearchEditorView"], function(ResultsSavedSearchEditorView) {
          self.savedSearchEditorView =  new ResultsSavedSearchEditorView(options);
          self._loadView(self.savedSearchEditorView);
        });
      });
    },

    loadPreRequiredData : function(){
      if(!config.orderTypesCollection){
        config.orderTypesCollection = new OrderTypesCollection({});
        config.orderTypesCollection.fetch();
      }
      if(!config.currencyUnitTypesCollection){
          config.currencyUnitTypesCollection = new CurrencyUnitTypesCollection();
          config.currencyUnitTypesCollection.fetch();
      }
    }

  });
  

  var initialize = function() {
    config.router = new AppRouter();
    Backbone.history.start();
    /*$(document).on("click", "a", function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    });*/
  };

  return {
    initialize: initialize
  };
});