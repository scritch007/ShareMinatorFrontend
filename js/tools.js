function bytesToSize(bytes) {
   if(bytes == 0) return '0 Byte';
   var k = 1000;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

Logger = {
	DEBUG: function(text){console.log("DEBUG: " + text)},
	INFO: function(text){console.log("INFO: " + text)},
	ERROR: function(text){console.log("ERROR: " + text)}
}

function getQueryString() {
  var result = {}, queryString = location.search.slice(1),
      re = /([^&=]+)=([^&]*)/g, m;

  while (m = re.exec(queryString)) {
    result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  return result;
}

window.isMobile = function() {
 if( navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
 ){
    return true;
  }
 else {
    return false;
  }
}();


function createSelect(select){
	if (window.isMobile){
		$(select).selectpicker('mobile');
	}else{
		$(select).selectpicker();
	}
}
function updateSelect(select){
	$(select).selectpicker('refresh');
}

function Notification(options){
	var notification = document.createElement("div");
	var notificationLabel = document.createElement("label");
	notificationLabel.innerHTML = options.name;
	notification.appendChild(notificationLabel);
	if (options.progressBar){
		var progressBar = document.createElement("progress");
		progressBar.max = "100";
		progressBar.value = "0";
		notification.appendChild(progressBar);
		notification.progressBar = progressBar;
	}
	var notificationStatus = document.createElement("label");
	var status = "";
	if (options.status){
		status = options.status;
	}
	notification.appendChild(notificationStatus);
	notification.setStatus = function(status){
		notificationStatus.innerHTML = status;
	}
	notifOptions = {
			timeOut: options.forever?0:2000,
			extendedTimeOut: 0,
			iconClass: null
	}
	var cmd = toastr.info
	if (undefined != options.type){
		if ("error" == options.type){
			cmd = toastr.error;
		}else if("success" == options.type){
			cmd = toastr.success;
		}
	}
	cmd(notification, '', notifOptions);
	return notification;
}