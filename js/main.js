var current_folder = null;

var displayTheme = null;

var mainWindow = null;

var queryString = {};
var hasFlash = true;
var copyClient = null;

var PopupClass = null;



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

function ToolBoxUpdate(){
	$("select").selectpicker();
}

function init(){

	PopupClass = BootstrapDialog;
	queryString = getQueryString();
	displayTheme = new WualaDisplay();
	mainWindow = document.getElementById("window_popup_id");
	//ZeroClipboard.config( { swfPath: "bower_components/zeroclipboard/dist/ZeroClipboard.swf", hoverClass: "zeroclipboard-is-hover", activeClass: "zeroclipboard-is-active" } );

	//hasFlash = !ZeroClipboard.isFlashUnusable();
	//if (hasFlash){
	//	copyClient = new ZeroClipboard();
	//}
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

	function onSuccess(result){
		current_folder = path;
		display(result, undefined==result.auth_key);
	}
	function onError(request, status, error){
		if (401 == request.status){
			logout();
			browse(path);
		}
	}
	sendCommandBrowserList({path:path}, {poll:true},onSuccess, onError);
}

function display(result, add_share_callback){
	var path = result.browser.list.input.path;
	if ("/" != path.charAt(path.length - 1)){
		path = path + "/";
	}
	displayTheme.GetBrowsingPathElement(path, browse);
	var elementListObject = displayTheme.GetFilesListElement(path);

	if ("/" != path){
		var domElem = displayTheme.AddElement(elementListObject, null, "..",
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
		domElem.className += " visible-sm visible-xs"
	}
	for(var i=0; i<result.browser.list.output.children.length; i++){
		var element = result.browser.list.output.children[i];
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
				sendCommandBrowserDownloadLink(
					{
						path: path
					},
					{},
					function(result){
							console.log(result.browser.download_link.download_link);
							downloadPopup(path, result.browser.download_link.output.download_link);
					},
					function(result, status, error){
						console.log("Couldn't get Download link");
					}
				);
			}.bind(element, element_path);
		//}
		var shareCB = null;
		if (null != user && add_share_callback){
			shareCB = function(){
				//Check if we've got a sharelink save
				sendCommandShareLinkList({
						path: this.element_path
					},
					{},
					function(result){
						sharePopup(this, result);
					}.bind(this),
					function(result){
						sharePopup(this, null);
					}.bind(this)
				);
			}.bind(element);
		}
		displayTheme.AddElement(elementListObject, element, element.name, browseCB, downloadCB, deleteCB, shareCB);
	}
	if (0 == result.browser.list.output.children.length){
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
					sendCommandBrowserCreateFolder(
						{
							"path": path + $("#createFolderNameInput")[0].value
						},
						{},
						function(result){
							browse(current_folder);
							self.close();
							Notification({name: "Folder Created", type:"success"})
						},
						function(result, status, error){
							Notification({name: "Creation Failed", type:"error"})
						}
					);
				},
				cssClass: 'btn-primary'
			}
		]
	});
}

