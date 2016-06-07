define(["jquery",
    "config",
    "underscore",
    "i18n",
    "pageUtils"
], function($,config, _, i18n, pageUtils) {

	/**
    * A Backbone View to render Advanced Search Tab selection component
    *
    * @module TabSelectionView
    */
    var TabSelectionView = Backbone.View.extend({

    	events :{
    		"click .cancel-select-button" : "cancelAndClose",
    		"click .savetabs" : "saveTabs",
    		"click .move" : "moveTab",
    		"click .select" : "toggleTabSelection"
    	},

    	initialize: function(options){
    		this.selectedTabs = options.selectedTabs;
    		this.allTabs = options.allTabs;    		

            var allTabKeys = _.keys(this.allTabs);
            //var diff = _.difference(allTabKeys, this.selectedTabs );
            this.orderedtabs = _.union(this.selectedTabs, allTabKeys);
            if(!options.detailOrderItem){
                this.orderedtabs = _.without(this.orderedtabs, 'orderdetails');
            }
    		this.render();
    	},

    	render : function(){
            this.$el.show().html($("#tab-selection-tmpl").html());
            this.renderList();
    	},

        renderList : function(){
            var self = this;
            var output = _.template($("#tab-list-tmpl").html(), {
                selectedTabs: this.selectedTabs,
                allTabs: this.allTabs,
                orderedtabs: this.orderedtabs
            }, {
                variable: 'data'
            });
            var tabList = this.$el.find('#tab-list');
            tabList.html(output);

            tabList.sortable({
                placeholder: "ui-state-highlight",
                connectWith: "parent",
                containment: "parent",
                forcePlaceholderSize: true,
                items: 'li:not(.ui-state-disabled)',
                start: function(event, ui) {
                    $(this).removeClass("cancel");
                    var start_pos = ui.item.index();
                    //$(this).attr('data-previndex', ui.item.index());
                    self.$el.find("#tab-list > li").removeClass('draggable');
                    $(ui.item).addClass('draggable');
                },
                stop: function(event, ui) {
                    self.$el.find("#tab-list > li").removeClass('draggable');
                    self.$el.find("#tab-list > li").each(function(index, element) {
                        $(this).find(".counter").text(index+1);
                        $(this).attr('data-index',index);
                    });
                },
                cancel: ".ui-state-disabled"
            });
        },

    	cancelAndClose : function(){
    		this.trigger('close');
    		this.cleanUp();
    	},

    	saveTabs : function(){
            var self = this;
            var visible, name
                self.selectedTabs = [],
                empty = true;;

            self.$el.find("#tab-list > li").each(function(index, element) {
                visible = $(element).attr('data-visible');
                name = $(element).data('name');
                self.allTabs[name].visible = false;
                if(visible == 'true' || visible == true){
                    self.allTabs[name].visible = true;
                    self.selectedTabs.push( name);
                    empty = false;
                }
            });
            if(empty){
                var msg = i18n.get('icmadvanced.advsearch', 'emptyTab') || 'You must select at least one tab.';
                this.$el.find('#errorGutter').html(msg).show();
                return;
            }
            var data = {};
            data.object_order = self.selectedTabs;
            data.objects = self.allTabs;

    		self.trigger('change', data );
    		this.cleanUp();
    	},

    	moveTab : function(e){
    		var target = $(e.currentTarget),
    			index = target.data("index"),
    			direction = target.data('direction')
    			swapIndex = null;

    		// determine elements to swap with
    		if(direction === 'down' && index >= 0){
    			swapIndex = index + 1;
    		}else if(direction === 'up' && index <= this.orderedtabs.length){
    			swapIndex = index - 1;
    		}
            if(swapIndex == null || swapIndex < 0 || swapIndex >= this.orderedtabs.length) return;
    		// swap array elements
    		var tmp = this.orderedtabs[swapIndex];
			this.orderedtabs[swapIndex] = this.orderedtabs[index];
			this.orderedtabs[index] = tmp;
			// TODO : dim up arrow in first row and down arrow in last row

            this.renderList();
    	},

    	toggleTabSelection : function(e){
    		var target = $(e.currentTarget),
                parentLi = target.parents('li.tab-item'),
    			selected = target.hasClass("fa-check-square"),
                tab = parentLi.data('name'),
    			klassToAdd, klassToRemove, errorGutter;
    		//
            parentLi.attr('data-visible', !selected);
            this.allTabs[tab].visible = !selected;

    		if(selected){
    			klassToRemove = 'fa-check-square';
                klassToAdd = 'fa-square-o';
    		}else{
    			klassToAdd = 'fa-check-square';
                klassToRemove = 'fa-square-o';
    		}
    		target.addClass(klassToAdd).removeClass(klassToRemove);

            errorGutter = this.$el.find('#errorGutter');
            if(this.$el.find('.fa-check-square').length === 0){
                var msg = i18n.get('icmadvanced.advsearch', 'emptyTab') || 'You must select at least one tab.';
                errorGutter.html(msg).slideDown();
            }else{
                errorGutter.slideUp();
            }
    	},

    	cleanUp : function(){
            this.undelegateEvents();
    		$("#popupDiv").hide().empty();
    	}
	});
    return TabSelectionView;
});


