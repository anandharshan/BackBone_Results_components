define([
    "jquery",
    "jqueryMigrate",
    "i18nJQuery",
    "kendo",
    "xcommon/js/helper/AppHelper",
    "router",
    "config",
    "i18n",
    "pageUtils",
    "userConfig",
    "currencyUnitTypesCollection",
    "q"
], function($, jqueryMigrate, i18nJQuery, Kendo, AppHelper, router, config, i18n, pageUtils, userConfig,
            CurrencyUnitTypesCollection, Q) {

    // Prevent IE from caching ajax calls
    $.ajaxSetup({
        cache: false
    });

    config.tabName = "Results";

    // Register pingback to enclosing app for session keepalive
    AppHelper.registerEmbeddable(window.document);

    var initialize = function() {

        $( document ).ajaxError(function( event, jqxhr, settings, exception ) {
            if ( jqxhr.status== 401 ) {
                var message = i18n.get(self.namespace, "sessionTimeout") || '[The current session has expired. Please log in again.]';
                alert(message);
                var parentContainer = pageUtils.xRootContainer();
                if(parentContainer){
                    parentContainer.logOff();
                }
            }
        });

        // Load default messages. These are messages that are used in more than one area of the application,
        // and also serve as fallbacks if keys are not found in other bundles
        var namespaces = ["icmadvanced.default", "icmadvanced.results", "icmadvanced.advsearch"];
        pageUtils.xRootContainer() && pageUtils.xRootContainer().hideProgress(-1);
        i18n.setDefaultNamespace("icmadvanced.default");
        
        var _transformPermissions = function(tabs){
            transformPermissions(tabs);
        };

        if(config.params["view"] != "ppaResults") {
            Q.allSettled([
                getData(config.appContext + "/api/messages?ns=" + namespaces.join(','), 'application/json', 'json'),
                getData(config.appContext + "/api/tabPermission/v1/tabs")
            ]).spread(function (i18nLabels, tabs){
                _.each(i18nLabels.value, function(bundle, namespace) {
                    i18n.processBundle(bundle, namespace);
                });

                _transformPermissions(tabs);
                userConfig.load(function(){
                    mainConfigLoaded();
                });
            }).done();
        } else {
            mainConfigLoaded();
        }
    };

    
    /*
     * return promise of the ajax call for give API url.
     *
     */
    var transformPermissions = function(tabs){
        config.heldPermissions = "NONE";
        config.paymentsPermissions = "NONE";
        config.mpPermissions = "NONE";
        config.balancesPermission = "NONE";

        /*
        * permissions are as follows
        * NONE = do now show held menu
        * READ_ONLY = show held menu but diable held actions
        * READ_WRITE = show held menu and allow held actions
        * 
        */
        var content = tabs && tabs.value && tabs.value.content;
        if(!content) return;

        config.heldPermissions = determinePermission('Held', content);
        config.paymentsPermissions = determinePermission('Payments', content);
        config.mpPermissions = determinePermission('ManualPayments', content);
        config.balancesPermission = determinePermission('Balances', content);
    };

    var determinePermission = function(page, content){
        var permissionObject = _.findWhere(content, {tabName : page});
        var permission = 'NONE';
        if(permissionObject.readWritePrivilege === true){
            permission = 'READ_WRITE';
        }else if(permissionObject.readOnlyPrivilege === true){
            permission = 'READ_ONLY';
        }
        return Object.freeze({value: permission});
    };

    /*
     * return promise of the ajax call for give API url.
     *
     */
    var getData = function(apiUrl, contentType, dataType){
        return Q.when(
            $.ajax({
                type: "GET",
                cache: false,
                url: apiUrl,
                contentType: contentType, //'application/json',
                dataType: dataType //'json'
            })
        );
    };

    function mainConfigLoaded() {
        var viewToRouteMap,
            initialRoute;

        // Prevent IE from dying on attempted console usage
        if (typeof window.console === "undefined") {
            window.console = {};
            window.console.log = function() {
                return;
            };
        }

        viewToRouteMap = {
            "home": "results/home",
            "credits": "results/credits/release",
            "comm-held": "results/commissions/held",
            "commissions": "results/commissions/release",
            "bonuses": "results/bonuses/release",
            "draws": "results/draws",
            "payments": "results/payments/payments",
            "savedSearch" : "addnewsearch/commissions",
            "balances": "results/payments/balances",
            "manualpayments": "results/payments/manualpayments",
            // PPA View to Route 
            "ppaResults":"results/ppa"
        };

        initialRoute = viewToRouteMap[config.params.view] || viewToRouteMap["home"];

        // globally show/hide progress bar
        $(document).ajaxStart(function() {
            kendo.ui.progress($('#content'), true);
        });

        $(document).ajaxStop(function() {
            kendo.ui.progress($('#content'), false);
        });

        $.ajaxSettings.traditional = true;
        router.initialize();

        config.router.navigate(initialRoute, {
            trigger: true
        });
    }

    return {
        initialize: initialize
    };
});
