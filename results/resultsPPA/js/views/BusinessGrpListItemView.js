define([
    'underscore',
    'backbone.stickit',
    'i18n',
    'baseListItemView',
    'text!results/resultsPPA/html/businessGrpListItem.html'
], function (_, stickit, i18n, BaseListItemView, templateHTML) {

    var BusinessGrpListItemView = BaseListItemView.extend({

        namespace: 'icmadvanced.default',

        template: function(serializedModel) {
            _.extend(serializedModel,{
                isSelected:this.isSelected
            });
            return _.template(templateHTML, serializedModel);
        }

    });

    return BusinessGrpListItemView;
});
