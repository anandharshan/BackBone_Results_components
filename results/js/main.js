require.config({
  paths: {
    /************* tab configuration *************/
    app:    "results/js/app",
    router: "results/js/router",

    /************* From home/advsearch tab *************/
// TODO: move this files to results folder post sep15 freeze

    AdvancedSearchView :        'home/advSearch/js/views/AdvanceSearchView',
    mischelpers :               "home/advSearch/js/utils/mischelpers",
    xedge :                     'home/advSearch/js/DataLoader/xactly-edge',
    settingView :               'home/advSearch/js/views/SettingView',
    
    // models
    filterModel :               'home/advSearch/js/models/Filter',
    filterCollection :          'home/advSearch/js/models/FilterCollection',
    
    //views
    filterView :                "home/advSearch/js/views/FilterView",
    TabSelectionView :          "home/advSearch/js/views/TabSelectionView",

    LastRefresh :               "home/advSearch/js/models/LastRefreshModel",
    LastRefView :               "home/advSearch/js/common/views/LastRefreshView",
    ModalView :                 "home/advSearch/js/common/views/ModalView",

    Download :                  "home/advSearch/js/utils/downloadHelper",

    /************* Utilities *************/
    FormInputConfigs : 'results/js/helper/FormInputConfigs',
    ColumnFilterConfigs : 'results/js/helper/ColumnFilterConfigs',
    CommissionFormItems : 'results/commissions/js/helper/CommissionFormItems',
    CreditFormItems : 'results/credits/js/helper/CreditFormItems',
    BonusFormItems : 'results/bonuses/js/helper/BonusFormItems',
    PaymentFormItems : 'results/payments/js/helper/PaymentFormItems',
    DrawFormItems : 'results/draws/js/helper/DrawFormItems',

    /************* common models *************/
    SearchModel : 'results/js/models/SearchModel',
    CommissionModel : 'results/commissions/js/models/CommissionModel',
    CommissionCollection : 'results/commissions/js/models/CommissionCollection',
    DrawModel : 'results/draws/js/models/DrawModel',
    DrawCollection : 'results/draws/js/models/DrawCollection',
    CreditsModel : 'results/credits/js/models/CreditsModel',
    CreditsCollection : 'results/credits/js/models/CreditsCollection',
    BonusModel : 'results/bonuses/js/models/BonusModel',
    BonusCollection : 'results/bonuses/js/models/BonusCollection',
    PaymentModel : 'results/payments/js/models/PaymentModel',
    PaymentBalanceModel : 'results/payments/js/models/PaymentBalanceModel',
    PaymentCollection : 'results/payments/js/models/PaymentCollection',
    ManualPaymentModel : 'results/payments/js/models/ManualPaymentModel',
    DuplicateManualPaymentModel : 'results/payments/js/models/DuplicateManualPaymentModel',
    ManualPaymentCollection : 'results/payments/js/models/ManualPaymentCollection',
    DuplicateManualPaymentCollection : 'results/payments/js/models/DuplicateManualPaymentCollection',
    ManualPaymentAuditModel : 'results/payments/js/models/ManualPaymentAuditModel',
    ManualPaymentAuditLogCollection : 'results/payments/js/models/ManualPaymentAuditLogCollection',
    UnfinalizedBizGrpCollection : 'results/payments/js/models/UnfinalizedBizGrpCollection',
    BizGrpWithPaymentsCollection : 'results/payments/js/models/BizGrpWithPaymentsCollection',

    TransformedOrderAndItemCodeModel : 'results/js/models/TransformedOrderAndItemCodeModel',
    TransformedResultNameModel : 'results/js/models/TransformedResultNameModel',
    GenericResultsCollection : 'results/js/models/GenericResultsCollection',
    GenericResultsLegacyCollection : 'results/js/models/GenericResultsLegacyCollection',
    GenericResultsModel : 'results/js/models/GenericResultsModel',
    ResultsSolrCollection : 'results/js/models/ResultsSolrCollection',
    ResultsSolrDownloadCollection : 'results/js/models/ResultsSolrDownloadCollection',
    ResultsSavedSearchCollection : 'results/js/models/ResultsSavedSearchCollection',
    
    /************* common views *************/
    ResultsView : 'results/js/views/ResultsView',
    PageMenuView : 'results/js/views/PageMenuView',
    DownloadView : "results/js/views/DownloadView",
    FormGroupView : "results/js/views/FormGroupView",
    SidebarFormGroupView : "results/js/views/SidebarFormGroupView",
    LandingPageSidebarView :  "results/js/views/LandingPageSidebarView",
    ReleasedResultSidebarView : "results/js/views/ReleasedResultSidebarView",
    CommentView : "results/js/views/CommentView",
    ResultActionPopupView : "results/js/views/ResultActionPopupView",
    ReleaseHoldsPopupView : "results/js/views/ReleaseHoldsPopupView",
    UploadManualPaymentView : "results/js/views/UploadManualPaymentView",
    ReleasedRowView : "results/js/views/ReleasedRowView",
    DrawRowView : "results/js/views/DrawRowView",
    DuplicateMPRowView : "results/js/views/DuplicateMPRowView",
    HeldRowView : "results/js/views/HeldRowView",
    ResultsSavedSearchEditorView : "results/js/views/ResultsSavedSearchEditorView",
    PaymentRowView : 'results/js/views/PaymentRowView',
    
    /************* credits *************/
    CreditsResultView : 'results/credits/js/views/CreditsResultView',
    CreditsHeldView : 'results/credits/js/views/CreditsHeldView',

    /************* commissions *************/
    CommissionsResultView : 'results/commissions/js/views/CommissionsResultView',
    CommissionsHeldView : 'results/commissions/js/views/CommissionsHeldView',

    /************* bonuses *************/
    BonusesResultView : 'results/bonuses/js/views/BonusesResultView',
    BonusesHeldView : 'results/bonuses/js/views/BonusesHeldView',

    /************* draws *************/
    DrawsResultView : 'results/draws/js/views/DrawsResultView',

    /************* payments *************/
    PaymentsResultView : 'results/payments/js/views/PaymentsResultView',
    PaymentBalancesView : 'results/payments/js/views/PaymentBalancesView',
    ManualPaymentsView : 'results/payments/js/views/ManualPaymentsView',

    /*************Duplicate Manual Payment *************/
    ManualPaymentDuplicatesPopupView : 'results/js/views/ManualPaymentDuplicatesPopupView',

    AddManualPaymentView : "results/payments/js/views/AddManualPaymentView",
    
    ResultsHomeView : 'results/search/js/views/ResultsHomeView',
    /**************************************
     * Orders 
     **************************************/
    currencyUnitTypeModel: "orders/orders/js/models/CurrencyUnitTypeModel",
    personModel: "orders/orders/js/models/PersonModel",
    orderCodeModel: "orders/orders/js/models/OrderCodeModel",
    savedSearchModel: "orders/orders/js/models/SavedSearchModel",
    currentUserModel: "orders/orders/js/models/CurrentUserModel",
    orderTypesCollection: "orders/orders/js/collections/OrderTypesCollection",
    currencyUnitTypesCollection: "orders/orders/js/collections/CurrencyUnitTypesCollection",
    savedSearchCollection: "orders/orders/js/collections/SavedSearchCollection",
  

    // RESULTS PPA VIEWS
    PPAView:                    "results/resultsPPA/js/views/PPAView",
    resultsPPAPeriodModel:      "results/resultsPPA/js/models/ResultsPPAPeriodModel",
    personView:                 "orders/orders/js/views/PersonView",
    ppaResultsDisplayView:      "results/resultsPPA/js/views/PPAResultsDisplayView",
    externalProcessCollection:  "results/resultsPPA/js/models/ExternalProcessCollection", 
    externalProcessModel:       "results/resultsPPA/js/models/ExternalProcessModel", 
    PPAperiodListItemView:      "results/resultsPPA/js/views/PPAperiodListItemView",
    PPAperiodListDetails:       "results/resultsPPA/js/views/PPAperiodListDetails",
    earningGroupsModel:         "results/resultsPPA/js/models/EarningGroupsModel",
    earningGrpView:             "results/resultsPPA/js/views/EarningGrpView",
    ppaResultsSummaryView:      "results/resultsPPA/js/views/PPAResultsSummaryView",
    businessGrpCollection:      "results/resultsPPA/js/models/BusinessGrpCollection",
    businessGrpModel:           "results/resultsPPA/js/models/BusinessGrpModel",
    BusinessGroupView:          "results/resultsPPA/js/views/BusinessGroupView",
    BusinessGrpListItemView:    "results/resultsPPA/js/views/BusinessGrpListItemView",
    resultsPPACollection:       "results/resultsPPA/js/models/ResultsPPACollection",
    popupHelper: "orders/orders/staging/js/utils/popupHelper",


    /************* misc libs *************/
    moment:         "lib/moment/moment-min",
    momentTZ:       "lib/moment/moment-timezone",
    momentTZData:   "lib/moment/moment-timezone-data",
    globalize:      "lib/globalize/globalize",
    cultures:       "lib/globalize/cultures/globalize.cultures",
    sha256:         "lib/sha256/sha-256",
    cacheManager:   "lib/cache/cache",

    // config
    productConfig: "home/myHome/js/utils/productConfig",
    userConfigModel: "home/myHome/js/models/UserConfigModel",
    userConfig: "home/myHome/js/utils/userConfig",
    d3Locales:  "home/myHome/js/utils/d3Locales"

  },
    "shim": {
        "momentTZ": {
            "deps": ["moment"]
        },
        "momentTZData": {
            "deps": ["moment", "momentTZ"]
        }
    },
    waitSeconds: 0
});

require([
    "app"
], function(App) {
    App.initialize();
});