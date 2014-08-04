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

window.isMobile = function(){return false}();


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
	toastr.info(notification, '', notifOptions);
	return notification;
}