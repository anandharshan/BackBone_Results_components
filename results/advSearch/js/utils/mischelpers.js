// support older browsers
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
      if ( this === undefined || this === null ) {
        throw new TypeError( '"this" is null or not defined' );
      }

      var length = this.length >>> 0; // Hack to convert object.length to a UInt32

      fromIndex = +fromIndex || 0;

      if (Math.abs(fromIndex) === Infinity) {
        fromIndex = 0;
      }

      if (fromIndex < 0) {
        fromIndex += length;
        if (fromIndex < 0) {
          fromIndex = 0;
        }
      }

      for (;fromIndex < length; fromIndex++) {
        if (this[fromIndex] === searchElement) {
          return fromIndex;
        }
      }

      return -1;
    };
}

var cacheEnabled = true;
// Creates associative array (object) of query params
var QueryParameters = (function() {
	var result = {};
    if (window.location.search){
        // split up the query string and store in an associative array
        var params = window.location.search.slice(1).split("&");
        for (var i = 0; i < params.length; i++){
            var tmp = params[i].split("=");
            result[tmp[0]] = unescape(tmp[1]);
        }
    }
    return result;
}());

if(QueryParameters.disableCache) cacheEnabled = false;	//parma for qa to test w/o caching
//this generically sizes the outer containers -->
//take care of widget sizing as per desired layout in your coffee code -->

// resize space in window to initial load
resizeWorkspace = function() {			
	var h, w, filterHeight, wsHeight, tabHeight;
	w = $("body").width() - 10;
	h = $("body").height();
	
	$(".workspace").css({height: h - 10});
	
	wsHeight = $(".workspace").height();
	filterHeight = $(".filters").height();
	tabHeight = $("#viz_valuestable_tabs").height();
	
	if ($("body#dashboard")) {
	  $("body#dashboard .vizcontainer").css({
		height: wsHeight - (filterHeight+12+10) // 12 for padding top
	  });
	}
	if ($(".dashboard-container.fullH")) {
	  $(".dashboard-container.fullH").css({
		height: wsHeight - (filterHeight+12+10+5),
		width: w-25,
		overflow: 'auto'
	  });
	}
	$("#viz_valuestable").css({
		width: w-35,
		height: $(".dashboard-container.fullH").height() - (tabHeight+20),
		overflow: 'hidden'
	  });
	$(".innerbox").css({
		width: w-40,
		height: $("#viz_valuestable").height()-20,
		overflow: 'auto'
	 });
	setTimeout(resizeThCols, 100);
};



resizeThCols = function(){
	if($.browser.safari || ($.browser.msie && $.browser.version < 10)){
		$(".fht-thead").find("th").each(function(index, val){
			//console.log(index+" -:"+ w+" : "+$(this).text()+" : "+$(this).css('padding-right'));
			if($(this).text() != '#'){ 
				var w = $(this).find(".fht-cell").width();
				$(this).find(".fht-cell").width(w+1);
			}
			if($(this).css('padding-right') != '10px'){
				$(this).css('padding-right', '10px');
			}
		});
	}	
};

/** logger **/
var logaction = [];
var logsize = (QueryParameters.logsize) ? QueryParameters.logsize : 30;
function logAction(msg){	
    if(logaction.length > logsize){
        logaction.shift();
    }
    var d1=new Date();
	var cacheCount = (window.cacheManager) ? window.cacheManager.count : 0;
	var logMsg = d1.toString('dddd, MMMM ,yyyy')+ " : "+msg+" : [Cache Count :"+cacheCount+"]";
    logaction.push(logMsg);
}
keydownevent = function(event) {
	var codes = { 65: 'A' };
	if (event.ctrlKey && event.keyCode in codes) {
        //alert('pressed ALT + CTRL + ' + codes[event.keyCode]);
        showLogs();
	}
};

if (document.addEventListener) {
	document.addEventListener('keydown', keydownevent);
}else {
	document.attachEvent('keydown', keydownevent);
}

$(document).ready(function() {
	$("#ghostLogger").click(function(){
		showLogs();
	})
});;
function showLogs(){
    var msgStr = 'QueryParameters : '+JSON.stringify(QueryParameters)+'\n\r\n\r';
    for(var i = 0; i < logaction.length; i++){
        msgStr += i+" : "+logaction[i]+"\n\r\n\r";
    }
    if(msgStr != '') alert(msgStr);
    else alert("Log empty.");
}

var unitTypeMap = {
	"AMOUNT_MEA" : "ORD_AMOUNT_UNIT_TYPE_DISPLAY",
	"ATTAINMENT_VALUE_MEA" : "ATTAINMENT_VALUE_UNIT_TYPE_DISPLAY",
	"BALANCE_MEA" : "BALANCE_UNIT_TYPE_DISPLAY",
	"BONUS_AMOUNT_MEA" : "BONUS_AMOUNT_UNIT_TYPE_DISPLAY",
	"BUS_AMOUNT_MEA" : "PAY_BUS_AMOUNT_UNIT_TYPE_DISPLAY",
	"BUS_GROUP_AMOUNT_MEA" : "PAY_BUS_GROUP_AMOUNT_UNIT_TYPE_DISPLAY",
	"COMMISSION_AMOUNT_MEA" : "COMM_AMOUNT_UNIT_TYPE_DISPLAY",
	"CREDIT_AMOUNT_MEA" : "CR_AMOUNT_UNIT_TYPE_DISPLAY",
	"ORD_AMOUNT_MEA" : "ORD_AMOUNT_UNIT_TYPE_DISPLAY",
	"ORD_DTL_AMOUNT_MEA" : "ORD_DTL_AMOUNT_UNIT_TYPE_DISPLAY",
	"PAYMENT_AMOUNT_MEA" : "PAYMENT_AMOUNT_UNIT_TYPE_DISPLAY",
	"PAY_AMOUNT_MEA" : "PAY_AMOUNT_UNIT_TYPE_DISPLAY",
	"PROJECTED_AMOUNT_MEA" : "PROJECTED_AMOUNT_UNIT_TYPE_DISPLAY",
	"SPLIT_AMOUNT_MEA" : "SPLIT_AMOUNT_UNIT_TYPE_DISPLAY"
};

var ellipsis = ['', '.', '..', '...'];
var runEllipsisInterval = false;
var ellipsisCount = 0;
function startEllipsis(el) {
 	runEllipsisInterval = window.setInterval( function(){
		document.getElementById(el).innerHTML = ellipsis[ellipsisCount%4];
		ellipsisCount++;
	}, 500);
}

function stopEllipsis(el) {
	clearInterval(runEllipsisInterval);
	setTimeout(function(){
		ellipsisCount = 0;
		if(document.getElementById(el)) document.getElementById(el).innerHTML  = '';
	}, 100);
}


