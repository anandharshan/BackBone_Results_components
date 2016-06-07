define([
    'jquery',
    'underscore',
    'PopupView',
    'i18n',
    'config'
], function($, _, PopupView, i18n, config){

    /**
    * A Backbone View to view and add comment
    *
    * @module CommentView
    */
    var CommentView = PopupView.extend({

        userProfileBlock : {},
        userProfileIndex : 0,

        events: {
            'click .close' : 'cancel',
            'click .cancel-button' : 'cancel',
            'click .done-button' : 'doneButtonAction',
            'keypress #add-comment': 'addCommentOnEnter'
       },

        /**
         * Show pop up
         *
         */
        render : function(){   
            var resourceName = this.resourceName || '',
                index = this.getUserProfileBlockIndex(resourceName);

            var commentHTML = _.template($('#add-view-comment-tmpl').html(), {
                resourceName: resourceName, 
                index: index, 
                getProfile : this.getProfile
            });
            this.modalBody.html( commentHTML );
            this.$el.xlate({ namespace: this.namespace });// translate
            
            if(this.heldObjId){
                this.fetchComments(); // render input for download name
            }else{
                this.processComments();
            }


            //Hide add comment section when
            //type is "release" 
            //config is set to read-only for held, payment, manual payment
            //if its held and has read-write permission, don't hide
            //this.ppaEnabled || !((this.type === 'held' && config.heldPermissions && config.heldPermissions.value === 'READ_WRITE' )|| (this.type === "manualPayments" && config.mpPermissions && config.mpPermissions.value === 'READ_WRITE'))

            if(this.ppaEnabled || !((this.type === 'held' && config.heldPermissions && config.heldPermissions.value === 'READ_WRITE' )|| (this.type === "manualPayments" && config.mpPermissions && config.mpPermissions.value === 'READ_WRITE'))){
                this.$el.find('.add-comment').hide();
                this.$el.find('.primary-button').hide();
            }

            this.$el.show();
            $('.modal-backdrop').addClass('in').removeClass('out hide');
        },

        /**
         *
         */
        fetchComments : function(){
            var self = this,queryParams="", REQUEST_URL;
            if(this.heldObjType == 'manualpayment'){
                queryParams = 'manualPaymentId=' + this.heldObjId;
                REQUEST_URL = '/api/v1/manualpayment/comments?';
            }else if(this.heldObjType == 'payments'){
                queryParams = 'paymentId=' + this.heldObjId;
                REQUEST_URL = '/api/v1/manualpayment/payment/comments?';
            }else {
                queryParams = 'heldObjType=' + this.heldObjType +
                                '&heldObjId=' + this.heldObjId;
                REQUEST_URL = "/api/v1/compresults/comments?";
            }
            var jqxhr = $.ajax( {
                url: config.appContext + REQUEST_URL + queryParams,
                method : 'GET',
                contentType: 'application/json',
                processData: false
            })
            .done(function(data, textStatus, jqXHR) {
                self.processComments(data);
            })
            .fail(function(jqXHR, textStatus, errorThrown){
                self.error(jqXHR, textStatus, errorThrown);
            });
        },

        
        /**
         *
         */
        processComments : function(data){
            var noCommentsMsg;
            if(data && data.length > 0){
                this.comments = data;
                this.renderComments();
            }else{
                noCommentsMsg = i18n.get(this.namespace, 'noCommentsFound') || '[No comments found.]';
                this.$el.find('#comments').html(noCommentsMsg);
                this.$el.find('.add-comment').removeClass('comment-present'); 
            }
        },

        /**
         *
         */
        renderComments : function(){
            if(!this.comments) return;
            this.$el.find('#comments').empty();
            this.comments.forEach(this.renderComment, this);
            this.$el.find('.add-comment').addClass('comment-present');
            this.$el.find('#comments').addClass('fix-comment');
        },

        /**
         * Utility method to generate comments HTML from tempalte and comments list.
         *  
         * @param {Array} An array of comments objects
         * @return @type {String} HTML string to added to DOM.
         */
        renderComment: function(comment){
            var index = this.getUserProfileBlockIndex(comment.createdByName);
            var commentHTML = _.template($('#comment-tmpl').html(), {
                index: index, 
                comment: comment, 
                getProfile : this.getProfile
            });
            this.$el.find('#comments').append(commentHTML);
        },

        /**
         *
         */
        doneButtonAction : function(){
            this.addComment();
        },

        /**
         * This method generates HTML snippet to show block initial of the user.
         * This method is called from tempalte in some instances. 
         *
         * @param {String} A name.
         # @return @type {String} HTML snippet to include in DOM.
         */
        getProfile: function(personName){
            if(personName === null) personName = ' ';
            var FI = personName.charAt(0);
            var index = personName.indexOf(' ');
            var LI = index == -1 ? '' : personName.charAt(index+1);
            if (LI == '(') {
                index = personName.indexOf(' ', index+1);
                LI = index == -1 ? '' : personName.charAt(index+1);
            }
            return '<span class="first">' + FI + '</span><span class="last">' + LI + '</span>';   
        },

        /**
         * This method accepts keyup event fired on Enter button on keyboard.
         * Upon Enter event, {@link module:WorkflowDetail~addComment} is called.
         */
        addCommentOnEnter : function(e){
            if (e.keyCode !== 13) return;
            this.addComment();
        },

        /**
         * This method accepts click event fired on comment button for submission to server.
         * Upon click event, reference to comment text input field is passed to 
         * {@link module:WorkflowDetail~submitComment} for further processing.
         *
         * No action is performed when comment text isn't specified. 
         */
        addComment : function(){
            var textInputField = this.$el.find('#add-comment');
            if(!textInputField || ($.trim(textInputField.val()) === '') ) return;
            this.submitComment(textInputField);
        },

        /**
         * This method accepts text input field reference for the comment. Then the comment
         * object is generated for server's consumption.
         * 
         * Upon successful POST of the comment to server, all comments are renderd again on the 
         * UI with sorted by latest first. 
         *
         * @param {Object} A query object representing comment input element.
         */
         submitComment: function(textInputField){
            var self = this, REQUEST_URL;
            
            var payLoadForComment = {};
            payLoadForComment.comment = textInputField.val();
            if(this.heldObjType == 'manualpayment'){
                // Sample Payload:
                // {"manualPaymentId":["152","153"],"comment":"commentTest","periodId":"17104434"}
                REQUEST_URL = "/api/v1/manualpayment/comments";
                payLoadForComment.manualPaymentId = _.map(this.selectedRows, function(row){
                    return row.id;
                });
                payLoadForComment.periodId = this.selectedRows[0].periodId;
            }else{
                REQUEST_URL = "/api/v1/compresults/comments";
                payLoadForComment.heldObjType = this.heldObjType;
                payLoadForComment.heldObjId = _.map(this.selectedRows, function(row){
                    return row.id;
                });
            }
            
            var jqxhr = $.ajax( {
                url: config.appContext + REQUEST_URL,
                method : 'POST',
                contentType: 'application/json',
                processData: false,
                data : JSON.stringify(payLoadForComment)
            })
            .done(function(data, textStatus, jqXHR) {
                self.doneAction();
            })
            .fail(function(jqXHR, textStatus, errorThrown){
                self.error(jqXHR, textStatus, errorThrown);
            });
        },

        /**
         *
         */
        doneAction : function(){
            this.trigger("success", this);
            this.cleanUp();
        },

        /**
         *
         */
        getUserProfileBlockIndex : function(userName){
            if(typeof this.userProfileBlock[userName] === 'undefined'){
                this.userProfileBlock[userName] = this.userProfileIndex % 5;
                this.userProfileIndex++;
            }
            return this.userProfileBlock[userName];
        },

        /**
         *
         */
        cancel : function(){
            this.trigger("cancel");
            this.cleanUp();
        },

        /**
         *
         */
        cleanUp : function(){
            $('.modal-backdrop').removeClass('in').addClass('out hide');
            this.$el.removeClass('modal fade in').empty();
            this.undelegateEvents();
        }
    });
    return CommentView;
});
