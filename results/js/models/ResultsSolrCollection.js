define([
    "underscore",
    "SolrCollection",
    "config",
    "ColumnFilterConfigs"
], function(_, SolrCollection, config, ColumnFilterConfigs) {

    /**
     * A Backbone collection that holds and fetches results page data fro Solr.
     * Returned list is consumed by {@link module:ResultsSolrCollection}
     *
     * @module ResultsSolrCollection
     */
    var ResultsSolrCollection = SolrCollection.extend({

        
        /**
         * Mapping of property in result page to property in solr.
         * For solr property name is specific to entityName (i.e commission, credit, etc.),
         * a schema with entityName is used to differentiate correct mapping. 
         * Example: (see amount)
         * 'nameOfProperty' :{
         *      entityName: 'nameOfPropertyInSolr'
         * }
         * entityName is set during initialization. 
         *
         * @type {Object}
         */
        mappingToSolr :{
            'periodId' : 'PERIOD_ID',
            'period' : 'PERIOD_ORDER_NUMBER',
            'periodId' : 'PERIOD_ORDER_NUMBER',
            'commentCount' : 'COMMENT_COUNT',

            'amountUnitTypeId' : {
                'commission' : 'COMM_AMOUNT_UNIT_TYPE_DISPLAY',
                'credit' : 'CR_AMOUNT_UNIT_TYPE_DISPLAY',
                'bonus' : 'BONUS_AMOUNT_UNIT_TYPE_DISPLAY',
                //'draw' : 'PAY_AMOUNT_UNIT_TYPE_DISPLAY',
                'paymentresult' : 'PAYMENT_AMOUNT_UNIT_TYPE_DISPLAY',
                'orders' : 'ORD_AMOUNT_UNIT_TYPE_DISPLAY'
            },
            'amount' : {
                'commission' : 'COMMISSION_AMOUNT',
                'credit' : 'CREDIT_AMOUNT',
                'bonus' : 'BONUS_AMOUNT',
                //'draw' : 'PAY_AMOUNT',
                'paymentresult' : 'PAYMENT_CURR_AMOUNT',
                'orders' : 'AMOUNT'
            },
            originaAmountWithUnitType :{
                'commission' : 'COMMISSION_AMOUNT',
            },

            'name' : 'NAME',
            'participantName' : "PARTICIPANT_NAME", 
            'positionName' : "POSITION_NAME", 
            'orderCode' : 'ORDER_CODE',
            'orderItemCode' : 'ITEM_CODE',
            'held' : 'IS_HELD',
            'businessGroup' : 'BUSINESS_GROUP_NAME', 
            'earningGroup' : 'EARNING_GROUP_NAME', 
            'ruleName' : 'RULE_NAME', 
            'quotaPeriodType' : 'QUOTA_PERIOD_TYPE_NAME', 
            'paymentFX' : 'PAYMENT_FX',
            'createdDate' : "CREATED_DATE", 
            'releaseDate' : "RELEASE_DATE", 
            'creditApplied' : "CREDIT_APPLIED",
            'attainmentValue' : 'ATTAINMENT_VALUE', 
            'incentiveDate' : 'INCENTIVE_DATE',
            'measureValue' : 'MEASURE_VALUE', 
            'periodName' : 'PERIOD_NAME', 
            'quotaName' : 'QUOTA_NAME', 
            'rateTableName' : 'RATE_TABLE_NAME',
            'rateTableTier' : 'RATE_TABLE_TIER', 
            'rollingAttainmentValue' : 'ROLL_ATTAINMENT_VALUE', 
            'rollingMeasureValue' : 'ROLL_MEASURE_VALUE',
            'productName' : 'PRODUCT_NAME', 
            'customerName' : 'CUSTOMER_NAME', 
            'geoName' : 'GEOGRAPHY_NAME', 
            'reasonCodeName' : 'REASON_CODE_NAME',
            'processedPeriod' : 'PERIOD_ID',         
            'estimatedReleaseDate' : 'ESTIMATED_REL_DATE', 
            'creditType' : 'CREDIT_TYPE_NAME', 
            'inputType' : 'INPUT_TYPE_VALUE',
            'rateAmount' : 'RATE_AMOUNT',
            'creditAmount' : 'CREDIT_AMOUNT',
            'releasedAmount' : 'RELEASED_AMOUNT',
            'heldAmount' : 'HELD_AMOUNT',
            'source' : {
                commission :[ 'COMM_SOURCE' ]
            },

            // fields unique to balances
            'balanceType' : 'BALANCE_TYPE',
            "periodBalanceFrom" : 'AMOUNT', 
            "periodBalanceTo" : 'AMOUNT', 
            "previousBalanceFrom" : 'PREVIOUS_BALANCE', 
            "previousBalanceTo" : 'PREVIOUS_BALANCE', 
            "recoveredBalanceFrom" : 'RECOVERED_BALANCE', 
            "recoveredBalanceTo" : 'RECOVERED_BALANCE', 
            "remainingBalanceFrom" : 'TOTAL_BALANCE', 
            "remainingBalanceTo" : 'TOTAL_BALANCE',

            // fields unique to payments
            'status' : 'PAYMENT_STATUS', 
            'paymentType' : 'SOURCE_TYPE',
            'finalized' : 'IS_FINAL',
            'itemPaymentFXRate' : 'ITEM_PAY_CONV_RATE',
            'businessGroupFXRate' : 'BUS_GROUP_CONV_RATE',
            'businessFXRate' : 'BUS_CONVERSION_RATE',
            'commissionResultName': 'COMMISSION_NAME',
            'creditName' : 'CREDIT_NAME_FROM_COMM',
            'bonusResultName' : 'BONUS_NAME',
            'paymentFXRate' : 'CONVERSION_RATE',
            
            // fields unique to draws
            'drawType' : 'DRAW_TYPE',
            'drawName' : 'DRAW_NAME',
            'finalizedDate' : 'FINALIZED_DATE',
            'projectedAmount' : 'PROJECTED_AMOUNT',
            'payAmount' : 'PAY_AMOUNT',

            // fields unique to orders
            'assignment' : 'ASSIGNMENT',
            'description' : 'DESCRIPTION',
            'quantity' : "QUANTITY",
            'batchName' : "BATCH_NAME1",
            'batchType' : "BATCH_TYPE",
            'discount' : "DISCOUNT",
            'orderTypeId' : "ORDER_TYPE_NAME",
            'orderDate' :  "ORDER_DATE",
            'relatedItemCode' : "RELATED_ITEM_CODE",
            'statusDate' : "STATUS_DATE",
            'itemStatus' : "ITEM_STATUS",
            'splitAmountPercentTotal': "SPLT_AMT_PCT_TOTAL",
            'relatedOrderCode' : "RELATED_ORDER_CODE"
        },

        dateRangeMap :{
            'estReleaseDate-fromDate' : 'estReleaseDate-toDate', 
            'incentiveDate-fromDate' : 'incentiveDate-toDate',
            'finalizedDate-fromDate' : 'finalizedDate-toDate'
        },

        incentSolrDateMap :{
            'estReleaseDate-fromDate' : 'ESTIMATED_REL_DATE',
            'incentiveDate-fromDate': 'INCENTIVE_DATE',
            'finalizedDate-fromDate' : 'FINALIZED_DATE'
        },

        amountRangeMap :{
            //payments
            'bizPaymentFrom' : 'bizPaymentTo',
            'paymentFrom' : 'paymentTo', 
            'bizGroupPaymentFrom' : 'bizGroupPaymentTo', 
            'itemPaymentFrom' : 'itemPaymentTo',
            
            //balances
            'periodBalanceFrom' : 'periodBalanceTo',
            'previousBalanceFrom' : 'previousBalanceTo',
            'recoveredBalanceFrom' : 'recoveredBalanceTo',
            'remainingBalanceFrom': 'remainingBalanceTo',

            //draws
            'eligibleAmountFrom': 'eligibleAmountTo',
            'payAmountFrom': 'payAmountTo',
            'balanceFrom': 'balanceTo'
        },

        incentSolrAmountMap : {
            //payments
            'paymentFrom' : 'PAYMENT_CURR_AMOUNT', 
            'bizPaymentFrom' : 'BUS_AMOUNT',
            'bizGroupPaymentFrom' : 'BUS_GROUP_AMOUNT', 
            'itemPaymentFrom' : 'ITEM_PAY_CURR_AMT', 

            //balances
            'periodBalanceFrom' : 'AMOUNT',
            'previousBalanceFrom' : 'PREVIOUS_BALANCE',
            'recoveredBalanceFrom' : 'RECOVERED_BALANCE',
            'remainingBalanceFrom': 'TOTAL_BALANCE',

            //draws
            'eligibleAmountFrom': 'PROJECTED_AMOUNT',
            'payAmountFrom': 'PAY_AMOUNT',  
            'balanceFrom': 'BALANCE'  
        },

        incentSolrUnitTypeMap : {
            // credits
            'originaAmountWithUnitType-unitType' : 'COMM_AMOUNT_UNIT_TYPE_DISPLAY',
            
            //payments
            "bizPaymentFrom-unitType" : "BUS_AMOUNT_UNIT_TYPE_ID",
            'paymentFrom-unitType' : 'PAYMENT_CURR_UNIT_TYPE_ID', 
            'bizGroupPaymentFrom-unitType' : 'BUS_GROUP_AMOUNT_UNIT_TYPE_ID', 
            'itemPaymentFrom-unitType' : 'ITEM_PAY_CURR_UNIT_TYPE_ID',
            
            //balances
            "periodBalanceFrom-unitType" : 'AMOUNT_UNIT_TYPE_DISPLAY', 
            "previousBalanceFrom-unitType" : 'PREVIOUS_BALANCE_UNIT_TYPE_DISPLAY', 
            "recoveredBalanceFrom-unitType" : 'RECOVERED_BALANCE_AMOUNT_UNIT_TYPE_DISPLAY', 
            "remainingBalanceFrom-unitType" : 'TOTAL_BALANCE_UNIT_TYPE_DISPLAY', 

            // draws
            'eligibleAmountFrom-unitType': 'PROJECTED_AMOUNT_UNIT_TYPE_DISPLAY',
            'payAmountFrom-unitType': 'PAY_AMOUNT_UNIT_TYPE_DISPLAY', 
            'balanceFrom-unitType': 'BALANCE_UNIT_TYPE_DISPLAY' 
        },

        amountWithTypesMap : {
            'amountWithUnitType' : {
                "commission" : ['COMMISSION_AMOUNT','COMM_AMOUNT_UNIT_TYPE_DISPLAY'],
                "credit" : ['CREDIT_AMOUNT','CR_AMOUNT_UNIT_TYPE_DISPLAY'],
                "bonus" : ['BONUS_AMOUNT','BONUS_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            'originaAmountWithUnitType' : {
                "commission" : ['COMMISSION_AMOUNT','COMM_AMOUNT_UNIT_TYPE_DISPLAY']
            },            
            'creditAmountWithUnitType' : {
                "commission" : ['CREDIT_AMOUNT','CREDIT_UNIT_TYPE_ID']
            },
            'heldAmountWithUnitType' : {
                "commission" : ['HELD_AMOUNT','COMM_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            'releaseAmountWithUnitType' : {
                "commission" : ['RELEASED_AMOUNT','COMM_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            'rateWithUnitType' : {
                "commission" : ['RATE_AMOUNT']
            },     
            //payments
            "itemPaymentWithUnitType" : {
                "paymentresult" : ['ITEM_PAY_CURR_AMT', 'ITEM_PAY_CURR_UNIT_TYPE_DISPLAY']
            },
            "itemAmountWithUnitType" : {
                "paymentresult" : ['ORDER_AMOUNT','ORDER_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            "drawBalanceWithUnitType" : {
                "paymentresult" : ['DRAW_BALANCE', 'DRAW_UNIT_TYPE_DISPLAY']
            },
            "paymentBalanceWithUnitType" : {
                "paymentresult" : ['BCF_BALANCE', 'BCF_UNIT_TYPE_DISPLAY']
            },
            "paymentWithUnitType" : {
                "paymentresult" : ['PAYMENT_CURR_AMOUNT', 'PAYMENT_CURR_UNIT_TYPE_DISPLAY']
            },
            "negativePaymentWithUnitType" : {
                "paymentresult" : ['PAYMENT_CURR_AMOUNT_BKUP', 'PAYMENT_CURR_UNIT_TYPE_DISPLAY']
            },
            "businessGroupPaymentWithUnitType" : {
                "paymentresult" : ['BUS_GROUP_AMOUNT', 'BUS_GROUP_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            "businessPaymentWithUnitType" : {
                "paymentresult" : ['BUS_AMOUNT', 'BUS_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            "drawPaymentWithUnitType" : {
                "paymentresult" : ['DRAW_PAY_AMOUNT', 'DRAW_UNIT_TYPE_DISPLAY']
            },

            // balances
            'periodBalanceWithUnitType' : {
                "balances" : ['AMOUNT', 'AMOUNT_UNIT_TYPE_DISPLAY']
            },
            'prevBalanceWithUnitType' : {
                "balances" : ['PREVIOUS_BALANCE', 'PREVIOUS_BALANCE_UNIT_TYPE_DISPLAY']
            },
            'recoveredBalanceWithUnitType' : {
                "balances" : ['RECOVERED_BALANCE', 'RECOVERED_BALANCE_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            'remainingBalanceWithUnitType' : {
                "balances" : ['TOTAL_BALANCE', 'TOTAL_BALANCE_UNIT_TYPE_DISPLAY']
            },
            //draws
            'eligibleAmountWithUnitType' : {
                "draw" : ['PROJECTED_AMOUNT', 'PROJECTED_AMOUNT_UNIT_TYPE_DISPLAY']
            }, 
            'payAmountWithUnitType' : {
                "draw" : ['PAY_AMOUNT', 'PAY_AMOUNT_UNIT_TYPE_DISPLAY']
            },
            'balanceWithUnitType' :{
                "draw" : ['BALANCE', 'BALANCE_UNIT_TYPE_DISPLAY']
            }
        },

        miscMapping : {
            'itemCode' : 'ITEM_CODE',
            'estReleaseDate' : 'ESTIMATED_REL_DATE',
            'businessGroupName' : 'BUSINESS_GROUP_NAME', 
            'actualReleaseDate' : 'RELEASE_DATE',
            'reasonCode' : 'REASON_CODE_NAME',
            'batchType.name' : 'BATCH_TYPE'
        },

        idFieldMap : {
            'commission' : 'COMMISSION_ID',
            'bonus' : 'BONUS_ID',
            'credit': 'CREDIT_ID',
            'paymentresult' : 'PAYMENT_ID',
            'balances' : 'BALANCE_OWED'
        },

        solrToIncentMap : {
            'COMM_AMOUNT_UNIT_TYPE_DISPLAY' : 'amountUnitTypeId',
            'COMMISSION_AMOUNT' : 'amount',
            'COMM_SOURCE' : 'source',
            'RELEASED_AMOUNT' : 'releasedAmount',
            'CREDIT_AMOUNT' : 'amount',
            'CR_AMOUNT_UNIT_TYPE_DISPLAY' : 'amountUnitTypeId',
            
            'BUS_CONVERSION_RATE' : 'busConversionRate',
            'BUS_GROUP_CONV_RATE' : 'busGroupConvRate',
            'ITEM_PAY_CONV_RATE' : 'itemPaymentConvRate',
            'BUSINESS_GROUP_NAME' : 'businessGroup',
            'ORDER_AMOUNT' : 'itemAmount',
            'ORDER_AMOUNT_UNIT_TYPE_DISPLAY' : 'itemAmountUnitTypeId',
            'DRAW_BALANCE' : 'drawBalances',
            'DRAW_UNIT_TYPE_DISPLAY' : 'drawBalanceUnitTypeId',
            'BCF_BALANCE' : 'bcfBalance',
            'BCF_UNIT_TYPE_DISPLAY' : 'bcfBalanceUnitTypeId', 
            'PAYMENT_CURR_AMOUNT' : 'payment',
            'PAYMENT_CURR_UNIT_TYPE_DISPLAY' : 'paymentCurrencyAmountUnitTypeId',
            'PAYMENT_CURR_AMOUNT_BKUP' : 'paymentCurrencyAmountBkup', 
            'ITEM_PAY_CURR_AMT' : 'itemPaymentAmt', 
            'ITEM_PAY_CURR_UNIT_TYPE_DISPLAY' : 'itemPaymentAmtUnitTypeId',
            'BUS_GROUP_AMOUNT' : 'businessGroupAmount', 
            'BUS_GROUP_AMOUNT_UNIT_TYPE_DISPLAY' : 'businessGroupAmountUnitTypeId',
            'BUS_AMOUNT' : 'businessAmount', 
            'BUS_AMOUNT_UNIT_TYPE_DISPLAY' : 'businessAmountUnitTypeId',
            'DRAW_PAY_AMOUNT' : 'drawProjectedAmount', 
            'IS_FINAL' : 'paymentFlag',
            'SOURCE_TYPE' : 'sourceType',
            'CONVERSION_RATE' : 'conversionRate',

            // balances
            'AMOUNT' : 'balance', 
            'PREVIOUS_BALANCE' : 'bcfPreviousBalance', 
            'RECOVERED_BALANCE' : 'paymentAmount', 
            'TOTAL_BALANCE' : 'totalBalance', 
            'PAY_AMOUNT_UNIT_TYPE_DISPLAY' : 'drawUnitTypeId',
            'AMOUNT_UNIT_TYPE_DISPLAY' : 'unitTypeId'
        },

        balanceTypeMap :{
            'Incentive' : 'BCF',
            'Draw' : 'DRAW',
            'Prior_Period' : 'PPA_BALANCE'
        },

        paymentTypeMap :{
            'COMMISSION' : 'COMMISSION',
            'MANUAL_PAYMENT' : 'MANUAL_PAYMENT',
            'Draw' : 'DRAW',
            'BCF' : 'BCF',
            'BONUS' : 'BONUS',
            'PPA' : 'PPA'
        },

        drawTypeMap : {
            "0" : "Non-Recoverable Guarantee",
            "1" : "Non-Recoverable",
            "3" : "Recoverable Guarantee",
            "2" : "Recoverable"
        },

        /**
         *
         */
        initialize: function(options) {
            var self = this,
                value;

            this.reverseDateRangeMap = _.invert(this.dateRangeMap);
            this.reverseAmountRangeMap = _.invert(this.amountRangeMap);
            this.createPeriodMap();

            this.mappingToSolrReversed = {};
            _.keys(self.mappingToSolr).forEach(function(key){
                if(typeof self.mappingToSolr[key] === 'object'){
                    _.keys(self.mappingToSolr[key]).forEach(function(entity){
                        self.mappingToSolrReversed[ self.mappingToSolr[key][entity] ] = key;
                    });
                }else{
                    self.mappingToSolrReversed[ self.mappingToSolr[key] ] = key;
                }
            });

            this.solrUnitTypeColNames = _.values(this.mappingToSolr['amountUnitTypeId']);

            SolrCollection.prototype.initialize.call(this, options);

            this.prepareColumnsForSearch();
            //console.log("length ", this.columns.length, this.columns)            
        },
        /**
         *
         */
        prepareColumnsForSearch : function(){
            var self = this;
            // get all columns for this entity/page, even though UI may not need them
            this.columns = ColumnFilterConfigs[this.objectType].columns;    
            if(this.objectStatus === 'held' && this.objectType.indexOf('held') === -1){
                // get for held entities
                this.columns = ColumnFilterConfigs[this.objectType+'_'+this.objectStatus].columns;
            }
            //console.log(this.entityName, this.objectType, this.objectStatus);
            //console.log("length ", this.columns.length, this.columns)
            this.columns = _.map(this.columns, function(column){
                return self.getMappedName(column);  // convert incent name to solr
            });
            // add columns we need but there are not directly impacting UI or user
            if(this.idFieldMap[this.entityName]){
                this.columns.push(this.idFieldMap[this.entityName]);
            }
            this.columns = _.union(this.columns, ['PPA_AS_OF','DATA_AS_OF','PERIOD_ID', 'EMP_STATUS_CODE', 'COMMENT_COUNT']);   
            this.columns = _.flatten(this.columns);
            if(this.columns.indexOf('PPA_AS_OF') === -1){
                this.columns.push('PPA_AS_OF');
            }
        },

        /**
         * We are remapping some field. When we remove breadcrum the fields are mapped
         * and that leads to duplication.
         */
        reMapSolrFields : function(){   
            var indexOfTypeField = this.params.searchfield.indexOf('IS_HELD');
            if(indexOfTypeField > -1){
                this.params.searchfield[indexOfTypeField] = 'type';
                if(this.params.searchtext[indexOfTypeField] === 'No'){
                    this.params.searchtext[indexOfTypeField] = 'release';
                }else{
                    this.params.searchtext[indexOfTypeField] = 'held';
                }
            }

            indexOfTypeField = this.params.searchfield.indexOf('PERIOD_ORDER_NUMBER');
            if(indexOfTypeField > -1){
                this.params.searchfield[indexOfTypeField] = 'periodId';
            }
        },

        /**
         *
         *
         */
        constructAmountRange : function(field){
            var fromAmount, toAmount,
                fromIndex, toIndex,
                solrFieldName,
                solrFieldValue = null;

            //get fieldNames
            fromAmount = field;
            toAmount = this.amountRangeMap[field];
            if(!toAmount){
                fromAmount = this.reverseAmountRangeMap[field];
                toAmount = field;
            }

            solrFieldName = this.incentSolrAmountMap[fromAmount];
            if(!solrFieldName){
                throw Error("Incent field name "+field+" is not mapped for Solr");
            }

            // get index in searchfield
            fromIndex = this.params.searchfield.indexOf(fromAmount);
            toIndex = this.params.searchfield.indexOf(toAmount);

            // check values for both present
            if(fromIndex > -1 && toIndex > -1){
                // range present 
                solrFieldValue = [ this.params.searchtext[fromIndex],
                                    this.params.searchtext[toIndex] ];
            }else if(fromIndex > -1 && toIndex === -1){
                // only from Amount present
                solrFieldValue = [ this.params.searchtext[fromIndex], '*'];
            }else if(fromIndex === -1 && toIndex > -1){
                // only to Amount prsent
                solrFieldValue = ['*', this.params.searchtext[toIndex] ];
            }else{
                throw Error("Parameter value for "+field+ " not present.");
            }
            if(this.solrRange.indexOf(solrFieldName) === -1){
                this.solrRange.push(solrFieldName);
                this.solrRangeValue.push(solrFieldValue);
            }
        },

        /**
         *
         *
         */
        constructDateRange : function(field){
            var fromDate, toDate,
                fromIndex, toIndex,
                fromValue, toValue,
                solrFieldName,
                solrFieldValue = null;


            //get fieldNames
            fromDate = field;
            toDate = this.dateRangeMap[field];
            if(!toDate){
                fromDate = this.reverseDateRangeMap[field];
                toDate = field;
            }

            solrFieldName = this.incentSolrDateMap[fromDate];
            if(!solrFieldName){
                throw Error("Incent field name "+field+" is not mapped for Solr");
            }

            // get index in searchfield
            fromIndex = this.params.searchfield.indexOf(fromDate);
            toIndex = this.params.searchfield.indexOf(toDate);

            // check values for both present
            if(fromIndex > -1 && toIndex > -1){
                // range present 
                solrFieldValue = [ this.convertToSolrDate(this.params.searchtext[fromIndex]),
                                    this.convertToSolrDate(this.params.searchtext[toIndex], false, true) ];
            }else if(fromIndex > -1 && toIndex === -1){
                // only from date present
                solrFieldValue =  [this.convertToSolrDate(this.params.searchtext[fromIndex]),
                                    this.convertToSolrDate(this.params.searchtext[fromIndex], false, true)
                                    ];
            }else if(fromIndex === -1 && toIndex > -1){
                // only to date prsent
                solrFieldValue = [this.convertToSolrDate(this.params.searchtext[toIndex]),
                                    this.convertToSolrDate(this.params.searchtext[toIndex], false, true) ];
            }else{
                throw Error("Parameter value for "+field+ " not present.");
            }
            if(this.solrRange.indexOf(solrFieldName) === -1){
                this.solrRange.push(solrFieldName);
                this.solrRangeValue.push(solrFieldValue);
            }
        },

        /**
         *
         *
         */
        convertToSolrDate : function(value, daylight, endOfDay){
            if(!value)  return value;
            
            if(daylight) daylight = 7;
            else daylight = 8;

            var arr = value.split('/');
            if(arr.length === 3){
                if(endOfDay){
                    value = arr[2]+'-'+arr[0]+'-'+arr[1]+'T23:59:59Z';  // format date so solr can understand
                }else{
                    value = arr[2]+'-'+arr[0]+'-'+arr[1]+'T0'+daylight+':00:00Z';  // format date so solr can understand                    
                }
            }
            return value;
        },

        /**
         *
         *
         */
        generateFilters : function(){  
            this.solrFields = [];
            this.solrValues = [];
            this.solrRange = [];
            this.solrRangeValue = [];
            this.filterMap = {};
            var filterArr, unitTypeParamName, unitTypeParamValue, convertedValue;

            // console.log(this.params.searchfield );
            // console.log(this.params.searchtext );
            // console.log("\n" );

            this.reMapSolrFields();     
            this.params.searchfield.forEach(function(field, index){              
                // date range
                if(this.dateRangeMap[field] || this.reverseDateRangeMap[field] ){
                    this.constructDateRange(field);
                } else if(this.amountRangeMap[field] || this.reverseAmountRangeMap[field] ){
                    this.constructAmountRange(field);
                } else if(this.incentSolrUnitTypeMap[field]){
                    unitTypeParamName = this.incentSolrUnitTypeMap[field];
                    this.solrFields.push(unitTypeParamName);
                    unitTypeParamValue = config.unitTypeObject[ this.params.searchtext[index] ];
                    this.solrValues.push(unitTypeParamValue);
                } else if(this.mappingToSolr[field]){
                    if(typeof this.mappingToSolr[field] === 'object'){
                        //console.log(field, this.entityName, this.mappingToSolr[field][this.entityName])
                        this.solrFields.push(this.mappingToSolr[field][this.entityName]);
                    }else{
                        this.solrFields.push(this.mappingToSolr[field]);
                    }
                    convertedValue = this.convertValue( field, this.params.searchtext[index] );
                    this.solrValues.push( convertedValue );
                } else if(field === 'type' && this.solrFields.indexOf("IS_HELD") === -1){
                    this.solrFields.push("IS_HELD");
                    if(this.params.searchtext[index] === 'held'){
                        this.solrValues.push("Yes");
                    }else{
                        this.solrValues.push("No");                        
                    }
                } else if(field === 'AS_OF_PERIOD_ID'){
                    var asOfIndex = this.solrFields.indexOf('AS_OF_PERIOD_ID');
                    if(asOfIndex > -1){
                        this.solrValues[asOfIndex] = this.params.searchtext[index];
                    }else {
                        this.solrFields.push(field);
                        this.solrValues.push(this.params.searchtext[index]);
                    }
                } else if(this.miscMapping[field]){
                    // or it's part of miscelleneous mapping...rare condition
                    this.solrFields.push(this.miscMapping[field]);
                    convertedValue = this.convertValue( field, this.params.searchtext[index] );
                    this.solrValues.push(convertedValue);
                } else {
                    console.log("NOT FOUND ", index, field, this.params.searchtext[index]);
                    throw Error("Incent field name "+field+" is not mapped for Solr");
                }
            }, this);
            // console.log("\n" );
            // console.log(this.params.solrFields );
            // console.log(this.params.solrValues );

            this.createInitialFilters();    // reset filters
            this.solrFields.forEach(function(field, index){
                filterArr = this.filterMap[field] || []; 
                filterArr.push(this.solrValues[index]);
                this.filterMap[field] = filterArr;
            }, this);

            return this.filterMap;
        },

        /**
         * This method is dependent on generateFilters above. 
         * Make sure generateFilters is ran before calling this. See Solr Collection.
         */
        generateRanges : function(){
            this.rangeMap = {};
            this.solrRange.forEach(function(field, index){
                this.rangeMap[field] = this.solrRangeValue[index];
            }, this);
            return this.rangeMap;
        },

        /**
         *
         *
         */
        convertValue : function(field, value){
            if(field.indexOf('UnitType') > -1){
                value = config.unitTypeObject[value]; // usually ISO currency code
            }else if(field === 'quotaPeriodType' && value){
                value = value.toUpperCase(); 
            }else if(field.indexOf('Date') > -1 && value){
                value = this.convertToSolrDate(value);
            }else if(field === 'balanceType'){
                value = this.balanceTypeMap[value];
            }else if(field === 'drawType'){
                value = this.drawTypeMap[value];
            }else if(field === 'paymentType'){
                value = this.paymentTypeMap[value];
            }
            return value;
        },

        /**
         * get mapped name in Solr collection and pass it along to parent method
         * for sorting.
         */
        setSort: function(sortBy, sortOrder){
            var clonedSort = _.clone(sortBy);
            if(typeof clonedSort === 'object'){
                sortBy = clonedSort.name;
                sortOrder = clonedSort.sort;
            }
            config.sortBy = _.clone(sortBy);
            config.sortOrder = sortOrder;

            sortBy = this.getMappedName(sortBy);
            if(Array.isArray(sortBy)){
                sortBy = sortBy[0];
            }
            this.trigger("sortCollection", config.sortBy, config.sortOrder);
        },

        /**
         *
         *
         */
        sortOrder : function(sortOrder){
            var sortBy = config.sortBy || this.params.sortBy;
            sortBy = this.getMappedName(sortBy);
            if(Array.isArray(sortBy)){
                sortBy = sortBy[0];
            }
            return {
                "orderBy": sortBy,
                "sortType": sortOrder || config.sortOrder || this.params.sortOrder
            };
        },

        /**
         * get's mapped name of property in result page to property in Solr collection
         *
         */
        getMappedName : function(nameFromResultPage){
            var incentFieldName = nameFromResultPage;

            if(this.mappingToSolr[nameFromResultPage] && 
                typeof this.mappingToSolr[nameFromResultPage] === 'object'){
                // solr mapping is available and it's an object
                nameFromResultPage = this.mappingToSolr[nameFromResultPage][this.entityName];
            }else if(this.mappingToSolr[nameFromResultPage]){
                // solr mapping is available and it's a string (most likely) else check for type
                nameFromResultPage = this.mappingToSolr[nameFromResultPage];
            }else if(this.amountWithTypesMap[nameFromResultPage]){
                // computed properties from amountWithUnityType since they are special
                nameFromResultPage = this.amountWithTypesMap[nameFromResultPage][this.entityName];
            }else if(this.miscMapping[nameFromResultPage]){
                // or it's part of miscelleneous mapping...rare condition
                nameFromResultPage = this.miscMapping[nameFromResultPage];
            }
            //console.log(incentFieldName, nameFromResultPage, this.amountWithTypesMap[nameFromResultPage])
            return nameFromResultPage;
        },

        /**
         * get mapped name in Solr collection and pass it along to parent method
         * for filters.
         */
        setFilter : function(filterName, filterValue, multi){
            var mappedName = this.getMappedName(filterName);
            SolrCollection.prototype.setFilter.call(this, mappedName, filterValue, multi);
        },

        /**
         * Remove filter 
         */
        removeFilter: function(filterName, filterValue, options){
            //var mappedName = this.getMappedName(filterName);
            SolrCollection.prototype.removeFilter.call(this, filterName, filterValue, options);
        },

        /**
         * map certain property such as period 
         *
         */
        mapProperties : function(records){
            var periodNumber;
            records.forEach(function(record, index){
                record.id = index;
                record.isHeld = (record.IS_HELD === 'Yes') ? true : false;
                this.mapUnityTypeToId(record);
                this.mapPropertyNames(record);
            }, this);
        },

        /**
         * map solr property name to result page property names
         *
         */
        mapPropertyNames : function(record){
            if(!this.periodMap){
                this.createPeriodMap();
            }
            _.keys(record).forEach(function(key){
                if(key.toLowerCase().indexOf('date') > -1 && key.toLowerCase() !== 'created_date'){
                    record[key] = record[key] && record[key].split(' ')[0];
                }
                if(key === 'PPA_AS_OF' || key === 'DATA_AS_OF'){
                    record[key] = this.periodMap[record[key]] || 'null';
                }
                if(key === 'CREDIT_AMOUNT' && this.entityName === 'commission'){
                    // special handles for credit amount in commission, due to mapping 
                    record['creditAmount'] = record[key];
                    record['creditAmtUnitTypeId'] = record['COMM_AMOUNT_UNIT_TYPE_DISPLAY'];
                }else if(this.solrToIncentMap[key]){
                    record[this.solrToIncentMap[key]] = record[key];
                    record[key];
                }else if(this.mappingToSolrReversed[key]){
                    record[this.mappingToSolrReversed[key]] = record[key];
                    delete record[key];
                }
            }, this);
        },

        /**
         * map for unit types
         *
         */
        mapUnityTypeToId : function(record){    
            _.keys(record).forEach(function(key){
                if(this.solrUnitTypeColNames.indexOf(key) > -1 || key.indexOf('UNIT_TYPE') > -1) {
                    record[key] = config.unitTypeNameObject[ record[key] ];
                }
            }, this);
        },

        /**
         *
         */     
        createPeriodMap : function(){
            var periodCollection, ids, names;
            periodCollection = config.tempCache && config.tempCache['visiblePeriodsCollection'];
            if(!periodCollection) return;
            periodCollection = periodCollection.toJSON();
            ids = _.pluck(periodCollection, 'id');
            names = _.pluck(periodCollection, 'name');
            this.periodMap = _.object(ids, names);
        },

    });
    return ResultsSolrCollection;

});

