define([
  "jquery"
  , "underscore"
  , "backbone"
  , "i18n"
  , "i18nJQuery"
], function($, _, Backbone, i18n, i18xlate) {

  	var ModalView = Backbone.View.extend({
	    tagName: 'p',
	    initialize: function(attrs) {
			//console.log('attrs : ', attrs);
		    this.options = attrs;
		    this.template= _.template($(this.options.templateId).html(), this.options);//
			this.parent = parent;
		},
		render: function() {
	        this.$el.html(this.template);
			setTimeout(this.fixCells, 0);
	        return this;
	    },
		fixCells : function(){
			var maxstrlen = 0, prevlen = 0;
			$.each( $('.modal-label-right'), function(index, obj){
			    maxstrlen = $(this).width();
			    maxstrlen = (maxstrlen > prevlen) ? maxstrlen : prevlen;
			    prevlen = maxstrlen;
			});
			$('.modal-label-right').width(maxstrlen+10);
			$('.modal-label-right').parent("td").width(maxstrlen+15);
		},
		
		events : {
			"click .cancelButton": function(){ console.log("close")},			// inline function to close the modal window
			"click #startrefresh" 	: "startrefresh"							// bind start refresh now button
		},
		
		startrefresh : function(e){
			var self = this;
			$('#refProgressMsg').html("Starting data refresh").css('color', '#333333').show();
			$.ajax({ 
		        type: "POST",
		        cache: false,
		        url: '/explorer/api/advsearch/startrefresh',
		        contentType: 'application/json',        
				dataType: 'json'
		    }).done(function (response, textStatus, jqXHR){
			  	//console.log( textStatus, response );
				self.updateUI(textStatus, response );
			}).fail(function (jqXHR, textStatus, errorThrown){
				$('#refProgressMsg').html(i18n.get('explorer.advsearch', 'refreshStartErrMsg')).css('color', '#ff0000').show();
			  	//console.error("The following error occured: "+ textStatus, errorThrown);
			}).always(function(){				
				if(cacheManager) cacheManager.clear(); // clears all items from the cache
			});
		},
		updateUI : function(textStatus, response){
			$('#refProgressMsg').html('').hide();
			$("#nextRefersh").html(i18n.get('explorer.advsearch', 'refreshStarted'));
			$("#refreshStatus").html(i18n.get('explorer.advsearch', 'refreshInProgress'));
			$('#content #cancelBtnLabel').html(i18n.get('explorer.advsearch', 'close'));
			$("#startrefresh").hide();
			
		}
	});

  return ModalView;
});