define([
	'jquery',
    'underscore',
    'backbone',
    'config',
    'i18n',
    'pageUtils',
    "TableView",
	"BaseEditView",
    "ResultsSavedSearchCollection",
    "TertiaryMenuView",
    "savedSearchModel",
	"PPAStatusModel",
	"dialogView",
	"currentUserModel",
	"PeriodsCollection"
], function($, _, Backbone, config, i18n, pageUtils, TableView, BaseEditView, ResultsSavedSearchCollection, 
			TertiaryMenuView, SavedSearchModel, PPAStatusModel, DialogView, CurrentUserModel, PeriodsCollection){

	var ResultsHomeView = BaseEditView.extend({

		/**
		 * el
		 *
		 * @type jquery {Object} 
		 */
		el: $("#content"),

		/**
		 * i18n Namespace for this UI.
		 *
		 * @type {String} 
		 */
		namespace: "icmadvanced.results",

		showPagination : true,
                
        showResultCount : true,

		/**
		 * default header. Override this property in your view.
		 *
		 * @type {String} 
		 */
		header : "Search",

		tableHeaders : ['title', 'type', 'owner', 'createdDate'],

		rowTemplate : _.template(
	        "<div class='list-item-row border-bottom clearfix' data-id='<%= id %>'>\
	            <span>\
	              <span class='search actionable'><%- title %></span> \
	              </span>\
	            <span><%= searchType %></span>\
	            <span><%= owner %></span>\
	            <span><%= createdDate %></span>\
	            <div class='pill-button-grp' data-id='<%= id %>'>\
	              <button class='pill-button action-button' data-action='edit'><i class='edit-icon btn-icon-spacing'></i> <span data-i18n='edit'>Edit</span></button>\
	              <button class='pill-button action-button' data-action='copy'><i class='copy-icon btn-icon-spacing'></i> <span data-i18n='copy'>Copy</span></button>\
	              <button class='pill-button action-button' data-action='delete'><i class='remove-icon btn-icon-spacing'></i> <span data-i18n='delete'>Delete</span></button>\
	            </div>\
	     	</div>"
		),

      	template : _.template(
            "<div class='saved-search-content'> \
                <div class='list-header'>\
              		<div id='list-total'>\
                		<span id='results-total' class='results-total'></span>\
              		</div>\
              		<div class='list-nav list-nav-top'></div>\
            	</div>\
            	<div> \
                    <ul class='tertiary-nav clearfix' id='savedSearchMenu'></ul> \
                </div> \
                <div class='table-header clearfix'></div> \
                <div class='table-content clearfix'></div> \
            <div> "
        ), 

		searchTypeMap  : {
			'PAYMENTS' : "payments",
			'PAYMENT_BALANCES' : "payment_balances",
			'MANUAL_PAYMENTS' : "manual_payments",
			'DRAW' : "draw",
			'COMMISSIONS' : "commissions",
			'COMMISSIONS_HELD' : "commissions_held",
			'CREDIT' : "credit",
			'CREDIT_HELD' : "credit_held",
			'BONUS' :"bonus",
			'BONUS_HELD' : "bonus_held"
		},

		pageHashMap  : {
			'PAYMENTS' : "results/payments/payments",
			'PAYMENT_BALANCES' : "results/payments/balances",
			'MANUAL_PAYMENTS' : "results/payments/manualpayments",
			'DRAW' : "results/draws",
			'COMMISSIONS' : "results/commissions/release",
			'COMMISSIONS_HELD' : "results/commissions/held",
			'CREDIT' : "results/credits/release",
			'CREDIT_HELD' : "results/credits/held",
			'BONUS' :"results/bonuses/release",
			'BONUS_HELD' : "results/bonuses/held"
		},

		secondaryMenuMap  : {
			'PAYMENTS' : "RESULTS_TAB_RESULTS_PAYMENT",
			'PAYMENT_BALANCES' : "RESULTS_TAB_RESULTS_BCF",
			'MANUAL_PAYMENTS' : "RESULTS_TAB_RESULTS_PAYMENT",
			'DRAW' : "RESULTS_TAB_RESULTS_DRAW",
			'COMMISSIONS' : "RESULTS_TAB_RESULTS_COMMISSION",
			'COMMISSIONS_HELD' : "RESULTS_TAB_RESULTS_COMMISSION",
			'CREDIT' : "RESULTS_TAB_RESULTS_CREDITS",
			'CREDIT_HELD' : "RESULTS_TAB_RESULTS_CREDITS",
			'BONUS' :"RESULTS_TAB_RESULTS_BONUS",
			'BONUS_HELD' : "RESULTS_TAB_RESULTS_BONUS"
		},

		events :{
            'click .search'         : 'searchSelected'
        },
		
		/**
		 * An initialization method for Backbone.View. 
		 * 
		 * @param options {Object} data and object references required by this view.
		 */
		initialize: function (options) {
			this.periodsCollection = new PeriodsCollection();
            this.periodsCollection.fetch({success: function(collection){
            	config.tempCache = config.tempCache || {};
            	config.tempCache['visiblePeriodsCollection'] = collection.clone();
            }});

			this.pageName = this.header.toLowerCase();
			this.i18nPageName = i18n.get(this.namespace, this.header) || '['+this.header+']';
			this.noFavoriteSearches = i18n.get(this.namespace, 'noFavoriteSearches');
			this.noSavedSearches = i18n.get(this.namespace, 'noSavedSearches');
			
			this.$el.html($('#credit-comm-bonus-tmpl').html());
			this.$el.find('#inner-content').addClass('result-search-home');;
			this.$el.find('.saved-search-container').html(this.template())
			this.$el.find('.rightHelpMenu').hide();
			this.$el.find('.sidebar').hide();
			this.$el.find('#results-table').remove();
			this.$el.find('.search-breadcrumb_container').remove();
			this.renderHeader();

			config.resultSearchType = config.resultSearchType || 'favorite';
			var searchfield = [],
				searchtext = [];
			if(config.resultSearchType === 'favorite'){
				searchfield = ['favorite', 'user'];
				searchtext = [true, true];
			}else if(config.resultSearchType === 'user'){
				searchfield = ['user'];
				searchtext = [true];
			}
			this.dataCollection = new ResultsSavedSearchCollection();
            this.dataCollection.url =  config.appContext + "/api/v1/savedsearches";
        	this.dataCollection.params.limit = 50;
            this.dataCollection.params.offset = 0;
            this.dataCollection.params.currentPage = 1;
            this.dataCollection.params.searchfield = searchfield;
            this.dataCollection.params.searchtext = searchtext;
        	this.dataCollection.params.sortBy = config.resultSearchSortBy || 'title';
            this.dataCollection.params.sortOrder = config.resultSearchSortOrder || 'asc';
            this.dataCollection.objectType = this.type;

            this.listenTo(this.dataCollection, 'error', this.error);
            this.listenToOnce(this.dataCollection, 'sync', this.renderBreadCrumView);    // optimize to update table only           
            this.renderTableView(); 

			this.ppaStatsModel = new PPAStatusModel();
            this.ppaStatsModel.fetch();
            this.listenTo(this.ppaStatsModel, 'sync', this.toggleAdvSearchMenu);
            //this.updateSecondaryMenu('RESULTS_TAB_RESULTS_SEARCH');

            var self = this;
            this.currentUserModel = new CurrentUserModel();   
            this.currentUserModel.fetch({success: function(){
                self.user = self.currentUserModel.toJSON();
                self.toggleButtons();
            }});
		},

		renderTableView : function(){
			this.loadHeaders();
			this.savedSearchTableView = new TableView({
                el: this.$el.find(".saved-search-content"),
                namespace : this.namespace,
                collection : this.dataCollection,
                headers : this.headerCols,
                showPagination : true,
                showResultCount : true,
                rowTemplate : this.rowTemplate
            });
            this.renderTableTernaryMenuView();
            this.$el.find('#results-table').removeClass('hide');
            this.listenTo(this.savedSearchTableView, 'edit', this.edit);
            this.listenTo(this.savedSearchTableView, 'copy', this.copy);
            this.listenTo(this.savedSearchTableView, 'delete', this.delete);
            this.listenTo(this.savedSearchTableView, 'rendered', this.toggleButtons);
		},

        /**
         *
         */
        renderTableTernaryMenuView : function(){
            /* jshint ignore:start */
            var menuItems = [
                {
                  id: 'favorite',
                  className : (config.resultSearchType === 'favorite') ? 'activeLink' : '',
                  label: i18n.get(this.namespace, 'saved.search.favorite') || "[Favorite Saved Searches]"
                },
                {
                  id: 'user',
                  className : (config.resultSearchType === 'user') ? 'activeLink' : '',
                  label: i18n.get(this.namespace, 'saved.search.mine') || "[My Saved Searches]"
                },
                {
                  id: 'all',
                  className : (config.resultSearchType === 'all') ? 'activeLink' : '',
                  label: i18n.get(this.namespace, 'saved.search.all') || "[All Saved Searches]"
                }
            ];
            /* jshint ignore:end */

            // call view...may be extended to handle custom events
            this.tertiaryTableMenuView = new TertiaryMenuView({
                el : this.$el.find('#savedSearchMenu'),
                menuItems: menuItems
            });
            this.listenTo(this.tertiaryTableMenuView, "click", this.processTernaryNavEvent);
        },

        /**
         *
         */
        processTernaryNavEvent : function(menu){
        	this.dataCollection.params.offset = 0;
            this.dataCollection.params.currentPage = 1;
            this.dataCollection.params.searchfield = [];
            this.dataCollection.params.searchtext = [];
            config.resultSearchType = menu.id;
            if(menu.id === 'user'){
            	this.dataCollection.params.searchfield.push('user');
            	this.dataCollection.params.searchtext.push(true);
            }else if(menu.id === 'favorite'){
            	this.dataCollection.params.searchfield.push('favorite');
            	this.dataCollection.params.searchtext.push(true);
            	this.dataCollection.params.searchfield.push('user');
            	this.dataCollection.params.searchtext.push(true);
            }
            this.dataCollection.trigger('filter');
        },

        /**
         *
         *
         */
        loadHeaders : function(){
            var self = this;
            // this needs to be come from default, xactly-default or saved seach
            this.headerCols = this.tableHeaders.map(function(name){
                obj = Object.create(null);
                obj.name= name;
                obj.label = i18n.get(self.namespace, 'saved.search.header-'+name) || '['+name+']';
                obj.sortable = true;
                obj.sort = '';
                return obj;
            });

            this.headerCols[this.defaultSortIndex || 0].sort = 'asc';
        },

		/**
		 *
		 */		
		toggleAdvSearchMenu : function(){
			this.ppaEnabled = this.ppaStatsModel.get('ppaEnabled');
            if(!this.ppaEnabled){
            	$('#tertiary-nav').remove();
            }else{
            	this.renderTertiaryMenuView();
            }
		},

		/**
		 *
		 */		
		renderEmptyMessage : function(){
			if(this.dataCollection.length === 0){
				if(config.resultSearchType === 'favorite'){
					if(this.noFavoriteSearches){
						this.$el.find('.norecords').html(this.noFavoriteSearches).addClass('centerize');
					}
				}else{
					if(this.noSavedSearches){
						this.$el.find('.norecords').html(this.noSavedSearches).addClass('centerize');
					}
				}
			}
		},

		/**
		 *
		 */
		tertiaryMenuItemsConfig : function(){
			/* jshint ignore:start */
			this.menuItems = [
	            {
	              id: 'search',
	              className : '',
	              label: i18n.get(this.namespace, 'savedSearchTitle') || "[Saved Search]",
	              hash : 'results/home',
	              hashTrigger : true
	            },
	            {
	              id: 'advsearch',
	              className : '',
	              label: i18n.get(this.namespace, 'advsearch') || "[Advanced Search]",
	              hash : null,
	              hashTrigger : false,
	              url: '../../results/html/advsearch.html?view=advancesearch'
	            }
	        ];//	
			/* jshint ignore:end */

			this.menuItems[0].className = 'activeLink';
		},

		/**
		 *
		 */
		renderTertiaryMenuView : function(){
			this.tertiaryMenuItemsConfig();

			// call view...may be extended to handle custom events
			this.tertiaryMenuView = new TertiaryMenuView({
				el : ('#tertiary-nav'),
				menuItems: this.menuItems
			});
			this.listenTo(this.tertiaryMenuView, 'click', this.handleMenuClick)
		},

		/**
		 *
		 */
		handleMenuClick : function(menu){			
			if(!menu.url) return;
			window.location.href = menu.url;
		},

		/**
		 * Utility method to set up page header {@link module:ResultsView~header}
		 */
		renderHeader : function(){
			this.$el.find('#page-header').html(this.header); // title of the page
		},

		/**
         *
         */		
		setSearchType : function(id){
			var model = this.dataCollection.get(id);
			this.searchType = this.searchTypeMap[model.get('type')];
		},

		/**
         *
         */	
		searchSelected: function(e){
          var id = $(e.currentTarget)
              .parents('.list-item-row')
              .data('id');

          if(!id){
            return; // ghost click
          }
          this.getSavedSearch(id);
        },

		/**
         *
         */		
		getSavedSearch : function(id){
			this.setSearchType(id);
			this.savedSearchModel = new SavedSearchModel({
			  type: this.searchType,
			  id: id
			});
			this.listenToOnce(this.savedSearchModel, 'sync', this.performSearch);
			this.savedSearchModel.fetch();
        },

		/**
         *
         */	
        performSearch : function(model){
			config.tempCache = config.tempCache || {};
			config.tempCache.savedSearch = model;

			var rowModel = this.dataCollection.get(model.get('id')),
				urlHash = this.pageHashMap[rowModel.get('type')],
				secondaryTab = this.secondaryMenuMap[rowModel.get('type')];

			this.cleanUp();
            config.router.navigate(urlHash, {trigger: true});			
			//var mainFrame = pageUtils.xRootContainer().sFrame.uiclientFrame.mainFrame; //.hash = urlHash;
            //config.router.navigate(urlHash, {trigger: true});			
            //pageUtils.xRootContainer().sFrame.uiclientFrame.mainFrame = mainFrame;
			// this.updateSecondaryMenu(secondaryTab);
			// pageUtils.xRootContainer().findFrame('mainFrame').location.href= '../../../icmadvanced/results/html/results.html?view='+rowModel.get('typeLC')+'#'+urlHash;
		},

		/**
         *
         */	
        updateSecondaryMenu : function(secondaryTab){
        	try{
				var topFrame = pageUtils.xRootContainer().findFrame('topFrame');
				$(topFrame.document.getElementById('RESULTS_TAB')).find('a').css('font-weight', 'normal');
				var targetAnchor = $(topFrame.document.getElementById(secondaryTab)).find('a');
				targetAnchor.css('font-weight', 'bold').attr('target', 'mainFrame');

				//$(topFrame.document.getElementById(secondaryTab)).find('a').trigger('click');
			}catch(err){
				console.log(err);
			}
        },
        
       /**
         *
         */
        toggleButtons : function(){
        	this.renderEmptyMessage();
        	config.resultSearchSortOrder = this.dataCollection.params.sortOrder;
        	config.resultSearchSortBy = this.dataCollection.params.sortBy;
          	this.userId = this.currentUserModel && this.currentUserModel.get('id');
          	if(this.userId){
            	this.dataCollection.forEach(this.toggleButton, this);
          	}
        },

        /**
         *
         */
        toggleButton : function(model){
          if(model.get('ownerId') !== this.userId){
            var pillgroup = this.$el.find('[data-id="'+model.get('id')+'"]');
            
            var editButton = pillgroup.find('[data-action="edit"]');
            editButton.addClass('disabled').prop('disabled', true);
            
            var deleteButton = pillgroup.find('[data-action="delete"]');
            deleteButton.addClass('disabled').prop('disabled', true);
          }
        },

		/**
         *
         */	 
        edit: function(model){
           	this.setSearchType(model.id);
            config.router.navigate("editSavedSearch/"+this.searchType+'/'+model.id, {trigger: true});
        },

		/**
         *
         */	         
        copy : function(model){
           	this.setSearchType(model.id);
            config.router.navigate("copySavedSearch/"+this.searchType+'/'+model.id, {trigger: true});
        },

		/**
         *
         */	         
        delete : function(data){
          var self = this,
                dialogOptions = {},
                dialogView;

           	this.setSearchType(data.id);

            dialogOptions.showCancel = true;
            dialogOptions.namespace = this.namespace;
            dialogOptions.labels = {
                header_i18n: "saved.search.confirmDeleteHeader",
                message_i18n: "saved.search.confirmDeleteSavedSearchMessage",
                confirmButton_i18n: "delete"
            };
            dialogView = new DialogView(dialogOptions);
            dialogView.render();
            self.listenToOnce(dialogView, "cancel", function() {
                self.stopListening(dialogView);
                dialogView.stopListening();
            });
            self.listenToOnce(dialogView, "confirm", function() {
              $.ajax({
                url: config.appContext + "/api/v1/savedsearches/"+data.id,
                type: 'DELETE',
                contentType: 'application/json'
              }).done(function(){
                self.dataCollection.trigger('filter');
              }).fail(function(xhr,responseText){
                 var message  = "Unknown Error";
                  try{
                      message = $.parseJSON(xhr.responseText).message;
                  }catch(err){   
                  }
                  var labels = {
                      header_i18n: "saved.search.errorOccurredMessage",
                      message: message
                  };
                  setTimeout(function(){
                      self.showNotification(labels, self.i18nNamespace);  
                  }, 500); 
              });
                self.stopListening(dialogView);
                dialogView.stopListening();
            });
        },
		/**
         *
         */	        
		cleanUp : function(){
			this.savedSearchTableView.cleanUp();
			this.savedSearchTableView.undelegateEvents();
			this.tertiaryTableMenuView.undelegateEvents();
			this.tertiaryMenuView && this.tertiaryMenuView.undelegateEvents();
			this.undelegateEvents();
		}

	});
	return ResultsHomeView;
});