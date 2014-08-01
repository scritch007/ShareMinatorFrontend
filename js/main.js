var current_folder = null;

var displayTheme = null;

var mainWindow = null;

var queryString = {};
var hasFlash = false;
var copyClient = null;

var PopupClass = null;

function getQueryString() {
  var result = {}, queryString = location.search.slice(1),
      re = /([^&=]+)=([^&]*)/g, m;

  while (m = re.exec(queryString)) {
    result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  return result;
}

function setPopup(popup){
	mainWindow.innerHTML = "";
	mainWindow.appendChild(popup);
	if (undefined != popup.focusElement){
		popup.focusElement.focus();
	}
	if (undefined != popup.attached){
		popup.attached();
	}
}

function init(){
	PopupClass = BootstrapDialog;
	queryString = getQueryString();
	displayTheme = new WualaDisplay();
	mainWindow = document.getElementById("window_popup_id");
	ZeroClipboard.config( { swfPath: "bower_components/zeroclipboard/dist/ZeroClipboard.swf" } );

	hasFlash = !ZeroClipboard.isFlashUnusable();
	if (hasFlash){
		copyClient = new ZeroClipboard();
	}
	$.getJSON("auths", function(result){
		HandleAuthsResult(result);
		checkAuth(function(loggedUser){
			if (null != loggedUser){
				//Display the current user name somewhere
			}
			browse("/");
		});
	});
}
function browse(path){
	var command = {
		name: "browser.list",
		browser:{
			list:{
				"path": path
			}
		}
	};
	request = {
		data: command,
		onSuccess: function(result){
			current_folder = path;

			display(result, undefined==result.auth_key);
		},
		onError: function(request, status, error){
			if (401 == request.status){
				logout();
				browse(path);
			}
		},
		poll:true
	}
	sendCommand(request);
}

function display(result, add_share_callback){
	var path = result.browser.list.path;
	if ("/" != path.charAt(path.length - 1)){
		path = path + "/";
	}
	displayTheme.GetBrowsingPathElement(path, browse);
	var elementListObject = displayTheme.GetFilesListElement(path);

	if ("/" != path){
		displayTheme.AddElement(elementListObject, null, "..",
			function(event){
				var path = this;
				if ("/" == path.charAt(path.length - 1)){
					path = path.substr(0, path.length - 1);
				}
				var split = path.split("/");
				path = split.slice(0, split.length - 1).join("/");
				if (path == "")
				{
					path = "/";
				}
				browse(path);
			}.bind(path)
		);
	}
	for(var i=0; i<result.browser.list.result.children.length; i++){
		var element = result.browser.list.result.children[i];
		element_path = path + element.name;
		element.element_path = element_path;
		var downloadCB = null;
		var browseCB = null;
		var deleteCB = function(path, event){
			event.stopPropagation();
			deletePopup(path);
		}.bind(element, element_path);

		if (element.isDir){
			browseCB = function(path, event){
				browse(path);
			}.bind(element, element_path);
		}//else{
			downloadCB = function(path, event){
				event.stopPropagation()
				sendCommand(
					{
						data: {
							name: "browser.download_link",
							browser:{
								download_link:{
									"path": path
								}
							}
						},
						onSuccess: function(result){
							console.log(result.browser.download_link.download_link);
							downloadPopup(path, result.browser.download_link.download_link.link);
						}
					}
				);
			}.bind(element, element_path);
		//}
		var shareCB = null;
		if (null != user && add_share_callback){
			shareCB = function(){
				//Check if we've got a sharelink save
				sendCommand({
					data : {
						name: "share_link.list",
						share_link:{
							list : {
								path: this.element_path
							}
						}
					},
					onSuccess: function(result){
						setPopup(sharePopup(this, result));
					}.bind(this),
					onError: function(result){
						setPopup(sharePopup(this, null));
					}.bind(this)
				});
			}.bind(element);
		}
		displayTheme.AddElement(elementListObject, element, element.name, browseCB, downloadCB, deleteCB, shareCB);
	}
	if (0 == result.browser.list.result.children.length){
		//Display that this is empty
		displayTheme.AddEmptyList(elementListObject);
	}
	//browse_div.appendChild(ul);
	var mainDisplay = document.getElementById("browsing");
	mainDisplay.innerHTML = "";
	mainDisplay.appendChild(displayTheme.GetListDisplayComponent(elementListObject));
}

function createFolder(){

	PopupClass.show(
	{
		title: "Create New Folder",
		message: function(){
			var createFolderPopup = document.createElement("form");
			createFolderPopup.setAttribute("role", "form");
			createFolderPopup.id = "createFolderPopup";

			//Folder name entry
			var folderNameLabel = document.createElement("label");
			folderNameLabel.innerHTML = "Folder Name";
			folderNameLabel.setAttribute("for", "createFolderNameInput");
			var folderNameInput = document.createElement("input");
			folderNameInput.id = "createFolderNameInput";
			folderNameInput.type = "text";
			folderNameInput.setAttribute("required", true);
			folderNameInput.className = "form-control";
			folderNameInput.id = "createFolderNameInput";
			folderNameInput.focus();

			var nameDiv = document.createElement("div");
			nameDiv.className = "form-group";
			nameDiv.appendChild(folderNameLabel);
			nameDiv.appendChild(folderNameInput);
			createFolderPopup.appendChild(nameDiv);
			return createFolderPopup;
		},
		buttons: [
			{
				label: 'Close',
				action: function(self){
					self.close();
				}
			},
			{
				label: 'Create',
				action: function(self){
					var createFolderPopup = $("#createFolderPopup")[0];
					if(!createFolderPopup.checkValidity())
					{
						return;
					}
					path = current_folder;
					if ("/" != path.charAt(path.length - 1)){
						path = path + "/";
					}
					sendCommand(
						{
							data: {
								name: "browser.create_folder",
								browser:{
									create_folder:{
										"path": path + $("#createFolderNameInput")[0].value
									}
								}
							},
							onSuccess: function(result){
								browse(current_folder);
								self.close();
							}
						}
					);
				},
				cssClass: 'btn-primary'
			}
		]
	});
}

function downloadPopup(path, download_link){
	PopupClass.show({
		title: "Download " + path,
		data: {
			path: path,
			download_link: download_link
		},
		message: function(self){
			var dlink = location.protocol + "//" + location.host + "/downloads/" + self.getData('download_link');
			var content_div = document.createElement("div");
			var url_div = document.createElement("div");
			url_div.className = "text-center";
			if (!hasFlash)
			{
				var download_link_input = document.createElement("input");
				download_link_input.type = "text";
				download_link_input.value = dlink;
				url_div.appendChild(download_link_input);
			}else{
				var copyButton = document.createElement("a");
				copyButton.className = "btn btn-default btn-lg";
				copyButton.id = "moncopybouton";
				var i = document.createElement("i");
				i.className = "fa fa-clipboard";
				copyButton.appendChild(i);
				url_div.appendChild(copyButton);
				copyButton.onclick = function(){
					console.log("Button was clicked");
				}
				function listener(e){
					document.removeEventListener("DOMNodeInserted", listener);
					var button = e.target.querySelector("#moncopybouton")
					copyClient.clip(button);
					copyClient.setText(dlink);
					copyClient.on("ready", function(){
						console.log("copyClient ready");
					});
					copyClient.on("copy", function(){
						console.log("Copy");
					});
					copyClient.on("after-copy", function(){
						console.log("copied to clipboard");
					});
				}
				document.addEventListener("DOMNodeInserted", listener);
			}
			var downloadButton = document.createElement("a");
			downloadButton.className = "btn btn-default btn-lg";
			var span = document.createElement("span");
			span.className = "glyphicon glyphicon-download";
			downloadButton.appendChild(span);
			url_div.appendChild(downloadButton);
			downloadButton.onclick = function(){
				window.open(dlink);
			}
			content_div.appendChild(url_div);
			return content_div;
		}
	});
	


}

function createShareLinkDisplay(share_link){
	var current_link = document.createElement("div");
	current_link.share_link = share_link;
	var keyDiv = document.createElement("div");
	var keyLabel = document.createElement("div");
	keyLabel.innerHTML = "ShareLinkKey";
	keyDiv.appendChild(keyLabel);
	var keyInput = document.createElement("input");
	current_link.keyInput = keyInput;
	keyInput.id = "sharelinkkey";
	keyInput.type = "text";
	keyDiv.appendChild(keyInput);

	current_link.appendChild(keyDiv);

	var shareLinkTypeDiv = document.createElement("div");
	var shareLinkTypeLabel = document.createElement("label");
	shareLinkTypeLabel.innerHTML = "Share Link Type";
	shareLinkTypeDiv.appendChild(shareLinkTypeLabel);
	var shareLinkTypeSelect = document.createElement("select");
	current_link.shareLinkTypeSelect = shareLinkTypeSelect;
	var shareLinkType = [ "key", "authenticated", "restricted"];
	for (var i=0; i<shareLinkType.length; i++){
		var option = document.createElement("option");
		option.value = shareLinkType[i];
		option.innerHTML = shareLinkType[i];
		shareLinkTypeSelect.appendChild(option);
	}
	shareLinkTypeSelect.onchange = function(event){
		for (var i=0; i < shareLinkTypeSelect.options.length; i++){
			var option = shareLinkTypeSelect.options[i];
			if (option.selected){
				document.getElementById("share_link_" + option.value).style.display="";
			}else{
				document.getElementById("share_link_" + option.value).style.display="none";
			}
		}
	}
	shareLinkTypeDiv.appendChild(shareLinkTypeSelect);
	current_link.appendChild(shareLinkTypeDiv);
	var shareLinkSpecificDiv = document.createElement("div");
	var shareLinkDivKey = document.createElement("div");
	shareLinkDivKey.id = "share_link_key";
	shareLinkSpecificDiv.appendChild(shareLinkDivKey);
	var shareLinkDivAuthenticated = document.createElement("div");
	shareLinkDivAuthenticated.style.display="none";
	shareLinkDivAuthenticated.id = "share_link_authenticated";
	shareLinkSpecificDiv.appendChild(shareLinkDivAuthenticated);

	var shareLinkDivRestricted = document.createElement("div");
	shareLinkDivRestricted.style.display="none";
	shareLinkSpecificDiv.appendChild(shareLinkDivRestricted);
	shareLinkDivRestricted.id = "share_link_restricted";

	//Add the list of users added to this share link
	var usersUl = document.createElement("ul");
	shareLinkDivRestricted.appendChild(usersUl);

	//Share Restricted requires listing the users..
	var searchTimer = null;
	var searchUsersDiv = document.createElement("div");
	var searchUsersSpan = document.createElement("span");
	searchUsersDiv.appendChild(searchUsersSpan);
	var searchUsersInput = document.createElement("input");
	searchUsersSpan.appendChild(searchUsersInput);
	searchUsersInput.type = "list";
	searchUsersInput.setAttribute("list", "searchUserResults");
	var buttonPlus = document.createElement("button");
	buttonPlus.className = "btn btn-default w-expand-info";
	var iButtonPlus = document.createElement("i");
	iButtonPlus.className = "icon-plus";
	buttonPlus.appendChild(iButtonPlus);
	buttonPlus.onclick = function(event){
		//TODO add user to user list
		event.stopPropagation();
	}
	searchUsersSpan.appendChild(buttonPlus);

	var searchUsersResponse = document.createElement("datalist");
	searchUsersResponse.id = "searchUserResults";
	searchUsersSpan.appendChild(searchUsersResponse);
	searchUsersInput.onkeyup = function(){
		clearTimeout(searchTimer);
		searchTimer = setTimeout(
			function(){
				sendRequest(
					{
						url:"auths/list_users?search=" + searchUsersInput.value,
						method:"GET",
						onSuccess: function(result){
							searchUsersResponse.innerHTML = "";
							for(var i=0; i < result.length; i++){
								var label = document.createElement("option");
								label.value = result[i].name + "(" + result[i].id +")";
								searchUsersResponse.appendChild(label);
							}
						}
					}
				);
			},
			300);
	}
	shareLinkDivRestricted.appendChild(searchUsersDiv);
	var selectedUsers = document.createElement("div");
	shareLinkDivRestricted.appendChild(selectedUsers);

	current_link.appendChild(shareLinkSpecificDiv);
	current_link.update = function(share_link){
		if (share_link){
			keyInput.value = share_link.key;
		}else{
			keyInput.value = "";
		}
		usersUl.innerHTML = "";
		if (null != share_link && "restricted" == share_link.type){
			for(var i=0; i < share_link.user_list.length; i++){
				var userLi = document.createElement("li");
				userLi.innerHTML = share_link.user_list[i];
				usersUl.appendChild(userLi);
			}
		}
	}
	if (null != share_link){
		current_link.update(share_link);
	}
	return current_link;
}

function sharePopup(element, result){
	var share_links = [];
	if (null != result){
		share_links = result.share_link.list.results;
	}
	var window_div = document.createElement("div");
	window_div.className = "window shadow";
	window_div.id = "share_link_popup";
	var caption_div = Caption("Share " + element.name);
	//End of Caption defintion
	window_div.appendChild(caption_div);
	var content_div = document.createElement("div");
	content_div.className = "content";
	content_div.id = "share_link_content";
	var current_link = null;
	var current_share_link = null;
	//if (0 != share_links.length){

		var selectShareLinks = document.createElement("select");
		content_div.appendChild(selectShareLinks);

		if (0 != share_links.length){
			current_link = share_links[0];
		}
		function refresh(){
			selectShareLinks.innerHTML = "";
			var option;
			for(var i=0; i < share_links.length; i++){

				option = document.createElement("option");
				option.value = share_links[i].name?share_links[i].name:share_links[i].key;

				option.share_link = share_links[i];
				if (null != current_link && current_link.key == option.share_link.key){
					option.setAttribute("selected", true);
				}
				option.innerHTML = option.value;
				selectShareLinks.appendChild(option);
			}
			option = document.createElement("option");
			option.value = option.innerHTML = "New Share Link";
			if (null == current_link){
				option.setAttribute("selected", true);
			}
			selectShareLinks.appendChild(option);

			selectShareLinks.onchange = function(event){
				for (var i=0; i < selectShareLinks.options.length; i++){
					var option = selectShareLinks.options[i];
					if (option.selected){
						current_link = option.share_link;
						refresh();
						break;
					}
				}
			}
			current_share_link.update(current_link);
		}
	//}
	current_share_link = createShareLinkDisplay(current_link);
	refresh();

	content_div.appendChild(current_share_link);
	window_div.appendChild(content_div);
	var buttonDiv = document.createElement("div");
	buttonDiv.className = "footer";

	var ok_button = document.createElement("input");
	ok_button.type = "button";
	ok_button.value = "Yes";
	ok_button.className = "button primary small";
	ok_button.onclick = function(){
		var cmd_name = null == current_share_link.share_link ? "create":"update";
		command = {
			name: "share_link." + cmd_name,
			share_link: {}
		};
		command.share_link[cmd_name] = {
			share_link: {
				path: current_folder +"/" + element.name,
				type: current_share_link.shareLinkTypeSelect.selectedOptions[0].value
			}
		};
		if ("restricted" == current_share_link.shareLinkTypeSelect.selectedOptions[0].value){
			//Add the users that have access to this share link

		}
		sendCommand(
			{
				data: command,
				poll: true,
				onSuccess:function(result){
					console.log(result);
					if (0 == result.state.status){
						if (result.name == "share_link.create"){
							share_links.push(result.share_link.create.share_link);
							current_link = result.share_link.create.share_link;
						}
						refresh();
					}
					//Else notify of an error...
				}
			}
		)
	};
	buttonDiv.appendChild(ok_button);
	var spacer = document.createTextNode('\u00A0');
	spacer.className="spacer";
	buttonDiv.appendChild(spacer);
	var cancel_button = document.createElement("input");
	cancel_button.type = "button";
	cancel_button.value = "No";
	cancel_button.className = "btn btn-default";
	cancel_button.onclick = function(){
		window_div.parentNode.removeChild(window_div);
	}
	buttonDiv.appendChild(cancel_button);
	window_div.appendChild(buttonDiv);
	return window_div;
}

function Caption(text){
	var caption_div = document.createElement("div");
	caption_div.className = "caption";
	//Caption definition
	var caption_span = document.createElement("span");
	caption_span.className = "icon icon-windows";
	caption_div.appendChild(caption_span);
	var caption_title = document.createElement("div");
	caption_title.className = "title";
	caption_title.innerHTML = text;
	caption_div.appendChild(caption_title);
	var caption_close_button = document.createElement("a");
	caption_close_button.className = "btn btn-default";
	var i =document.createElement("i");
	i.className = "icon-remove";
	caption_close_button.appendChild(i);
	caption_div.appendChild(caption_close_button);
	caption_close_button.onclick = function(){
		if (caption_div.parentNode.close){
			caption_div.parentNode.close();
		}
		caption_div.parentNode.parentNode.removeChild(caption_div.parentNode);
	}
	return caption_div;
}

function deletePopup(path){
	PopupClass.show({
		title: "Delete " + path,
		data: {
			path: path
		},
		message: function(){
			var content_div = document.createElement("div");
			var h3 = document.createElement("h3");
			h3.innerHTML = "Do you want to remove " + path;
			content_div.appendChild(h3);
			return content_div;
		},
		buttons:[
			{
				label: "Close",
				action: function(self){
					self.close();
				}
			},
			{
				label: "Delete",
				action: function(self){
					var path = self.getData(path);
					sendCommand(
						{
							data: {
								name: "browser.delete_item",
								browser:{
									"delete":{
										"path": path
									}
								}
							},
							onSuccess: function(result){
								self.close();
								browse(current_folder);
							}
						}
					);
				}
			}
		]
	});
}

function uploadFile(){
	//Create a popup div to enter the name of the folder to create
	var uploadFilePopup = document.createElement("form");
	uploadFilePopup.className = "window shadow";
	uploadFilePopup.onsubmit = function(){return false;};
	var caption_div = Caption("uploadFile");
	uploadFilePopup.appendChild(caption_div);
	var folderNameLabel = document.createElement("label");
	folderNameLabel.innerHTML = "Folder Name";
	var fileNameInput = document.createElement("input");
	fileNameInput.type = "file";
	fileNameInput.id = "files";
	fileNameInput.name = "file";
	fileNameInput.multiple = true;
	fileNameInput.setAttribute("required", true);
	var nameDiv = document.createElement("div");
	nameDiv.appendChild(folderNameLabel);
	nameDiv.appendChild(fileNameInput);
	uploadFilePopup.appendChild(nameDiv);

	var dropZone = document.createElement("div");
	dropZone.id = "drop_zone";

	function handleFileSelect(evt) {
	    evt.stopPropagation();
	    evt.preventDefault();


	    var files;
	    if (undefined != evt.dataTransfer){
	    	files = evt.dataTransfer.files;
	    }else{
	    	files = evt.target.files;
	    }
	    // files is a FileList of File objects. List some properties.
	    for (var i = 0, f; f = files[i]; i++) {
	    	var fileInfo = document.createElement("div");
	    	fileInfo.file = f;
	    	var output = [];

	      	output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
	                  f.size, ' bytes, last modified: ',
	                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
	                  '</li>');
	      	fileInfo.innerHTML = output.join('');
	      	fileListDiv.appendChild(fileInfo);
	    }
  	}

	function handleDragOver(evt) {
    	evt.stopPropagation();
	    evt.preventDefault();
	    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}

	dropZone.addEventListener('dragover', handleDragOver, false);
  	dropZone.addEventListener('drop', handleFileSelect, false);
  	fileNameInput.addEventListener('change', handleFileSelect, false);

  	uploadFilePopup.appendChild(dropZone);
  	var fileListDiv = document.createElement("output");
  	uploadFilePopup.appendChild(fileListDiv);

	var buttonDiv = document.createElement("div");
	buttonDiv.className = "footer";
	var cancelButton = document.createElement("a");
	cancelButton.type = "btn btn-default";
	cancelButton.innerHTML = "Cancel";
	cancelButton.className = "btn btn-default";
	cancelButton.onclick = function(){
		uploadFilePopup.parentNode.removeChild(uploadFilePopup);
	}
	buttonDiv.appendChild(cancelButton);
	var goButton = document.createElement("input");
	goButton.type = "submit";
	goButton.value = "Upload";
	goButton.innerHTML = "Upload";
	goButton.onclick = function(){
		if(!uploadFilePopup.checkValidity())
		{
			return;
		}
		goButton.disabled = true;
		cancelButton.disabled = true;
		path = current_folder;
		if ("/" != path.charAt(path.length - 1)){
			path = path + "/";
		}
		//for (var i=0; i < )
		sendCommand(
			{
				data: {
					name: "browser.upload_file",
					browser:{
						upload_file:{
							"path": path + fileNameInput.files[0].name,
							"size": fileNameInput.files[0].size
						}
					}
				},
				onSuccess: function(result){
					//Check if inprogress is the status
					if (2 != result.state.status){
						var notification = new Notification({name:fileNameInput.files[0].name, status:"Upload Failed"});
					}else{

						var notification = new Notification({progressBar:true, name:fileNameInput.files[0].name, status:"Uploading"});
						function notificationUpdate(file, uploadedSize){
							notification.progressBar.value = uploadedSize/this.size * 100;
							if (100 == notification.progressBar.value){
								notification.setStatus("Upload Complete");
							}
						}
						//Now start the real work
						uploader = new ChunkedUploader(fileNameInput.files[0], {url: "/commands/" + result.command_id, progressCB:notificationUpdate.bind(fileNameInput.files[0], notification)});
						uploader.start();
					}
					document.getElementById("notifications").appendChild(notification);
					uploadFilePopup.parentNode.removeChild(uploadFilePopup);
				}
			}
		);
	}
	goButton.className = "btn btn-default";
	buttonDiv.appendChild(goButton);
	uploadFilePopup.appendChild(buttonDiv);
	setPopup(uploadFilePopup);
	fileNameInput.focus();
}
