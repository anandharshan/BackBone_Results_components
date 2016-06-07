define([
	"jquery"
	, "underscore"
	, "backbone"
	, "LastRefresh"
	, "moment"
	, "momentTZ"
	, "momentTZData"
	, "backboneModal"
	, 'ModalView'
	, "q"
	, "i18n"
	, "i18nJQuery"
	, "jqueryPlugins"
], function($, _, Backbone, LastRefresh, moment, momentTZ, momentTZData, BackboneModal, ModalView, Q, i18n, i18nJQuery, plugins){
	/*
	 * Display last refresh status and modal popup to trigger data refresh manually in MDR if event are pending.
	 * Time is retrieved in GMT, but show in user's timezone and locale
	 * View hands communication from/to server to get last refresh, next refresh, trigger refresh and in-progress refresh statuses.
	 */
	var LastRefView = Backbone.View.extend({

		inputFormat : "YYYY-MM-DDTHH:mm:ssZ",				// date time format from server
		outputFormat : "dddd, MMMM DD, YYYY hh:mm A",		// date time format to show on UI
		apiRoot : "../../api/advsearch",				// api root url

		prevExpEndTime  : null,
		currentExpEndTime : null,

		// for human readable time relative to current time -- formatting
		relativeTime : {
	        future: "in %s",
	        past:   "%s ago",
	        s:  "seconds",
	        m:  "a minute",
	        mm: "%d mins",
	        h:  "an hour",
	        hh: "%d hrs",
	        d:  "a day",
	        dd: "%d days",
	        M:  "a month",
	        MM: "%d months",
	        y:  "a year",
	        yy: "%d years"
	    },

		events: {
			"click #viewmore" 		: "viewmore"			// to open modal dialog showing refresh info.
		},

		initialize: function(options){
			this.el = options.el,
			this.template = options.template,
			this.model = new LastRefresh(),
			this.timezone = options.timezone;
			this.listenTo(this.model, "change", this.render);
			moment.lang('en', { relativeTime : this.relativeTime });		// set up human readble timing
			this.setDataCheckInterval();
		},

		render : function(){
			// if don't have any data show invalid refresh
			if(!this.model || !this.model.get('startTime')) {
				return;
			}
			var status = this.model.get('refreshStatus');		// get the status of refresh
			var startTime = this.model.get('startTime');			// get the end time of last refresh
			var formattedTime = null;
			var day = moment.utc(startTime, this.inputFormat).tz(this.timezone);		// get moment obj with user's timezone offset (startTime, from server, is in GMT)
			formattedTime = day.format("ddd, hh:mm A");							// conver to local timezone and get time
			var currentTime = moment.utc().tz(this.timezone);						// to get elapsed time

			// render search data as of on page
			$(this.el).html( _.template(this.template, {
					status : status,
					startTime : startTime,
					formattedTime:formattedTime,
					elapsedTime : day.from(currentTime)
				}
				, {variable: 'data'}));
			if(startTime != null) $(this.$el).xlate( {namespace : 'explorer.advsearch'} , $(this.$el));	// translate labels
			$(this.el).show();														// show refresh status below table, next to navigation
			return this;
		},

		showText : function(){
			$(this.el).show();
		},

		/*
		 * view additional data regarding refresh job in modal dialog. Additional data is retrieved from
		 * server. Data is show when all server/api calls are completed.
		 */
		viewmore : function(e){
			startEllipsis('workingNote');
			this.render();
			this.getAgeofData(true);
		},
		getAgeofData : function(showDialog){
			// get last exp completed
			var self = this;

			/* @imp Code has been modified for temporary purpose */
			Q.allSettled([
				this.getData(this.apiRoot + '/lastrefresh?is_completed=true&page_number=1&items_per_page=50'),
			]).spread(function (lastExpCompleted){
				if( !lastExpCompleted){
					message = i18n.get('explorer.advsearch', 'serverTimeout');
				}else{
					self.calculateAgeOfData(lastExpCompleted);
				}
			}).done();
			/* @imp Code has been modified for temporary purpose */
		},

		calculateAgeOfData : function(lastExpCompleted){
			var timeZ = String(String(moment(lastExpCompleted.reason.responseText)._d).split("(")[1]).split(")")[0];
			var matches = timeZ.match(/\b(\w+)/g);
			var acronym = matches.join('');
			var dataUpdate  = moment(lastExpCompleted.reason.responseText).format("MM/DD/YYYY HH:mmA zz");
			$("#refresh-time").html(dataUpdate +" "+ acronym);
			$("#data-refresh").show();

		},

		determineNextRefresh: function(e){
			var self = this;
			//fetch next refrest time and event queue
			// call three apis required to show modal window and them open dialog
			Q.allSettled([
				this.getData(this.apiRoot + '/lastrefresh?is_completed=false'),
				this.getData(this.apiRoot + '/nextrefresh?type=mdr'),
				this.getData(this.apiRoot + '/incentevents'),
				this.getData(this.apiRoot + '/exprefresh?is_completed=true'),
				this.getData(this.apiRoot + '/exprefresh?is_completed=false')
				]).spread(function (sysstatus, nextref, pendingevent, expcompleted, expinprogress) {
					if( !sysstatus && !nextref && !pendingevent){
						message = i18n.get('explorer.advsearch', 'serverTimeout');
					}else{
						//TODO capture session time out here, if possible
						self.openDialog(sysstatus, nextref, pendingevent, expcompleted, expinprogress);
					}
			}).done();
		},
		openDialog : function(sysstatus, nextref, pendingevent, expcompleted, expinprogress){
			var lastRefTime, nexRefTime, startTime, day, currentTime, nextTime, formattedTime, nextFormattedTime, status, timeToRef, sysevents, inProgress, enableButton;

			currentTime = moment.utc().tz(this.timezone);	// to get elapsed time

			var lastrefresh = sysstatus.value;
			var lastRefStatus = lastrefresh && lastrefresh.data && lastrefresh.data[0] && lastrefresh.data[0].refreshStatus;

			var lastexprefresh =  expinprogress.value;
			var lastExpRefStatus = lastexprefresh && lastexprefresh.data && lastexprefresh.data[0] && lastexprefresh.data[0].refreshStatus;

			if(lastRefStatus === 'INPROGRESS'){
				// in progress
				nexRefTime = i18n.get('explorer.advsearch', 'refreshStarted');
				status = i18n.get('explorer.advsearch', 'refreshInProgress');
			} else if(!lastRefStatus){ // else if undefined
				// get last exp refress
				// if last exp refresh in progress
				if(lastExpRefStatus === 'INPROGRESS'){
					// in progress
					nexRefTime = i18n.get('explorer.advsearch', 'refreshStarted');
					status = i18n.get('explorer.advsearch', 'refreshInProgress');
				} else if(!lastExpRefStatus){  //else if undefined
					// get last mdr complete (this.model)
					var lastmdrET = this.lastMdrCompleted.endTime;
					var mdrET = moment.utc( lastmdrET, this.inputFormat).tz(this.timezone);

					// get last exp complete
					var lastExpMdrET = expcompleted && expcompleted.value && expcompleted.value.data && expcompleted.value.data[0] && expcompleted.value.data[0].mdrRefreshTime;
					var expMdrET = moment.utc( lastExpMdrET, this.inputFormat).tz(this.timezone);

					if(mdrET.diff(expMdrET) > 0){
						// in progress
						nexRefTime = i18n.get('explorer.advsearch', 'refreshStarted');
						status = i18n.get('explorer.advsearch', 'refreshInProgress');
					} else{ //else
						// update time again
						if(pendingevent.value.length === 0){
							nexRefTime = i18n.get('explorer.advsearch', 'nothingToRefresh');
							status = i18n.get('explorer.advsearch', 'uptodate');			// Up to date
						}else if(pendingevent.value.length > 0 ){
							// pending
							nexRefTime = i18n.get('explorer.advsearch', 'refreshNextUpdate');
							status = i18n.get('explorer.advsearch', 'refreshNotStarted');
							enableButton = true; 											// show start refresh now button

						}
					}
				}else{	//else
					//failed or error
					enableButton = true; 											// show start refresh now button
					status = i18n.get('explorer.advsearch', 'refreshFailed');
				}
			}else{ //else
				// error or fail
				enableButton = true; 											// show start refresh now button
				status = i18n.get('explorer.advsearch', 'refreshFailed');
			}

			startTime = this.model.get('startTime');	// start of last refresh time
			day = moment.utc(startTime, this.inputFormat).tz(this.timezone);

			// conver to local timezone and get time
			formattedTime = day.format(this.outputFormat);
			lastRefTime = formattedTime + " ("+day.from(currentTime)+")";

			enableButton = false; // disabling manual refresh for all for time being ORN-2483

			$("#transparentbkg").show();
			var view = new ModalView({
					lastRefresh : lastRefTime,
					nextRefersh : nexRefTime,
					eventsPending : pendingevent.length,
					status : status,
					templateId : "#refreshDialog",
					enableButton : enableButton,
					parent : self
			});

			var modal = new Backbone.BootstrapModal({
				el : '#content',
				content: view,
			    title: i18n.get('explorer.advsearch', 'refreshTitle'),
			    animate: true,
				template : _.template($("#modalTemplate").html())
			});

			modal.on('cancel', function() {
				$("#transparentbkg").hide();
				setTimeout(function(){
					// cancel removes content element from body. Ensure we always have content element body for next time
					if($("#content").length == 0) $( "body" ).append( "<div id='content' ></div>" ); //class='modal hide in'
				}, 500);
			});
			modal.open();
			$(this.$el).xlate( {namespace : 'explorer.advsearch'} , $('#content'));
			$("#content").removeClass("hide").slideDown(function(){
			 	$(this).attr('class', "modal");
			});
			stopEllipsis('workingNote');
		},

		/*
		 * return promise of the ajax call for give API url.
		 *
		 */
		getData : function(apiUrl){
			return Q.when(
			    $.ajax({
			        type: "GET",
			        cache: false,
			        url: apiUrl,
			        contentType: 'application/json',
					dataType: 'json'
			    })
			);
		},


		/*
		 * Ajax interval to check server for last
		 */
		 setDataCheckInterval : function(){
		 	var self = this;
		 	self.dataCheckInterval = window.setInterval( function(){
				self.getAgeofData(false);
			}, 5 *(60*1000));
		 }
	});
	return LastRefView;
});
