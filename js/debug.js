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

function notification(){
	var notification_div = document.getElementById("notifications");
	var newNotification = new Notification({name:"test"});

	var value = 0;
	function updateMe(){
		newNotification2.progressBar.value = value++;
		if (100 <= value){
			window.clearInterval(intervalVariable);
		}
	}
	var newNotification2 = new Notification({name:"progress bar", progressBar:true, forever:true});
	var intervalVariable = setInterval(function(){updateMe();}, 100);
}