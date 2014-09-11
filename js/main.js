var current_folder = null;

var displayTheme = null;

var mainWindow = null;

var queryString = {};
var hasFlash = true;
var copyClient = null;

var PopupClass = null;

var show_hidden_files = false;


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
	var current_folder = sessionStorage.current_folder?sessionStorage.current_folder:"/";
	var show_hidden_files = localStorage.show_hidden_files?localStorage.show_hidden_files: false;
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
			browse(current_folder);
		});
	});
}
function browse(path){

	function onSuccess(result){
		current_folder = result.browser.list.output.current_item;
		current_folder.path = path;
		sessionStorage.current_folder = path;
		display(result);
	}
	function onError(request, status, error){
		if (401 == request.status){
			logout();
			browse(path);
		}
	}
	sendCommandBrowserList({path:path, show_hidden_files: show_hidden_files}, {poll:true},onSuccess, onError);
}

function display(result){
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
	var elements;
	if(result.browser.list.output.current_item.isDir){
		elements = result.browser.list.output.children;
	}else{
		elements = [result.browser.list.output.current_item];
	}
	for(var i=0; i<elements.length; i++){
		var element = elements[i];
		element_path = path + element.name;
		element.element_path = element_path;
		var downloadCB = null;
		var browseCB = null;
		if (2 == current_folder.access){
			var deleteCB = function(path, event){
				event.stopPropagation();
				deletePopup(path);
			}.bind(element, element_path);
		}

		if (element.isDir){
			browseCB = function(path, event){
				browse(path);
			}.bind(element, element_path);
		}//else{
			downloadCB = function(path, event, play){
				event.stopPropagation()
				sendCommandBrowserDownloadLink(
					{
						path: path
					},
					{},
					function(result){
							console.log(result.browser.download_link.download_link);
							if (play){
								playPopup(path, element, result.browser.download_link.output.download_link);
							}else{
								downloadPopup(path, result.browser.download_link.output.download_link);
							}
					},
					function(result, status, error){
						console.log("Couldn't get Download link");
					}
				);
			}.bind(element, element_path);
		//}
		var shareCB = null;
		if (null != user && 0 != current_folder.share_access ){
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
	if (0 == elements.length){
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
					path = current_folder.path;
					if ("/" != path.charAt(path.length - 1)){
						path = path + "/";
					}
					sendCommandBrowserCreateFolder(
						{
							"path": path + $("#createFolderNameInput")[0].value
						},
						{},
						function(result){
							browse(current_folder.path);
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
function playPopup(path, element, download_link){
	var dlink = location.protocol + "//" + location.host + "/downloads/" + download_link;
	PopupClass.show({
		title: "Play",
		data: {
			path: path,
			download_link: download_link,
			dlink: dlink
		},
		message: function(self){
			var video = document.createElement("video");
			video.className = "video-js vjs-default-skin";
			video.setAttribute("controls", true);
			video.style.width = "100%";
			video.style.height = "100%";
			var source = document.createElement("source");
			source.type = element.mimetype;
			source.src = self.getData("dlink");
			video.appendChild(source);
			return video;
		}
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
							browse(current_folder.path);
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
					path = current_folder.path;
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
										browse(current_folder.path);
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
