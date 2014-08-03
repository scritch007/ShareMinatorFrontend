function WualaDisplay(){

}

WualaDisplay.prototype.createNavElement = function(name){
	var element = document.createElement("li");
	if (null == name || undefined == name){
		var a = document.createElement("div")
		var i = document.createElement("span");
		i.className = "glyphicon glyphicon-home";
		//i.style.fontSize = "21px";
		a.appendChild(i);
		element.appendChild(a);
	}else{
		element.innerHTML = name
	}
	
	return element;
}

WualaDisplay.prototype.GetBrowsingPathElement = function(path, onBrowseChangeCB){
	var nav_bar = document.getElementById("navigation_bar");
	nav_bar.innerHTML = "";
	nav_bar.className = "row hide-for-medium-down";
	var nav = document.createElement("div");
	nav_bar.appendChild(nav);
	nav.className = "large-11 columns";
	nav.id = "breadcrumbs";
	var splitted_path = path.split("/");
	var nav_elements = splitted_path.slice(1, splitted_path.length -1);
	nav.innerHTML = "";
	var nav_ul = document.createElement("ol");
	nav_ul.className = "breadcrumb";
	nav.appendChild(nav_ul);
	var current_nav_element = this.createNavElement();
	current_nav_element.onclick = function(path){
		onBrowseChangeCB(path);
	}.bind(current_nav_element, "/");
	nav_ul.appendChild(current_nav_element);
	for (var i=0; i<nav_elements.length; i++){
		current_nav_element = this.createNavElement(nav_elements[i]);
		current_nav_element.onclick = function(path){
			onBrowseChangeCB(path);
		}.bind(current_nav_element, "/" + nav_elements.slice(0, i+1).join("/"));
		nav_ul.appendChild(current_nav_element);
	}
	if (null != current_nav_element){
		current_nav_element.className += " active";
	}
}

WualaDisplay.prototype.GetFilesListElement = function(path){
	var browse_div = document.createElement("table");
	browse_div.style.tableLayout = "fixed";
	browse_div.className = "table table-striped";
	browsing.innerHTML = "";
	this.thead = document.createElement("thead");

	var tr = document.createElement("tr");
	this.thead.appendChild(tr);

	//For the mobile
	var th = document.createElement("th");
	th.className = "visible-xs visible-sm browse-plus";
	tr.appendChild(th);
	//File Type
	th = document.createElement("th");
	th.innerHTML = "#";
	th.className = "browse-type";
	tr.appendChild(th);

	//FileName
	th = document.createElement("th");
	th.innerHTML = "Name";
	th.className = "browse-name";
	tr.appendChild(th);

	//Size
	th = document.createElement("th");
	th.innerHTML = "Size";
	th.className = "hidden-xs hidden-sm hide-for-medium-down browse-size";
	tr.appendChild(th);

	//Mdate
	th = document.createElement("th");
	th.innerHTML = "Change";
	th.className = "hidden-xs hidden-sm hide-for-medium-down browse-mdate";
	tr.appendChild(th);

	//kind
	th = document.createElement("th");
	th.innerHTML = "Kind";
	th.className = "hidden-xs hidden-sm hide-for-medium-down browse-kind";
	tr.appendChild(th);

	//Actions
	th = document.createElement("th");
	th.innerHTML = "Actions";
	th.className = "hidden-xs hidden-sm hide-for-medium-down browse-action";
	tr.appendChild(th);

	this.tbody = document.createElement("tbody");
	browse_div.appendChild(this.thead);
	browse_div.appendChild(this.tbody);

	return browse_div;
}

WualaDisplay.prototype.buildButtonDiv = function(element, displayName, 	onBrowseCB, onDownloadCB, onDeleteCB, onShareCB){
	var buttonDiv = document.createElement("div");
	buttonDiv.className = "actions";
	if (null != onDeleteCB && undefined != onDeleteCB)
	{
		var deleteButton = document.createElement("div");
		deleteButton.className = "btn btn-default";
		var i =document.createElement("span");
		i.className = "glyphicon glyphicon-trash";
		deleteButton.appendChild(i);
		deleteButton.onclick = function(path, event){
			onDeleteCB(event);
		}.bind(element, displayName);
		buttonDiv.appendChild(deleteButton);
	}


	if (null != onDownloadCB && undefined != onDownloadCB){
		var downloadButton = document.createElement("div");
		downloadButton.className = "btn btn-default";
		var i = document.createElement("span");
		i.className = "glyphicon glyphicon-download";
		downloadButton.appendChild(i);
		downloadButton.onclick = function(path, event){
			onDownloadCB(event);
		}.bind(element, displayName);
		downloadButton.appendChild(i);
		buttonDiv.appendChild(downloadButton);
	}

	if (null != onShareCB && undefined != onShareCB){
		var shareButton = document.createElement("span");
		shareButton.className = "btn btn-default";
		var i = document.createElement("span");
		i.className = "glyphicon glyphicon-share-alt";
		shareButton.appendChild(i);
		shareButton.onclick = function(path, event){
			event.stopPropagation();
			onShareCB(event);
		}.bind(element, displayName);
		buttonDiv.appendChild(shareButton);
	}
	return buttonDiv;
}

