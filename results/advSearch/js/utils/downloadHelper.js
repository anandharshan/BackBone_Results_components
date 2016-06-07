/*jslint smarttabs=true */
//downloadHelper.js
define([
	"jquery", "q", "xedge", "i18n", "pageUtils"
], function($, Q, XactlyEdge, i18n, pageUtils) {
	
	var downloadHelper = function Download(){
		this.dimMap = {};
		this.countEmOrder = ['credit', 'orderdetail', 'commission', 'payment', 'orderassign', 'orders', 'bonus', 'draw']; 
		this.countEmIndex = 0;
		xactlyEdge = XactlyEdge;
		
		/*
		 *
		 */
		this.initDownload = function(options){
			var self = this;
			window.downloadStarted = true;
			self.showHideSpinner(true);
			this.asOfPeriodId = options.asOfPeriodId;
			this.tab = this.getTabToCount(); 
			if(this.tab){
				// load edgemart
				this.getCountData (this.tab);				
			}else{
				self.showMessage("Nothing to download");		
			}
		};
		
		/*
		 *
		 */		
		this.getCountData = function(tab){
			var self = this;

			var processCountResult = function(countData){
				var count = countData && countData.results && countData.results.records && countData.results.records[0].count;
				self.constructQueries(count);
			};
			
			var errorCallback = function(error){
				self.errorCB(error);
			};

			var response = Q(this).then(processCountResult, errorCallback);
		};

		
		/*
		 *
		 */		
		this.constructQueries = function(count){
			var self = this;
			
			var config = xactlyEdge.configJson;

			var queries = {};
		    queries.creditCount = xactlyEdge.getTotalRows();	
		    queries.config = config;
		
			var colMapping = {};

			for(mea in config.app.metadata.labels.displayNames){
				colMapping[mea] = config.app.metadata.labels.displayNames[mea];
			}

		    var queryArr = [],
		    	displayNames = {},
		    	displayName;
		    for(var t = 0; t < config.app.object_order.length; t++){
				var tab = config.app.object_order[t];
				if(!config.app.objects[tab].visible) continue;
		        var cols = config.app.objects[tab].columns;  //dimMap[tab]; //
		        if(cols === 'undefined' || cols.length === 'undefined') continue;
				var filters = config.app.objects[tab].filters;

				var object = xactlyEdge.configJson.app.objects[tab];
				var columns = object.columns,
					displayColumnNames = [];
				for(var c = 0; c < columns.length; c++){
					displayName = i18n .get('icmadvanced.advsearch', columns[c]) || columns[c]; 
					displayColumnNames.push(displayName)
				}
				displayNames[tab] = displayColumnNames;
				var columnString = JSON.stringify(columns);
				var objFilters = object.filters,
				filtername = null,
				olen = objFilters.length,
				filterArray = [];
				var filterString = "";

				for(var i = 0; i < olen; i++){ 				
					filtername = objFilters[i];				
					// get filters, if available
					if(XactlyEdge.filters[filtername] && XactlyEdge.filters[filtername].length > 0){	
						filterString += '"'+filtername+'":["'+XactlyEdge.filters[filtername].join('","')+ '"]';							
					} else {				
						filterString += '"'+filtername+'":["ALL"]';				
					}				
					if((i+1) < olen){
						filterString += ',';
					} 
				}

				for(var i = 0; i < olen; i++){
					filtername = objFilters[i];
					filterValues = 'ALL';
					// get filters, if available
					if(XactlyEdge.filters[filtername] && XactlyEdge.filters[filtername].length > 0){
						filterValues = XactlyEdge.filters[filtername].join('","');
					}
					if(filtername == 'PERIOD_ORDER_NUMBER' && filterValues === 'ALL'){
						continue;	
					} else if(filtername === 'PERIOD_ORDER_NUMBER'){
						filterValues = XactlyEdge.getMatchingPeriodIds(XactlyEdge.filters[filtername]);
						filterArray.push('"'+filtername+'":['+filterValues.join(",")+']');
					}else{
						filterArray.push('"'+filtername+'":["'+filterValues+'"]');				
					}
				}// end for i loop
				if(this.asOfPeriodId){
					filterArray.push('"AS_OF_PERIOD_ID":["'+this.asOfPeriodId+'"]');
				}
				var resultQuery = '';			
			
				resultQuery += '{';								
				resultQuery += '"biz_Id":"'+xactlyEdge.configJson.business_id+'",';						
				resultQuery += '"entityName":"'+tab+'",';						
				resultQuery += '"total_count":"",';				
				resultQuery += xactlyEdge.offsetQueryPart();
				resultQuery += xactlyEdge.limitQueryPart();				
				resultQuery += '"filtersMap":{'+filterArray.join(',')+'},';
				resultQuery += '"fieldList":'+columnString+'';
				resultQuery += xactlyEdge.orderbyQueryPart();
				resultQuery += xactlyEdge.PaginationLast();	
				resultQuery += ',"cursorMark":"*"';		
				resultQuery += '}';
				window.logAction(resultQuery, "DEBUG");
	
		        queryArr.push({'objectType':tab, 'fetchQuery':resultQuery} );
		    }
		    config.app.metadata.labels.displayNames = displayNames;
		    queries.dataQueries = queryArr;			
			self.getTotalTabCount(queryArr, queries);			
		};

		this.getTotalTabCount = function(queryArrArr, queries){
			var self = this;
			var responseQuery = [];
			var obj = {};
			for(var d=0; d <= queryArrArr.length; d++){
				var entityName = JSON.parse(queryArrArr[d].fetchQuery).entityName;
				queryArrArr[d].fetchQuery =  JSON.parse(queryArrArr[d].fetchQuery);
				queryArrArr[d].fetchQuery.sortOrder.orderBy= "PERIOD_ORDER_NUMBER";
				queryArrArr[d].fetchQuery.row = 0;
				queryArrArr[d].fetchQuery = JSON.stringify(queryArrArr[d].fetchQuery);
				var resQuery = $.ajax({ 
			        type: "POST",
			        timeout : this.gloablAjaxTimeout,
			        cache: false,	
			        async:false,	
					url: "../../api/advsearch/query",
			        data: queryArrArr[d].fetchQuery,
			        contentType: 'application/json',   
					dataType: 'json',
					success: function(data) {						
						var key = entityName+"Count";
						obj[key]=data.total_count;
						if(d >= (queryArrArr.length -1)){
							self.sendQueriesToIncent(queries, obj);
						}
						
					},
					error: function(d){
						window.logAction('getTotalTabCount ' + d, "DEBUG");		
					}
		    	});
			}
		
			
		//	return responseQuery;
		}
			
		/*
 		 * sendQueriesToIncent : send query and other information to incent via ajax 
		 * param: queries: JSON representation of queries to be passed to incent (in turns incent passes it to XDM)
		 * Returns: message or download link
		 */
		this.sendQueriesToIncent = function (queries, resQuery){
			var self = this;
			
			resQuery.config = JSON.stringify(queries.config);
			resQuery.downloadName = $('#filename').val();
			resQuery.format = $('#fieldType').val();
			resQuery.dataQueries = JSON.stringify(queries.dataQueries);
			//for(var r =0; r<=resQuery)
		   	$.ajax({
		   		data: resQuery,
		     	dataType: 'json',
		     	//timeout : window.gloablAjaxTimeout,
	            success: function(data){
	                if(data.type == 'async'){
	                    self.showMessage(data.message);
						$('#confirm-message').css('color', '#333');
	                    //track("Advance Search Download Complete - ASYNC", {});
						$("#cancelBtn").hide();	
						$("#downloadBtn").hide();
						$("#download-dialog").hide();
						$("#download-modal-container").show().addClass("fade in");	

						if(pageUtils && pageUtils.xRootContainer()){
							try{
								pageUtils.xRootContainer().Notifications.unreadCount += 1;
								pageUtils.xRootContainer().Notifications.updateBadge(pageUtils.xRootContainer().Notifications.unreadCount);
							}catch(e){
							}
						}
						var sentToDownloads = i18n .get('icmadvanced.advsearch', 'sentToDownloads') || 'Sent to Downloads';
						$("#uiActionMsg").showMessage(sentToDownloads);											
	                }else if(data.type == 'sync'){
	                	//track("Advance Search Download Complete - SYNC", {});
			    		self.closeDownload();
	                    var iframe = document.createElement("iframe");
	                    iframe.src = data.url;
	                    iframe.style.display = "none";
	                    document.body.appendChild(iframe);
	                    self.showHideSpinner(false);
	                }else{
	                	//track("Advance Search Download Error 1", {});
	                	$("#download-dialog").hide();
						$("#download-modal-container").show().addClass("fade in");
	                    self.showMessage(data.message);
	                }
	            },
	            error: function(qXHR, textStatus, errorThrown){           	
	                if(qXHR.responseText.indexOf('getXRootContainer') > 0){
						$("#download-dialog").hide();
						$("#download-modal-container").show().addClass("fade in");				
	                    self.showMessage(i18n .get('icmadvanced.advsearch', 'downloadSessionTimeout'));
	                }else if(qXHR.responseText == ''){
						$("#download-dialog").hide();
						$("#download-modal-container").show().addClass("fade in");				
	                    self.showMessage(i18n .get('icmadvanced.advsearch', 'downloadError')); 
	                }else{
						$("#download-dialog").hide();
						$("#download-modal-container").show().addClass("fade in");				
	                    self.showMessage(i18n .get('icmadvanced.advsearch', 'downloadError')); //qXHR.responseText);
	                }
	                //track("Advance Search Download Error 2", {});
	            },
	            type: 'POST',
	            url: "../../api/advsearch/download"
	        });
		};
		
		/*
		 *
		 */		
		this.getDataFromServer = function(query){	
			var self = this;
			var data = {};
		    data.action = "query";
		    data.query = query;
			return Q.when(
			    $.ajax({ 
			        type: "POST",
			        //timeout : window.gloablAjaxTimeout,
			        cache: false,
			        url: "/explorer/api/advsearch/remote",
			        data: JSON.stringify(data),
			        contentType: 'application/json',   
					dataType: 'json'
			    })
			);
		};

		/*
		 *
		 */		
		this.errorCB = function(error){
			this.showMessage(i18n .get('icmadvanced.advsearch', 'downloadError'));
		};
		
		/*
		 *
		 */				
		this.getTabToCount = function(){
			// get the tab to get count from
			if(this.countEmIndex >= this.countEmOrder.length) return null;
			
			var tab = this.countEmOrder[ this.countEmIndex ];
			
			// see if this tab is present in object_order
			var object_order = xactlyEdge.configJson.app.object_order;
			var index = index =  object_order.indexOf(tab);
			
			if(index > -1){
				return tab;
			}else{
				this.countEmIndex++;
				if(this.countEmIndex < this.countEmOrder.length){
					return this.getTabToCount();
				}
			}
			return null;
		};
		
		/*
		 *
		 */		
		this.showMessage =function (message, status, jqXHR){
		    this.showHideSpinner(false);
		    $('#confirm-message').html(message).css('color', 'red').show();
		};
		
		/*
		 *
		 */
		// shows spinner while request is genereted, send and received
		this.showHideSpinner = function (show){
		    if(show) $(".pagespinner").removeClass('hide').show();
		    else $(".pagespinner").addClass('hide');
		};
		
		/*
		 *
		 */		
		// close download popup and clean up inputs
		this.closeDownload = function (){
			window.downloadStarted = false;
			$('#download-dialog').slideUp();
		    $('#filename').val('');
		    $("#confirm-message").html("").hide();
			$("#transparentbkg").hide();
			$("#ok-Btn").addClass("hide");	
			$("#cancelBtn").show();	
			$("#downloadBtn").show();
		};
		
		
	};
	
	var download = new downloadHelper();
	
	$("ok-Btn").on('click', function(){
		download.closeDownload();
	});
	closeDownload = download.closeDownload;	
	return download;
});
