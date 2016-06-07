define([
  "jquery",
  "ResultsSolrCollection",
  "config",
  "i18n",
  "ColumnFilterConfigs",
  "userConfig"
], function($, ResultsSolrCollection, config, i18n, ColumnFilterConfigs, userConfig) {
	/**
	* A Backbone Collection to submit download request for result data on Solr.
	*   
	* @module ResultsSolrDownloadCollection
	*/
	var ResultsSolrDownloadCollection = ResultsSolrCollection.extend({

		downloadRequest :{},
		
		isDownloadRequest : true,

		namespace : "icmadvanced.results",

		initialize: function(options) {
			this.namespace = options.namespace || this.namespace;
			// set up mappings
			ResultsSolrCollection.prototype.initialize.call(this, options);
			this.prepareColumnsForDownload(); // get columns for download. Overrides ResultsSolrCollection columns
			// generate config 
			this.buildDownloadConfig();
			// get query
			this.downloadRequest.config = JSON.stringify(this.config);
			this.downloadRequest.downloadName = options.fileName;
		},
		
		/**
         *
         */
        prepareColumnsForDownload : function(){
			var self = this,
				prettyName, 
				amountFields;

            // get all columns for this entity/page, even though UI may not need them
            this.incentColumns = _.clone(ColumnFilterConfigs[this.objectType].download);    
            if(this.objectStatus === 'held' && this.objectType.indexOf('held') === -1){
                // get for held entities
                this.incentColumns = _.clone(ColumnFilterConfigs[this.objectType+'_'+this.objectStatus].download);
            }
            //console.log(this.namespace, this.incentColumns);

			this.prettyNames = [];
			this.columns = [];
			this.incentColumns.forEach(function(column){
				// create new columns array
				amountFields = this.amountWithTypesMap[column] && this.amountWithTypesMap[column][this.entityName];
				if(amountFields && amountFields.length > 0){
					this.mapUnitTypes(amountFields);
				}else{
					prettyName = i18n.get(self.namespace, self.entityName+'.'+column) || // get custom downlaod col name
									i18n.get(self.namespace, column) || // or get col name from direct colKey->name mapping
									column; // or just use column key as col name
					this.prettyNames.push(prettyName);

					column = this.getMappedName(column) || column;
					this.columns.push(column);
				}
			}, this);

            this.columns = _.flatten(this.columns);
            this.prettyNames = _.flatten(this.prettyNames);

   //          console.log("len ", this.columns.length, this.prettyNames.length);
			// console.log(this.columns);
			// console.log(this.prettyNames);
        },

		/**
         *
         */		
		mapUnitTypes : function(amountFields){
			var self = this,
				headerNames = [],
				amountPretty, currencyPretty,
				prefix = '',
				columns = _.clone(amountFields);

			if(this.entityName === 'commission' && this.objectStatus === 'release'){
				// remove CREDIT_UNIT_TYPE_ID from commissions -> release
				columns = _.without(columns, 'CREDIT_UNIT_TYPE_ID');
				prefix = 'commission.';
			}else if(this.entityName === 'commission' && this.objectStatus === 'held'){
				// for commission held 
				// remove COMM_AMOUNT_UNIT_TYPE_DISPLAY from commission amount
				// remove COMM_AMOUNT_UNIT_TYPE_DISPLAY from Released Amount amount				
				if(columns.indexOf('COMMISSION_AMOUNT') > -1 ||
						columns.indexOf('RELEASED_AMOUNT') > -1){
					columns = _.without(columns, 'COMM_AMOUNT_UNIT_TYPE_DISPLAY');
				}
				prefix = 'commission.held.';
			}else if(this.entityName === 'paymentresult'){
				// paymentsresults
				// remove ORDER_AMOUNT_UNIT_TYPE_DISPLAY
				// remove BUS_AMOUNT_UNIT_TYPE_DISPLAY
				// remove BUS_GROUP_AMOUNT_UNIT_TYPE_DISPLAY
				// remove ITEM_PAY_CURR_UNIT_TYPE_DISPLAY
				columns = _.without(columns, 'ORDER_AMOUNT_UNIT_TYPE_DISPLAY',
														'BUS_AMOUNT_UNIT_TYPE_DISPLAY',
														'BUS_GROUP_AMOUNT_UNIT_TYPE_DISPLAY', 
														'ITEM_PAY_CURR_UNIT_TYPE_DISPLAY');
				if(columns[0] === 'PAYMENT_CURR_AMOUNT_BKUP'){
					// unit type for this is mapped to two field
					columns[1] = 'ORDER_AMOUNT_UNIT_TYPE_DISPLAY';
				}
				prefix = 'paymentresult.';
			}else {
				// draw, bonus and credit
				prefix = this.entityName+'.';
			}
			this.columns.push(columns);
			headerNames = _.map(columns, function(field){
				return i18n.get(self.namespace, prefix+field) || field;
			});
			this.prettyNames.push(headerNames);
		},

		/**
         *
         */		
		buildDownloadConfig : function(){
			var userPref = userConfig.getPreferences();
			this.config = {
				app : {
					objects : {},
					metadata : {
						labels : {
							displayNames : {},
							keys : {
								PERIOD_ORDER_NUMBER : this.periodMap || {} // created in parent
							},
							formats :{
								dateformat : userPref.rawDateFormat,
								numberformat : userConfig.getNumberFormat(),
								ratedecimals : userPref.commissionRateDecimals,
								timezone: userPref.timeZone
							}
						}
					}	
				},
				"data_types":{
					"RATE_AMOUNT":"ratedecimals",
					"ORDER_DATE":"dateformat",
					"STATUS_DATE":"dateformat",
					"RELEASE_DATE":"dateformat",
					"ESTIMATED_REL_DATE":"dateformat",
					"INCENTIVE_DATE":"dateformat",
					"FINALIZED_DATE":"dateformat",
					"AS_OF_PERIOD":"periodFormat",
					"CREATED_DATE":"dateTimeFormat",
					"ORD_CREATED_DATE":"dateTimeFormat"
				}
			};

			this.config.app.metadata.labels.displayNames[this.entityName] = this.prettyNames;
			this.config.app.objects[this.entityName] = {
				name : this.header.replace(' ', ''),
				columns : this.columns
			};
		},

		/**
         *
         */
		fetch : function(){	
			var self = this;
			this.createQuery();
			this.queryObject.start = 0;
			this.queryObject.row = 0;	

			var dataQueries = [{
				objectType: this.entityName,
				fetchQuery: JSON.stringify(this.queryObject)
			}];
		
			this.downloadRequest.dataQueries = JSON.stringify(dataQueries);
			this.downloadRequest[this.entityName+'Count'] = 999999; // for async request

			$.ajax({
                type: 'POST',
                url: config.appContext + "/api/advsearch/download",
                cache: false,
                dataType: 'json',
                data: this.downloadRequest
            }).done(function(response, textStatus, jqXHR) {
                self.trigger('sync', response, textStatus, jqXHR);  
            }).fail(function(jqXHR, textStatus, errorThrown) {
                self.trigger('error', jqXHR, textStatus, errorThrown);
            });
		},
	});

	return ResultsSolrDownloadCollection;
});