function downloadPopup(path, download_link){
	var dlink = location.protocol + "//" + location.host + "/downloads/" + download_link;
	PopupClass.show({
		title: "Download " + path,
		data: {
			path: path,
			download_link: download_link,
			dlink: dlink
		},
		message: function(self){
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
			}
			var downloadButton = document.createElement("a");
			downloadButton.className = "btn btn-default btn-lg";
			var span = document.createElement("span");
			span.className = "fa fa-download";
			downloadButton.appendChild(span);
			url_div.appendChild(downloadButton);
			downloadButton.onclick = function(){
				window.open(dlink);
			}
			content_div.appendChild(url_div);
			return content_div;
		},
		onshown: function(self){
			var temp = $("#moncopybouton").zclip(
				{
					path: "bower_components/jquery-zclip/ZeroClipboard.swf",
					copy: self.getData('dlink'),
					afterCopy: function(){
						Notification({name: "Copy Done"});
					}

				}
			);
			console.log(temp);
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
		updateSelect(shareLinkTypeSelect);
	}
	shareLinkTypeDiv.appendChild(shareLinkTypeSelect);
	createSelect(shareLinkTypeSelect);

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
		current_link.share_link = share_link;
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
		share_links = result.share_link.list.output.share_links;
	}
	var current_share_link = null;
	var current_link = null;
	PopupClass.show({
		title: "Share " + element.name,
		data: share_links,
		message: function(self){
			var content_div = document.createElement("div");
			content_div.className = "content";
			content_div.id = "share_link_content";

			//if (0 != share_links.length){

				var selectShareLinks = document.createElement("select");
				selectShareLinks.className = "selectpicker";
				selectShareLinks.setAttribute("data-style", "btn-primary");
				content_div.appendChild(selectShareLinks);

				//Update the select object this will deal with mobile cases to.
				createSelect(selectShareLinks);


				if (0 != share_links.length){
					current_link = share_links[0];
				}
				self.refresh = function(){
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
								self.refresh();
								break;
							}
						}
					}
					current_share_link.update(current_link);
					var button = self.getButton("updateCreateId")[0];
					if (current_link){
						button.innerHTML = "Update";
					}else{
						button.innerHTML = "Create";
					}
					updateSelect(selectShareLinks);
				}
			//}
			current_share_link = createShareLinkDisplay(current_link);
			self.refresh();

			content_div.appendChild(current_share_link);
			return content_div;
		},
		onshown: function(self){
			//Call the ToolBoxUpdate method so that all the select elements are displayed correctly
			ToolBoxUpdate();
		},
		buttons: [
			{
				label: "Close",
				action: function(self){
					self.close();
				}
			},{
				id: "updateCreateId",
				cssClass:"btn-primary",
				label: current_link?"Update":"Create",
				action: function(self){
					var cmd = null == current_share_link.share_link ? sendCommandShareLinkCreate:sendCommandShareLinkUpdate;
					var share_link = {
						share_link:{
							path: current_folder +"/" + element.name,
							type: current_share_link.shareLinkTypeSelect.selectedOptions[0].value
						}
					}
					if ("restricted" == current_share_link.shareLinkTypeSelect.selectedOptions[0].value){
						//Add the users that have access to this share link
					}
					cmd(
						share_link,
						{poll: true},
						function(result){
							console.log(result);
							if (0 == result.state.status){
								if (result.name == "share_link.create"){
									share_links.push(result.share_link.create.output.share_link);
									current_link = result.share_link.create.output.share_link;
								}
								self.refresh();
							}
							//Else notify of an error...
						}
					);
				}
			}
		]
	});

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
					var path = self.getData("path");
					sendCommandBrowserDelete(
						{
							"path": path
						},
						{},
						function(result){
							self.close();
							browse(current_folder);
							Notification({name: "Folder " + path +" Deleted", type:"success"});
						},
						function(result, error, status){
							Notification({name:"Failed to delete item", type:"error"})
						}
					);
				}
			}
		]
	});
}

function uploadFile(){
	var fileList = [];
	PopupClass.show({
		title: "Upload file",
		data:{
			files: fileList
		},
		message: function(){
			var div = document.createElement("form");
			//Create a popup div to enter the name of the folder to create
			var folderNameLabel = document.createElement("label");
			folderNameLabel.innerHTML = "Folder Name";
			folderNameLabel.setAttribute("for", "files");
			var fileNameInput = document.createElement("input");
			fileNameInput.type = "file";
			fileNameInput.id = "files";
			fileNameInput.name = "file";
			fileNameInput.multiple = true;
			fileNameInput.className = "form-control";
			var nameDiv = document.createElement("div");
			nameDiv.appendChild(folderNameLabel);
			nameDiv.appendChild(fileNameInput);
			div.appendChild(nameDiv);

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
			    	fileList.push(f);
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

			dropZone.addEventListener('dragover', handleDragOver.bind(self), false);
		  	dropZone.addEventListener('drop', handleFileSelect.bind(self), false);
		  	fileNameInput.addEventListener('change', handleFileSelect.bind(self), false);

		  	div.appendChild(dropZone);
		  	var fileListDiv = document.createElement("output");
		  	div.appendChild(fileListDiv);

		  	return div;
		},
		buttons: [
			{
				label: "Cancel",
				action: function(self){
					self.close();
				}
			},
			{
				label: "Upload",
				action: function(self){
					path = current_folder;
					if ("/" != path.charAt(path.length - 1)){
						path = path + "/";
					}
					for (var i=0; i < fileList.length; i++){
						sendCommandBrowserUploadFile(
							{
								"path": path + fileList[i].name,
								"size": fileList[i].size
							},
							{},
							function(result){
								var notification = new Notification({name:this.name, status:"Upload Failed"});
								self.close();
							},
							function(result, error, status){
								Notification({name: "Upload Failed", type:"error"})
								self.close();
							},
							function(result){
								var notification = new Notification({progressBar:true, name:this.name, status:"Uploading", forever:true});
								function notificationUpdate(file, uploadedSize){
									notification.progressBar.value = uploadedSize/this.size * 100;
									if (100 == notification.progressBar.value){
										notification.setStatus("Upload Complete");
									}
								}
								//Now start the real work
								uploader = new ChunkedUploader(this, {url: "/commands/" + result.command_id, progressCB:notificationUpdate.bind(this, notification)});
								uploader.start();
								self.close();
							}.bind(fileList[i])
						);
					}
				}
			}
		]
	});

}
