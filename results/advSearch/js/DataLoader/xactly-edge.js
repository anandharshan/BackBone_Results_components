/*jslint smarttabs:true */
define([
	"jquery", "q", "moment", "globalize", "cultures", "sha256", "cacheManager", 'pageUtils', 'config'
], function($, Q, moment, globalize, cultures, sha256, cacheManager, PageUtils, config) {
	/*
	 * ePig query builder and executor for edgespring server. This library holds various components that are used
	 * in generation pig query, send query to server, massage data (once returned) for advance search page.
	 * This lib is kept generic to use in various scenerio.
	 * Caching mechanism is built-in which uses sha256 hash of the query as key and data from server as value.
	 *
	 * Various properties like sort, maxrows, offset, object, etc. are set at instance level and query generator, executore, mapping
	 * are set as prototype function to provide flexbility.
	 *
	 * Query generation built in components (in small parts) and executor is executed in sync via Q.js; a promise/deferred library.
	 * There are four types of query generated: Load query, count query, result query and filter values query
	*/
	window.cacheManager = new Cache(20); // keep it global
	window.gloablAjaxTimeoutSeconds = 20;		// 60 seconds
	window.gloablAjaxTimeout = window.gloablAjaxTimeoutSeconds * 1000;		// 60 seconds
	var XactlyEdge = function XactlyEdgeLib(){

		cacheManager = window.cacheManager;
	
		this.qsfFilter = [];
		this.lastAutoSuggestResult;
		this.isAutoSuggest = false;

		/*
		 * Set the object (orders, bonus, draws, commission, etc.) type for this query, This value needs to be supplied at start time.
		 * It would be good to set this value before each query call
		 * This will be used in query generator to construct the query
		*/
		this.objectType = null;
		this.edgemart = null;
		this.setObjectType = function(objectType) {
			this.objectType = objectType;
			return this;
		};
		this.getObjectType = function(){
			return this.objectType ;
		};
		 
		this.periodCollection = {};
		this.setPeriodCollection = function(collection){
			this.periodCollection = collection;
		},

		this.asOfPeriodId = null;
		this.setAsOfPeriod = function(asOfPeriodId){
			this.asOfPeriodId = asOfPeriodId;
		}
		/*
		 * This sets column ordering of result set, default is PERIOD_ORDER_NUMBER
		 * This will be used in query generator to construct the query
		*/
		this.orderBy = 'PERIOD_ORDER_NUMBER';
		this.setOrderBy = function(orderBy) {
			this.orderBy = orderBy;
			return this;
		};

		/*
		 * Sort order of result set. default is asc
		 * This will be used in query generator to construct the query
		*/
		this.sort = 'desc'; // other value is asc
		this.setSort = function(sort) {
			if(!sort && (sort !== "asc" && sort !== "desc")) throw new Error('Accepted sort values are asc or desc');
			this.sort = sort;
			return this;
		};
		this.sortIndex = -1;  // helper methods
		this.setSortIndex = function(sortIndex) {
			this.sortIndex = sortIndex;
			return this;
		};
		this.getSortIndex = function(){
			return this.sortIndex ;
		};
		/*
		 * This sets filters for given column.
		 * This will be used in query generator to construct the query
		*/
		this.filters = {};
		this.setFilter = function(column, filterValue){
			if(!column || !filterValue) return;
			var objFilterArr = this.filters[column] || [];
			// check if this filtervalue is in array
			if($.inArray(filterValue, objFilterArr) == -1){
				objFilterArr.push(filterValue);
				this.setOffset(0);  // reset offset to zero since new filter was added
			}
			this.filters[column] = objFilterArr;
			return this;
		};

		/*
		 * This removes filters for given column
		 *
		*/
		this.removeFilter = function(column, filterValue){
			var objFilterArr = this.filters[column];
			if(!objFilterArr) return;
			// remove selected filter
			this.filters[column] = jQuery.grep(objFilterArr, function(value) {
				return value != filterValue;
			});
			if(this.filters[column].length != objFilterArr.length){	// filter was removed
				this.setOffset(0); // reset offset to zero since a filter was removed
			}
			return this;
		};

		/*
		 * clear filter values for column
		 *
		 */
		this.clearFilter = function(column){
			var objFilterArr = this.filters[column];
			if(!objFilterArr) return;
			this.filters[column] =[];
			return this;
		};

		/*
		 * clear all filter values
		 *
		 */
		this.clearAllFilter = function(){
			var self = this;
			$.each(this.filters, function(key, value){
				self.clearFilter(key);
			});
			this.setOffset(0); // reset offset to zero since a filter was removed
			return this;
		};

		/*
		 * Max number of row to fetch for a given query. default = 500 (i.e records per page)
		 * This will be used in query generator to construct the query
		*/
		this.maxRows = 500;
		this.setMaxRows = function(maxRows) {
			if(!maxRows || maxRows < 1) maxRows = 500;
			this.maxRows = maxRows;
			return this;
		};
		// last page for pagination on solr
		this.lastPagination = false;
		this.fromPagination = false;
		this.lastFromPagination = false;
		this.lastSortState = 'asc';
		this.firstClicked = true;
		this.lastClicked = false;
		this.newCursorMark = "*";
		this.cursorArr=[];
		this.selectedCol = '';
		this.oldSelectedCol = '';
		this.currPage = 0;
		this.previous = false;
		this.next = false;
		this.data = {};


		/*
		 * Total number of row in this object type (in edgemart)
		 * This will be used in caluclation boundry in offset
		*/
		this.totalRows = -1;
		this.refershDate = "";
		this.setTotalRows = function(totalRows) {
			this.totalRows = totalRows;
			return this;
		};
		this.getTotalRows = function() {
			return this.totalRows;
		};

		/*
		 * offset for result set, default is 0 (i.e. start with 0)
		 * Offset will be incremented automatically by two methods below
		*/
		this.offset = 0;
		this.setOffset = function(offset) {
			this.offset = offset;
			return this;
		};

		/*
		 * Set intial values from config.json
		 */
		this.configJson = null;
		this.colMapping = {};
		this.revColMapping = {};
		this.periodMap = {};
		this.reverseMap = {}; // not Close or Open lable
		this.reversePeriodMap = {};
		this.date_format = "MM/DD/YYYY";
		this.numberFormat = 'en_US';
		this.periods = null;
		this.timeZone = "PST";
		this.processAndLoadConfigJSON = function(data){
			var self = this;
			this.setObjectType(this.configJson.app.object_order[0]);
			if(this.configJson.app.defaults.maxRows) this.setMaxRows(this.configJson.app.defaults.maxRows);
			var mea, key;
			// map colname is result to display name
			for(mea in this.configJson.app.metadata.labels.displayNames){
				this.colMapping[mea] = this.configJson.app.metadata.labels.displayNames[mea];
			}
			$.each(this.colMapping, function(key, value){
				self.revColMapping[value] = key;
			});
			this.periods = this.configJson.app.metadata.labels.keys.PERIOD_ORDER_NUMBER;
			var _period;
			for(key in this.periods){
				this.periodMap[key] = this.periods[key].split(" (")[0];
				_period = this.periodMap[key].toUpperCase();
				this.reverseMap[_period] = key;
				this.reversePeriodMap[ this.periods[key] ] = key;
			}	

			if(this.configJson.incent_preferences){
				this.date_format = this.configJson.incent_preferences.DATE_FORMAT.toUpperCase();
				this.numberFormat = this.configJson.incent_preferences.NUMBER_FORMAT;
				this.timeZone = this.configJson.incent_preferences.TIME_ZONE;
			}
			this.numberFormat = ''+this.numberFormat;
			Globalize.culture( this.numberFormat.replace("_", "-"));

			// set up ping incent ping URL to be fired on ajax complete event

			// init mix panel
			if(this.configJson.mixPanel && this.configJson.mixPanel.MixPanelEnabled && this.configJson.mixPanel.MixPanelToken){
				window.mixpanelToken = this.configJson.mixPanel.MixPanelToken;
				mixpanel.init(window.mixpanelToken);
			}
			// remove rate tier so it stays as an interger rather than converting into float
			this.configJson.data_types.RATE_TABLE_TIER_MEA = 'INTEGER';

			// values for data refresh check interval and number of attempts
			window.unloadDuration = (this.configJson.unloadDuration) ? this.configJson.unloadDuration : 30;
			window.refreshCheckInterval = (this.configJson.refreshCheckInterval) ? this.configJson.refreshCheckInterval : 30;
			window.refreshCheckAttempts = (this.configJson.refreshCheckAttempts) ? this.configJson.refreshCheckAttempts : 3;
		};


		window.previousExpRefTime = null;
		this.checkForNewData = function(data){

			var latestExpRefTime = Date.parse(data.exprefreshtime);
			var unloadEndTime = latestExpRefTime + window.unloadDuration;

			if(isNaN(latestExpRefTime)){
				var test =  Date.parse("2014-03-12T18:32:58+0000");
				return;
			}

			var currentTime = new Date().getTime();
	// do we need to conver to GMT

			var unloadCompleted = false;
			if(currentTime >= latestExpRefTime && currentTime <= unloadEndTime){
				// were in middle of window where explor refresh finished but unload may not have completed yet
				window.previousExpRefTime = 0; // so on nect click banner will be shown
	// Louis: discuss UX and use case for this scenerio

			}else if(window.previousExpRefTime !== null && latestExpRefTime > window.previousExpRefTime){
				window.previousExpRefTime = latestExpRefTime;
				unloadCompleted = true;
			}else{
				window.previousExpRefTime = latestExpRefTime;
			}

			// show banner (you have new data availabel to view, please refresh the page)
			if(unloadCompleted){
				var msg = "New data is availabel to view. Please refresh the page."; //i18n.get('explorer.advsearch', 'newDataAvailable');
				$( "#uiActionMsg" ).showMessage(msg, {showcancel : true});
			}
		};

	};

	/**** start prototype properties ****/

	XactlyEdge.prototype.format = function(number, decimal){
		return Globalize.format( Number(number), "n"+decimal );
	};

	/*
	 * prototype to reset sort, order, filters, offset
	 * reset will affect all instances
	 */
	XactlyEdge.prototype.reset = function(){
		window.cacheManager.clear();
		this.orderBy = 'PERIOD_ORDER_NUMBER';
		this.sort = 'desc';
		this.filters = {};
		this.maxRows = 500;
		this.totalRows = -1;
		this.offset = 0;
		this.sortIndex = -1;
	};

	/*
	 * edgemart string query builder...this is used in load edgemart request
	 * Before executing query edgemart should be loaded in memory.
	 */
	XactlyEdge.prototype.edgeMart = function(){
	};

	/*
	 * create load edgemart part for result query.
	 */
	XactlyEdge.prototype.edgeMartQueryPart = function(){
		var edgeMart = {
			"business_id": this.configJson.business_id,
			"objectType": this.objectType
		}
		return '"edgeMart":'+JSON.stringify(edgeMart)+',';		/* @imp Code has been modified for JSON Object */
	};

	/*
	 * generate filter part of the query
	 * filters are used to get result/records we want while eliminating non-maching data.
	 *
	 */
	XactlyEdge.prototype.filterQueryPart = function(periodFilterQuery, value, column){
		var object = this.configJson.app.objects[this.objectType],
			objFilters = object.filters,
			filtername = null,
			filterValues,
			olen = objFilters.length,
			filterArray = [];
		var filterString = [];

		for(var i = 0; i < olen; i++){
			filtername = objFilters[i];
			filterValues = 'ALL';
			// get filters, if available
			if(filtername === column && column !== 'PERIOD_ORDER_NUMBER'){
				continue;
			}else if(value && periodFilterQuery && filtername === 'PERIOD_ORDER_NUMBER'){
				filterValues = this.matchingPeriods.join('","');				
			} else if(value && this.filters[filtername] && this.filters[filtername].length > 0){
				filterValues = this.filters[filtername].join('","');
			} 
			filterString.push('"'+filtername+'":["'+filterValues+'"]');
			
		}// end for i loop
		return '"filtersMap":{'+filterString.join(', ')+'},';
	};

	/*
	 * generate group by part of the query for count query
	 *
	 */
	XactlyEdge.prototype.groupbyCountQueryPart = function(){
		return "a = group a by all;";
	};

	/*
	 * generate foreach part of the query for count query
	 *
	 */
	XactlyEdge.prototype.foreachCountQueryPart = function(){
		return "a = foreach a generate count() as 'count';";
	};

	/*
	 * Generate counte query
	 */
	XactlyEdge.prototype.countQuery = function(){
		var countQuery = '';
		countQuery += this.edgeMartQueryPart();
		countQuery += this.filterQueryPart();
		countQuery += this.groupbyCountQueryPart();
		countQuery += this.foreachCountQueryPart();
		return countQuery;
	};


	/*
	 * generate foreach part of the query for count query
	 *
	 */
	XactlyEdge.prototype.foreachQueryPart = function(){
		var foreachQpart = "a = foreach a generate",
			object = this.configJson.app.objects[this.objectType],
			columns = object.columns,
			colname = null,
			olen = columns.length;
		var columnString = JSON.stringify(columns);
		return '"fieldList":'+columnString;		//+',';
		/* @imp Code has been modified for JSON Object */
	};

	/*
	 * generate orderby part of the query
	 *
	 */
	XactlyEdge.prototype.orderbyQueryPart = function(){
		/* @imp Code has been modified for JSON Object */
		var sortOrder = {
			"orderBy": this.orderBy,
			"sortType":this.sort
		}
		return ',"sortOrder":'+JSON.stringify(sortOrder);
		/* @imp Code has been modified for JSON Object */
	};
	/**
	* Generate pagination, field for payload - last
	*
	*/

	XactlyEdge.prototype.PaginationLast = function(){
		return ',"last":'+this.lastPagination;
	};

	/**
	* Generate pagination, field for payload - last
	*
	*/


	XactlyEdge.prototype.setCursorMarkByPageId = function(){
		var obj = {"pageNumber":this.currPage, "cursorMark":this.newCursorMark};
		//check if page number is already there then overwrite
		for(var i in this.cursorArr){
			if(this.cursorArr[i].pageNumber &&  this.cursorArr[i].pageNumber == this.currPage){
				delete this.cursorArr[i];
			}
		}
		this.cursorArr.push(obj);
		//Reset everything when sorting
	};

	XactlyEdge.prototype.getCursorMarkByPageId = function(currPage){
		for(var i in this.cursorArr){
			if(this.cursorArr[i].pageNumber && this.cursorArr[i].pageNumber == (currPage)){
				return this.cursorArr[i].cursorMark;
			}
		}
	};

	XactlyEdge.prototype.CursorMark = function(){
		var cursorMark = '"*"';

		if (this.lastPagination == false  && this.currPage==0 ) {
			cursorMark = "*";
			this.currPage++;
		}else if(this.lastPagination==true && this.currPage==0 ){
			cursorMark = "*";
			this.currPage--;
		}else{
			var currPage = this.currPage;
			if(this.next == true){
				if(currPage>0){
					currPage = currPage - 1;
				}else{
					currPage = currPage - (-1);
				}
			}
			if(this.previous == true){
				if(currPage>0){
					currPage = currPage - 1;
				}else{
					currPage = currPage - (-1);
				}
			}

			cursorMark = this.getCursorMarkByPageId(currPage);
			if (typeof(cursorMark) === "undefined") {
				cursorMark = "*";
			}
		}
		return ',"cursorMark":'+JSON.stringify(cursorMark);
	};

	XactlyEdge.prototype.resetPagination= function(){
		this.lastPagination = false;
		this.newCursorMark = "*";
		this.cursorArr=[];
		this.currPage = 0;
		this.previous = false;
		this.next = false;
	};



	/*
	 * generate offset part of the query
	 *
	 */
	XactlyEdge.prototype.offsetQueryPart = function(){
		return '"start":'+this.offset+',';			// offset = start /* @imp Code has been modified for JSON Object */
	};

	/*
	 * generate limit part of the query
	 *
	 */
	XactlyEdge.prototype.limitQueryPart = function(){
		return '"row":'+this.maxRows+',';		/* maxRowsLimit = row */ /* @imp Code has been modified for JSON Object */
	};

	/*
	 * Generate Result query
	 */
	XactlyEdge.prototype.resultQuery = function(){
		var resultQuery = '';
		resultQuery += '{';
		resultQuery += '"biz_Id":"'+this.configJson.business_id+'",';
		resultQuery += '"entityName":"'+this.objectType+'",';
		resultQuery += '"total_count":"",';
		resultQuery += this.offsetQueryPart();
		resultQuery += this.limitQueryPart();
		resultQuery += this.filterQueryPartFoResultQuery();
		resultQuery += this.foreachQueryPart();
		resultQuery += this.orderbyQueryPart();
		resultQuery += this.PaginationLast();
		resultQuery += this.CursorMark();
		resultQuery += '}';
		window.logAction(resultQuery, "DEBUG");
		return resultQuery;
	};

	XactlyEdge.prototype.filterQueryPartFoResultQuery = function(){
		var object = this.configJson.app.objects[this.objectType],
			objFilters = object.filters,
			filtername = null,
			filterValues,
			olen = objFilters.length,
			filterArray = [];

		for(var i = 0; i < olen; i++){
			filtername = objFilters[i];
			filterValues = 'ALL';
			// get filters, if available
			if(this.filters[filtername] && this.filters[filtername].length > 0){
				filterValues = this.filters[filtername].join('","');
			}
			if(filtername == 'PERIOD_ORDER_NUMBER' && filterValues === 'ALL'){
				continue;	
			} else if(filtername === 'PERIOD_ORDER_NUMBER'){
				filterValues = this.getMatchingPeriodIds(this.filters[filtername]);
				filterArray.push('"'+filtername+'":['+filterValues.join(",")+']');
			}else{
				filterArray.push('"'+filtername+'":["'+filterValues+'"]');				
			}
		}// end for i loop
		if(this.asOfPeriodId){
			filterArray.push('"AS_OF_PERIOD_ID":["'+this.asOfPeriodId+'"]');
		}
		return '"filtersMap":{'+filterArray.join(',')+'},';
	};

	XactlyEdge.prototype.getMatchingPeriodIds = function(periodOrderNumbers){
		if(!this.periodCollection || !periodOrderNumbers) return periodOrderNumbers;
		var self = this,
			periodIds = [],
			periodName, model, periodId;

		periodOrderNumbers.forEach(function(periodOrderNumber){
			periodName = self.periodMap[periodOrderNumber]; // get period name
			model = self.periodCollection.findWhere({name: periodName});
			if(model){
				periodId = model.get('id');
			}
			periodIds.push(periodId);
			//console.log(periodOrderNumber, periodName, periodId);
		});
		if(periodIds.length > 0) return periodIds;
		else return periodOrderNumbers;
	};

	window.emResponse = {};		// hold load edgemart response data in global variable, we need this to address big cardinality issue
	window.countResponse = {};	// hold count response in global object, we need this to ensure pagination is consistant

	/*
	 * Generates syncronous pipeline to generate and execute load, count and result query, respectively.
	 * Once the data is returned, it is massaged to fit adv search page (optionally)
	 * Typically your JS code will execute this method to get the results. Everything runs through promise/deferred.
	 * Internal function provide clouser to keep context in-tact.
	 *
	 * query param: this is the query to execute
	 * options param: this contains info skipping load and count query generation and execution and success/error callbacks
	 *
	 */
	XactlyEdge.prototype.pipeline = function(query, options){
		if(!options.successCB) throw new Error('Success callback function required in options. Found '+options.successCB);

		var self = this,
			func = [],			// array to hold function to execute in sync via q.js
			data_types = this.configJson.data_types;	// various data types for data massaging

		// callback for load query execuite
		var storeEMLoadResponse = function(data){
			window.emResponse = data;
		};

		/* @imp Code has been commented to remove GET call on remote URL */
		/* @imp Code has been commented/added */

		// inner function to get count query (inner function maintains context)
		function getCountQuery(){
			return self.countQuery();
		}

		// callback to put count query response in cache and then return data to send to proceeCountResult inner fxn
		function setCountCache(data){
			var shaHash = Sha256.hash(getCountQuery(), true);
			self.setCacheItem(shaHash, data);
			return data;
		}

		// callback to process count query results
		var proceeCountResult = function processCountQuery(data){
			window.countResponse = data;
			if(data.results.records.length> 0){
				window.totalRows = data.results.records[0].count;
			}else{
				window.totalRows = 0;
			}
		};

		// if count query is to be executed, added it to pipeline
		if(options.executeCountQuery){
			func.push(getCountQuery);
		}

		// result query to execute
		function getQuery(){
			return query;
		}

		// callback function in pipline to hold query cache and then return data
		var shaHashQuery = Sha256.hash(query, true);
		function setQueryCache(data){
			var cachedData = self.setCacheItem(shaHashQuery, data);
			return data;
		}
		/* @imp Code has been added to calculate totalRows */
		var totalRowsResult = function processTotalRows(data){
			window.countResponse = data;
			var totalCount = data.total_count;   //94;
			if(totalCount> 0){
				window.totalRows = totalCount;
			} else {
				window.totalRows = 0;
			}
			return data;
		};
		/* @imp Code has been added to calculate totalRows */

		// add result query to pipeline
		func.push(getQuery);
		func.push(self.getDataFromServer);
		func.push(setQueryCache);
		func.push(totalRowsResult);

		// inner fucntion to map values into human readable data
		var mapdisplayvalues = function(data){
			var records = data && data.results && data.results.records;
			window.logAction( "Retrieved "+records.length+ " rows", "DEBUG");
			if(records.length  === 0) return data;
			var unitTypeKey = null;
			var unitTypeSuffix = "_UNIT_TYPE_DISPLAY";
			// get all keys	to we can map amount to currency
			var keys = $.map(records[0], function(value, key) {
			  return key;
			});

			// map all flex fields
			$.each(keys, function(index, value){
			    unitTypeKey = value+unitTypeSuffix;
			    if(unitTypeKey in records[0]){ // add to currencyMap
			        self.currencyMap[value] = unitTypeKey;
			    }
			});

			var newrecords = [], newrecord = {};	// we will be adding massaged data into new property and leave raw data from server intact
			$.each(records , function (index, record){
				newrecord = {};
				if(record.PERIOD_ORDER_NUMBER && self.periodMap[ record.PERIOD_ORDER_NUMBER ]){
					record.PERIOD_ORDER_NUMBER = self.periodMap[ record.PERIOD_ORDER_NUMBER ];
				}

				// this loop combines amount and currency type properties and then deletes the currency type property
				$.each(record, function(key, value) {
					newrecord[key] = value;
					if(data_types && data_types[key] == 'DATE' && value){ // format date
						var value = moment(value).format('YYYY-MM-DD HH:mm:ss');
						var day = moment(value, "YYYY-MM-DD HH:mm:ss");
						if(day && day.isValid()) newrecord[key] = day.format(self.date_format);
					} else if(data_types && data_types[key] == 'INTEGER' && value){ // format number
							newrecord[key] =  self.format(value, 0); //Globalize.format( Number(value), "n2" );
					} else if(data_types && data_types[key] == 'NUMBER' && value){ // format number
						newrecord[key] =  self.format(value, 2); //Globalize.format( Number(value), "n2" );
					}
				    unitTypeKey = self.currencyMap[key];	// get unit_type kye from currencyMap
				    if(!unitTypeKey) return;
					//newrecord[key] = newrecord[key]+ (record[unitTypeKey] ? ' '+record[unitTypeKey] : ''); // combine currency and unit type
					//delete newrecord[value]; // remove unitytpe
				});

				// remove all currency/unit type properties...just rinse it again
				$.each(self.currencyMap, function(key, value){
				//	delete newrecord[value];
				});
				newrecords.push(newrecord);
			});
			data.newrecords = newrecords;
			return data;
		};

		// convert raw data into JSON
		var converToJSON = function(datastr){
			return $.parseJSON(datastr);
		};

		// if mapping needs to be performed, else convert data into JSON.
		if(options.skipMapping !== true){
			func.push(mapdisplayvalues);
		}else{
			func.push(converToJSON);
		}

		// finally add sucess callback to pipeline, this comes from your JS code.
		func.push(options.successCB);

		var result = Q(func[0]()); // start off Q.js execution
		func.splice(0,1);
		func.forEach(function (f) { // execute rest of the function in sync via q.js
		    result = result.then(f, options.errorCB);
		});
		return result;
	};


	/*
	 * filter query when selecting (initial click)
	 * @param : column to perform filter search
	 * @param : value to filter against (null to get all)
	 * @param : offset, default = 0
	 * @param : number of results to return , default = 1000
	 */


	XactlyEdge.prototype.filterQuery = function(column, value, offset, limit){
		var periodFilterQuery;
		if(column == 'PERIOD_ORDER_NUMBER'){
			var matching = this.getMatchingPeriods(value);
			this.matchingPeriods = matching;
			periodFilterQuery = true;
		}

		var requestOfFilter = '';
		requestOfFilter += '{';
		requestOfFilter += '"biz_Id":"'+this.configJson.business_id+'",';
		requestOfFilter += '"entityName":"'+this.objectType+'",';
		requestOfFilter += '"target":"filter",';
		requestOfFilter += '"row":"'+limit+'",';
		requestOfFilter += '"start":"'+offset+'",';
		requestOfFilter += this.filterQueryPart(periodFilterQuery, value, column);
		
		if(value && column !== 'PERIOD_ORDER_NUMBER'){
			requestOfFilter += '"filterValue":"'+value+'",';
		}
		requestOfFilter += '"filterName" :"'+column+'"';
		requestOfFilter += '}';

		window.logAction(requestOfFilter, "DEBUG");
		return requestOfFilter;
	};

	/*
	 * filter query when selecting (initial click)
	 * @param : column to perform filter search
	 * @param : value to filter against (null to get all)
	 * @param : offset, default = 0
	 * @param : number of results to return , default = 1000
	 * @param : success callback function (this is where you will process/render the results)
	 * @param : error callback function (this is where you will handle errors)
	 *
	 * build pipeline --> querygen, execute and pass back results to cbFxn
	 * no edgemart load required since it's be loaded earlier (i.e. you are performing this operation on already loaded edgemart)
	 */

	XactlyEdge.prototype.getFilteredResults = function(column, value, offset, limit, successCB, failCB, isAutoSuggest){
		if(!successCB) throw new Error('Success callback function required');
		var self = this;
		// method to map values
		var mapdisplayvalues = function(data){
			var records = data && data.results && data.results.records;
			window.logAction( "Retrieved "+records.length+ " filter results", "DEBUG");
			var sortedArr = records.sort(function(a, b) {
		        var x = a["PERIOD_ORDER_NUMBER"];
				var y = b["PERIOD_ORDER_NUMBER"];
		        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
		    });

		    if(!self.isAutoSuggest){
		    	self.qsfFilter = [];
		    }

			$.each(records , function (index, object){
				if(object.PERIOD_ORDER_NUMBER){
					// mapping numric PERIOD_ORDER_NUMBER to human readable form
					if(!self.isAutoSuggest){
						self.qsfFilter.push(object.PERIOD_ORDER_NUMBER);
					}
					object.PERIOD_ORDER_NUMBER = self.configJson.app.metadata.labels.keys.PERIOD_ORDER_NUMBER[object.PERIOD_ORDER_NUMBER];
				}
			});
			data.records = records;
			return data;
		};

		return Q.when(self.filterQuery(column, value, offset, limit))
				.then(self.getDataFromServer, failCB)
				.then(mapdisplayvalues, failCB)
				.then(successCB, failCB);
	};

	/*
	 * gets data from server
	 * @param : query to execute
	 * This method receives parameters from Q, a deffered/promise library.
	 */
	XactlyEdge.prototype.getDataFromServer = function(query){
		var self = this;
		var shaHash = Sha256.hash(query, true);
		var cachedData = cacheManager.getItem(shaHash);
		var data = {};

		var targetUrl=""
	    data = JSON.parse(query);
		 if(data.target === "filter"){
			delete data.target;
			if(data.filterValue && data.filterValue!=""){
				if(data.filterValue==0){
					return {"results":{"records":[]}};
				}
				this.xactlyEdge.isAutoSuggest = true;
				return Q.when(
					$.ajax({
						type: "POST",
						timeout : this.gloablAjaxTimeout,
						cache: false,
						url: config.appContext + "/api/advsearch/autosuggest",
						data: JSON.stringify(data),
						contentType: 'application/json',
						dataType: 'json'
					})
				);
			}else{
				this.xactlyEdge.isAutoSuggest = false;
				return Q.when(
					$.ajax({
						type: "POST",
						timeout : this.gloablAjaxTimeout,
						cache: false,
						url: config.appContext + "/api/advsearch/filter ",
						data: JSON.stringify(data),
						contentType: 'application/json',
						dataType: 'json'
					})
				);
			}
		}
		return Q.when(
		    $.ajax({
		        type: "POST",
		        timeout : this.gloablAjaxTimeout,
		        cache: false,
				url: config.appContext + "/api/advsearch/query",
		        data: JSON.stringify(data),
		        contentType: 'application/json',
				dataType: 'json'
		    })
		);
	};

	/*
	 * Set cached items. Cache will hold data for 30 minutes and maximum of 20 records.
	 */
	XactlyEdge.prototype.setCacheItem = function(querySHA, dataToCache){ /* key, value, options*/
		if(cacheEnabled) {
			// will need to move options out if we decide to make it configurable
			var options = {
				expirationAbsolute : new Date(new Date().getTime()+1800000), // 30 minutes
				priority : CachePriority.Normal
			};
			cacheManager.setItem(querySHA, dataToCache, options);
		}
		return dataToCache;
	};

	/*
	 * Get cached item if available
	 */
	XactlyEdge.prototype.getCacheItem = function(querySHA){ /* key, value, options*/
		return cacheManager.getItem(querySHA);
	};

	/*
	 * For text input on filter. Get all matching periods for give string
	 */
	XactlyEdge.prototype.getMatchingPeriods = function(text){
		var matching = [];
		text = text.toUpperCase();
		$.each(this.reverseMap, function(key, value){
			if(key.indexOf(text) > -1) matching.push(value);
		});

		var qsfMatchingArr = [];
		for(var j =0; j < matching.length; j++){
			if(this.qsfFilter.indexOf(matching[j]) !== -1){
				qsfMatchingArr.push(matching[j])
			}
		}
		return matching;
	};

	/*
	 * Capilatize give phrase
	 */
	XactlyEdge.prototype.capitalize = function(phrase) {
		if(!phrase) return phrase;

		var phraseArray = phrase.split(" ");

		var capArr = $.map(phraseArray, function(value, index){
			return value.charAt(0).toUpperCase() + value.slice(1);
		});
		return capArr.join(" ");
	};

	XactlyEdge.prototype.constructor = XactlyEdge;
	XactlyEdge.prototype.TEST_PROP = 'XactlyEdge-TEST_PROP-EXPLORER';	// purely for testing purpose
	XactlyEdge.prototype.filterDelay = 500;  // 1 second				// duration to delay execution of filter query
	XactlyEdge.prototype.filterRows = 1000; // 1000 rows				// number of result to get back

	// map to hold which value (MEA=measure) with currency type
	// update exploreColumnsConfigurer.html if adding/remove items from currencyMap
	XactlyEdge.prototype.currencyMap = unitTypeMap;  // locate in mischelper.js

	return new XactlyEdge();
});
