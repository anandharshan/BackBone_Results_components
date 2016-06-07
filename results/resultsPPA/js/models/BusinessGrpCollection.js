define([
    'PagedCollection',
    'businessGrpModel',
    "config",
], function(PagedCollection, BusinessGrpModel, config) {

    var BusinessGrpCollection = PagedCollection.extend({

       	model: BusinessGrpModel,

        url: config.appContext + '/api/v1/businessGroups'
    });
    return BusinessGrpCollection;

});
