define([
	'jquery',
	'underscore',
	'backbone',
	'config',
	'searchPopup',
	'earningGroupsModel',
	'text!results/resultsPPA/html/earningGrpHeader.html',
    'text!results/resultsPPA/html/earningGrpListTemplate.html',
	'i18n'
], function($, _, Backbone, config, SearchPopup, EarningGroupsModel, HeaderElementsTemplate,ListTempate,i18n) {
	
	var EarningGrpView = SearchPopup.extend({
		
		events: {
		}, 
		initialize: function(options) {

			options.namespace = "icmadvanced.results";

			//api settings
			options.api = 'v1/typecodes/earninggroups'; //name of the api
			options.apiExtraParam = {} //there is no extra param in case of person

			
			//passing model 
			options.elementModel = EarningGroupsModel;
			options.multiSelect = true;
			
			//template settings
			options.headerElements = HeaderElementsTemplate;
			options.listTempate = ListTempate;
			
			options.popupParentDivId = 'earningGrpView'; //whatever you want you can name the div

			//grid settings
			options.perElementWidth = 123; //each element width (alway integer // this set css in px)
			options.textAllign = 'left'; //alignment of the grid element

			//fields settings
			options.sortField = 'name'; //default sort filds name (put the class 'sorterAscImage' in html header)
			options.sortDirection = 'asc';

			options.displayField = ['name','description']; //you can pass multiple field name in array
			options.defaultSearchfield = ['name','description']; //serch within the popup will happen in these fields
			options.itemsPerPage = 50;   //number of elements you want to show in first page
			options.searchField = 'name'; //field value which you want to pass in parent dom
			options.numberOfFielsToDisplay = 3; //except select (always integer)

			//i18n keys settings for labels ( divClass : i18n keys )
			//leave the keys of the object as it is just pass the i18n keys for label in the popup
			var pageText = {
				'page-title' 					: 'selectPerson',
				'select-element-button' 		: 'select',			
				'currently-selected-element' 	: 'currentlySelectedPerson',
				'search-header' 				: 'findPerson'
			};
			if(options.pageText) {
				var newPageText = $.extend( pageText, options.pageText );
				options.pageText = newPageText;
			} else {
				options.pageText = pageText;
			}
			this.constructor.__super__.initialize.call(this, options);
            this.events = _.extend({}, SearchPopup.prototype.events, this.events);
		}
		
	});
	return EarningGrpView;

});