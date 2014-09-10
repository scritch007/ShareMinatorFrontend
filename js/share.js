
function createShareLinkDisplay(share_link){
	var current_link = document.createElement("div");
	current_link.share_link = share_link;
	var keyDiv = document.createElement("div");
	//keyDiv.className = "input-group";
	var keyLabel = document.createElement("label");
	keyLabel.innerHTML = "ShareLinkKey";
	keyDiv.appendChild(keyLabel);
	var keyInput = document.createElement("input");
	current_link.keyInput = keyInput;
	keyInput.className = "form-control";
	keyInput.id = "sharelinkkey";
	keyInput.type = "text";
	keyDiv.appendChild(keyInput);
	keyLabel.setAttribute("for", "sharelinkkey");

	current_link.appendChild(keyDiv);

	var shareLinkTypeDiv = document.createElement("div");
	//shareLinkTypeDiv.className = "input-group";
	var shareLinkTypeLabel = document.createElement("label");
	shareLinkTypeLabel.innerHTML = "Share Link Type";
	shareLinkTypeDiv.appendChild(shareLinkTypeLabel);
	var shareLinkTypeSelect = document.createElement("select");
	shareLinkTypeSelect.id = "sharelinktypeselect";
	shareLinkTypeSelect.className = "form-control";
	current_link.shareLinkTypeSelect = shareLinkTypeSelect;
	shareLinkTypeLabel.setAttribute("for", "sharelinktypeselect");
	var shareLinkType = [{key:"key", value:EnumShareLinkType.EnumShareByKey},
	{key:"authenticated", value:EnumShareLinkType.EnumAuthenticated},
	{key:"restricted", value:EnumShareLinkType.EnumRestricted}];
	for (var i=0; i<shareLinkType.length; i++){
		var option = document.createElement("option");
		option.value = shareLinkType[i].value;
		option.innerHTML = shareLinkType[i].key;
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
			var content_div = document.createElement("form");
			content_div.className = "content";
			content_div.id = "share_link_content";

			//if (0 != share_links.length){

				var selectShareLinks = document.createElement("select");
				selectShareLinks.className = "selectpicker form-control";
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
							path: current_folder.path +"/" + element.name,
							type: parseInt(current_share_link.shareLinkTypeSelect.selectedOptions[0].value)
						}
					}
					if (EnumShareLinkType.EnumRestricted == parseInt(current_share_link.shareLinkTypeSelect.selectedOptions[0].value)){
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
