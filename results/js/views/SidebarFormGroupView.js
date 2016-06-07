define([
  'jquery',
  'underscore',
  'FormGroupView'
], function($, _, FormGroupView){

	var SidebarFormGroupView = FormGroupView.extend({
		/* jshint ignore:start */
		releaseFormWrapper : "<form>\
			<div class='visible-groups clearfix'></div>\
            </div>\
        </form>",

 		formGroupTemplate :  _.template(
            "<div class='form-group <%=className%> clearfix' id='<%=id%>'> \
                <p><span class='group-label'><%=label%></span></p>\
            </div>"
        ),
		/* jshint ignore:end */

        formElementViews : [],

		initialize: function(options) {
			$.extend(this, options);
			this.render();
		},

		render : function(){
			this.$el.html( this.releaseFormWrapper );
			this.renderFormGroups();
			this.$el.xlate({namespace: this.namespace});
		}

	});
	return SidebarFormGroupView;
});


  