

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