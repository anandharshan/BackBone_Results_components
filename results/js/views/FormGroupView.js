define([
  'jquery',
  'underscore',
  'BaseListView',
  'config',
  'ObjectInputFactory'
], function($, _, BaseListView, config, ObjectInputFactory){

	var FormGroupView = BaseListView.extend({
		/* jshint ignore:start */
		releaseFormWrapper : "<form>\
			<div class='visible-groups clearfix'></div>\
            <div class='hidden-groups  clearfix'></div>\
            <div class='hidden-toggle clearfix'>\
              <span class='more'>\
                <span data-i18n='moreSearch'>More Search Section</span>\
                <i class='fa fa-chevron-down'></i>\
              </span>\
              <span class='less'>\
                <span data-i18n='lessSearch'>Less Search Section</span>\
                <i class='fa fa-chevron-up'></i> \
              </span>\
            </div>\
        </form>",
		
 		heldFormWrapper :  _.template(
 			"<p class='held-title'>\
 				<span class='group-label' data-i18n='primarySearchTitle'>Primary Search</span>\
 				<span class='group-text' data-i18n='primarySearchText'>Select one tab as the primary search option.</span>\
 			</p>\
 			<fieldset>\
        		<div data-id='erdTab' class='legend selected' data-i18n='estReleaseDateTab'>Estimated Release Date</div>\
        		<div data-id='ordersTab' class='legend' data-i18n='orderTab'>Orders</div>\
        		<div data-id='personTab' class='legend' data-i18n='personTab'>Person</div>\
        		<div data-id='processedPeriodTab' class='legend' data-i18n='processedPeriodTab'>Processed Period</div>\
        		<div class='expanded-container'></div>\
        	</fieldset>"
 		),

 		formGroupTemplate :  _.template(
            "<div class='form-group <%=className%> clearfix' id='<%=id%>'> \
                <p><span class='group-label'><%=label%></span></p>\
            </div>"
        ),

        tabFormTemplate :  _.template(
            "<div class='tab-group form-group <%=className%> clearfix' id='<%=tab%>'></div>"
        ),
		/* jshint ignore:end */

        formElementViews : [],
        
        requiredInputs : [],

        // map used to hide duplicate form elements
        duplicateFormElementMap : {
            'estReleaseDate-fromDatePrimary' : 'estReleaseDate-fromDate',
            'estReleaseDate-toDatePrimary' : 'estReleaseDate-toDate'
        },

		events: {
			'click .legend' : 'changeForm',
			'click .more, .less' : 'toggleSearchForm',
		},

		initialize: function(options) {
            this.formElementViews = [];
			$.extend(this, options);
			this.render();
		},

		render : function(){
			if(this.type === 'held'){
				this.$el.addClass('list-item-detail').html( this.heldFormWrapper );
				this.$el.find('.expanded-container').html( this.releaseFormWrapper );
				this.renderTabFormInputs();
			}else{
				this.$el.html( this.releaseFormWrapper );
			}
			
            this.renderFormGroups(); // render rest of the form. 
            
            if(this.type === 'held'){
                // only held page forms have required fields
                this.resetAndHideDuplicates(); // hide duplicates
            }
			
            this.$el.xlate({namespace: this.namespace});
		},
        
        /**
         *
         */
        renderTabFormInputs : function(){
			var self = this,
				tabEl, className;

            this.updateTabSelection();

			_.each(this.tabFormInputs, function(inputArray, tab){
				className = 'hide';
				if(tab === config.selectedHeldTab){
					className = ''; // erd = Estimated Release Date is shown by default
				}
				// render tempalte to insert form for this tab
				self.$el.find('.visible-groups').append(
					self.tabFormTemplate({ tab : tab, className : className})
				);

				tabEl = self.$el.find('#'+tab); // tab element where to add the forms
				
				// render the inputs
				inputArray.forEach(function(formElement){
                    if(formElement.id === 'orderItemCode'){
                        formElement.skipRemoval = true;
                    }
					self.renderFormElement(formElement, tabEl);
				}, this);
			});

            setTimeout(function(){
                //self.cleanNonPrimaryRequiredInputs();
                self.resetPrimaryDuplicateInput();
            }, 500);
        },
        /**
         *
         */
        updateTabSelection : function(){
            config.selectedHeldTab = config.selectedHeldTab || 'erdTab';
            this.$el.find('.legend').removeClass('selected');
            this.$el.find('[data-id="'+config.selectedHeldTab+'"]').addClass('selected');
        },
		/**
         *
         */
		toggleSearchForm : function(e){
			this.$el.find('.hidden-groups').slideToggle();
			this.$el.find('.hidden-toggle').toggleClass('expanded');
        },
        
		/**
         *
         */
        changeForm : function(e){
			var target = $(e.currentTarget);

            this.formElementViews.forEach(function(view){
                view.clearValidationError();
            });

			config.selectedHeldTab = target.data('id');
            this.$el.find('.legend').removeClass('selected');
            target.addClass('selected');

            this.$el.find('.tab-group').addClass('hide');
            this.$el.find('#'+config.selectedHeldTab).removeClass('hide');
            this.resetAndHideDuplicates();
        },
       
        /**
         *
         */
        resetAndHideDuplicates : function(){
            this.requiredInputs = _.pluck(this.tabFormInputs[config.selectedHeldTab], 'id');
            //this.resetForm();
            this.hideDuplicates();
        },

        /**
         *
         */		
        resetForm : function(){	
			// reset form and clear all values
			this.$el.find('form').find("input[type=text], textarea select").val("");
			this.formElementViews.forEach(function(view){
				if(view.removeAllItems) {
					view.removeAllItems();
				}
			});
        },

        /**
         *
         */    
        hideDuplicates : function(){        
            var self = this;
			// hide duplicates
			self.$el.find('.input-element').removeClass('hide');
            var hiddenDiv = self.$el.find('.hidden-groups'); // input under this div needs to be hidden
			this.requiredInputs.forEach(function(formElement){
                formElement = self.duplicateFormElementMap[formElement] || formElement;
                hiddenDiv.find('#'+formElement+"Input").addClass('hide');
            });
        },

		/**
         *
         */
        renderFormGroups : function(){
            this.formGroups.forEach(this.renderFormGroup, this);
        },

        /**
         *
         */
        renderFormGroup : function(formGroup){
            var self = this;
            var parentGroupDiv = formGroup.visible ? '.visible-groups' : '.hidden-groups';

            self.$el.find(parentGroupDiv).append(
                this.formGroupTemplate(formGroup)
            );
            
            var formGroupEl = self.$el.find('#'+formGroup.id);

            formGroup.formElements.forEach(function(formElement){
                self.renderFormElement(formElement, formGroupEl);
            }); 
        },

        /**
         *
         */
        renderFormElement : function(formElement, formGroupEl){
            var self = this,
                formElementView;

            formGroupEl.append("<div id='"+formElement.id+"Input' class='input-element'></div>");

            formElement.$el = formGroupEl.find('#'+formElement.id+"Input");
            if(!ObjectInputFactory[formElement.id]){
                console.log(formElement.id, formElement);
            }
            // instantiate given input 
            var inputView = ObjectInputFactory[formElement.id](formElement);
            inputView.skipRemoval = formElement.skipRemoval;
            self.formElementViews.push(inputView);

            if(!inputView){
                console.log(formElement.id, ObjectInputFactory[formElement.id]);
            }
        },

        /**
         *
         */
        isFormvalid : function(){
            var self = this,
                value, id,
                isValid = true,
                formElement;
            
            this.selectedValues = {};

            // store all selected values regardless of duplicates or required.                        
            this.formElementViews.forEach(function(view, index){
                id = view.model.get('id');        
                if(view.model.get('type') === 'amountWithUnitType'){
                    this.populateAmountAndUnitType(view, id);
                }else{
                    this.selectedValues[ id ] = view.model.get( id );
                }
            }, this);


            // search through required inputs and update those values. duplicated will be overwritten
            // with required values
            this.formElementViews.forEach(function(view){
                view.clearValidationError();
                if( (this.requiredInputs.indexOf(view.model.get('id')) > -1)){
                    if(view.model.validation){
                        view.validate();
                        if(isValid){
                            isValid = view.model.isValid();
                        }
                    }
                    value = view.model.get( view.model.get('id') );                
               
                    if(view.model.get('type') === 'amountWithUnityType'){
                        this.populateAmountAndUnitType(view, id);
                    }else if(value){
                        // populate only if value is defined. If this is required that values must be defined
                        this.selectedValues[ view.model.get('id') ] = value;
                    }
                }
            }, this);
            return isValid;
        },

        /**
         *
         */
        populateAmountAndUnitType : function(view, id){
            this.selectedValues[ id ] =  view.model.get( id  );
            this.selectedValues[ id +'-unitType' ] = '';
            if(view.model.get( id +'-unitType' )){
                this.selectedValues[ id +'-unitType' ] =  view.model.get( id +'-unitType' ).id;                
            }
        },

        /**
         *This is to get data populated in sidebar and searchform.
         */
        getData : function(){
            this.cleanNonPrimaryRequiredInputs();
            //this.resetPrimaryDuplicateInput();
            var isValid = this.isFormvalid();
			if(isValid){
                return this.selectedValues;
            }
        },

        /**
         * Primary required input is inputs in selected tab. All other tabs (i.e. hidden)
         * are non-primary (but they are required)
         * this method cleans value from form elements in non-primary tabs.
         */
        cleanNonPrimaryRequiredInputs : function(){
            if(!this.tabFormInputs) return;

            var self = this,
                nonPrimaryInputs,
                keys, formElementViews;

            keys = _.keys(this.tabFormInputs);      // get all required inputs, that are not primary
            keys = _.without(keys, config.selectedHeldTab); // config.selectedHeldTab is primary tab
            
            nonPrimaryInputs = _.map(keys, function(key){
                return _.map(self.tabFormInputs[key], function(object){
                    return object.id;
                });
            });
            nonPrimaryInputs = _.flatten(nonPrimaryInputs);

            // now we will clear values from fields that required but are not primary
            _.each(nonPrimaryInputs, function(inputId){
                formElementViews = _.filter(self.formElementViews, function(element){
                    return (element.data.id === inputId);
                });

                formElementViews.forEach(function(view){
                    if(view.removeAllItems && view.data.required) {
                        view.removeAllItems();
                    }
                });
            });
        },

        /**
         * This method remvoed values from input that are in primary from group as well 
         * in 'More Search Option'. Values are removed from inputs that are in 'More Search Option'
         */
        resetPrimaryDuplicateInput : function(){
            if(!this.tabFormInputs) return;
            var requiredInputs = _.pluck(this.tabFormInputs[config.selectedHeldTab], 'id');
            requiredInputs = _.map(requiredInputs, function(inputId){
                return inputId.replace('Primary', '');
            });
            this.formElementViews.forEach(function(view){
                //console.log(view.data.id, view.data.required , requiredInputs , requiredInputs.indexOf(view.data.id))
                if(!view.data.required && 
                        requiredInputs &&   // requiredInputs is truthy 
                        !view.skipRemoval &&     // not to be removed if true
                        requiredInputs.indexOf(view.data.id) > -1 &&  // this view present in requiredInputs
                        view.removeAllItems){    // and has removeAllItems
                    view.removeAllItems();
                }
            });
        },

        /**
         *
         */
        cleanUp : function(){
            this.formElementViews.forEach(function(view){
                view.undelegateEvents();
            });
            this.formElementViews = [];
            this.undelegateEvents();
        },

        /**
         *
         */
        clearInput : function(id){
            this.formElementViews.forEach(function(view){
                if(view.model.get('type') === 'amountWithUnitType'){
                    var psuedoId = id.replace('-unitType', '');
                    if(psuedoId === view.model.get('id')){
                        view.removeByType(id);
                    }
                }else if(view.model.get('id') == id){
					view.removeAllItems();
				}
			});
        }
	});
	return FormGroupView;
});


  