WualaDisplay.prototype.AddElement = function(list, element, displayName, onBrowseCB, onDownloadCB, onDeleteCB, onShareCB){
	var name = displayName;
	if (null == element){
		element = {
			size: "-",
			kind: "-",
			mDate: "-"
		}
	}
	var tr = document.createElement("tr");
	tr.className = "w-open-path pointer ";
	//TODO TO REMOVE AFTER REWRITING IT
	a = tr;

	//Mobile
	var td = document.createElement("td");
	td.className = "	visible-xs";

	var buttonPlus = document.createElement("div");
	buttonPlus.className = "btn btn-default";
	var iButtonPlus = document.createElement("span");
	iButtonPlus.className = "glyphicon glyphicon-plus-sign";
	buttonPlus.appendChild(iButtonPlus);
	buttonPlus.onclick = function(event){
		if (mobtr.style.display == "none"){
			mobtr.style.display = "table-row";
			iButtonPlus.className = "icon-minus";
		}else{
			mobtr.style.display = "none";
			iButtonPlus.className = "icon-plus";
		}
		event.stopPropagation();
	}
	td.appendChild(buttonPlus)
	tr.appendChild(td);

	td=document.createElement("td");
	var img = document.createElement("span");
	img.className = "glyphicon glyphicon-file";
	td.appendChild(img);
	tr.appendChild(td);

	if (onBrowseCB){
		tr.className = "browseable";
		img.className = "glyphicon glyphicon-folder-open";
		tr.onclick = function(path, event){
			onBrowseCB(event);
		}.bind(a, name);

	}

	td = document.createElement("td");
	td.innerHTML = name;
	tr.appendChild(td);

	//Size
	th = document.createElement("td");
	th.innerHTML =  bytesToSize(element.size);

	th.className = "hidden-xs hidden-sm";
	tr.appendChild(th);

	//Mdate
	th = document.createElement("td");

    if ("-" == element.mDate){
      element.mDateStr = "";
    }else{
      var temp = new Date(element.mDate * 1000)
      element.mDateStr = temp.toDateString();
    }
	th.innerHTML = element.mDateStr;
	th.className = "hidden-xs hidden-sm";
	tr.appendChild(th);

	//kind
	th = document.createElement("td");
	th.innerHTML = element.kind;
	th.className = "hidden-xs hidden-sm";
	tr.appendChild(th);

	td = document.createElement("td");
	td.className = "hidden-xs hidden-sm";
	tr.appendChild(td);

	var buttonDiv = this.buildButtonDiv(element, displayName, onBrowseCB, onDownloadCB, onDeleteCB, onShareCB);
	td.appendChild(buttonDiv);
	this.tbody.appendChild(a);
	//TODO make another one for the phones :)
	var mobtr = document.createElement("tr");
	mobtr.className = "hide";
	mobtr.style.display = "none";
	td = document.createElement("td");
	td.colSpan = "4";
	mobtr.appendChild(td);

	if (null != onDownloadCB && undefined != onDownloadCB){
		var div = document.createElement("div");
		var strong = document.createElement("strong");
		strong.innerHTML = "Size";
		div.appendChild(strong);
		div.innerHTML += ": " + bytesToSize(element.size);
		td.appendChild(div);
		div = document.createElement("div");
		strong = document.createElement("strong");
		strong.innerHTML = "Change";
		div.appendChild(strong);
		div.innerHTML += ": " + element.mDateStr;
		td.appendChild(div);
		div = document.createElement("div");
		strong = document.createElement("strong");
		strong.innerHTML = "Kind";
		div.appendChild(strong);
		div.innerHTML += ": -";
		td.appendChild(div);
	}
	var actiondiv = this.buildButtonDiv(element, displayName, onBrowseCB, onDownloadCB, onDeleteCB);
	td.appendChild(actiondiv)
	mobtr.appendChild(td);
	//<tr class="hide" data-wuala-path="/CMX10-Android/Android/CM10/Kernel/X10_4.1.X_CMX10_bootmanager_v13.ftf/" style="display: table-row;">
    // <td colspan="8">
    //  <div><strong>Size</strong> : 6.3 MB</div>
    //  <div><strong>Change</strong> : 1 years ago</div>
    //  <div><strong>Kind</strong> :  <i class="muted">ftf</i></div>
    //  <div class="actions">
    //    <a href="https://content.wuala.com/contents/CMX10-Android/Android/CM10/Kernel/X10_4.1.X_CMX10_bootmanager_v13.ftf/?dl=1" class="btn btn-default w-download"><i class="icon-arrow-down"></i></a>
    //    <a class="btn btn-default w-open-sharing" data-reveal-idd="sharing"><i class="icon-share-alt"></i></a>
    //  </div>
    // </td>
    //</tr>
    this.tbody.appendChild(mobtr);
}

WualaDisplay.prototype.AddEmptyList = function(list){
	var tr = document.createElement("tr");
	tr.innerHTML = "No files nor folder";
	this.tbody.appendChild(tr);
}

WualaDisplay.prototype.GetListDisplayComponent = function(list){
	return list;
}

WualaDisplay.prototype.GetDeletePopup = function(path, onOkClickCB, onCancelClickCB){

};

WualaDisplay.prototype.GetDownloadPopup = function(path, onDownloadClickCB, onCancelClickCB){

}