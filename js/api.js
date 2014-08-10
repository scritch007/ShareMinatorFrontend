function sendCommandBrowserList(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("browser.list", input, config, onSuccess, onError, onPending);
}
function sendCommandBrowserCreateFolder(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("browser.create_folder", input, config, onSuccess, onError, onPending);
}
function sendCommandBrowserDelete(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("browser.delete", input, config, onSuccess, onError, onPending);
}
function sendCommandBrowserDownloadLink(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("browser.download_link", input, config, onSuccess, onError, onPending);
}
function sendCommandBrowserUploadFile(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("browser.upload_file", input, config, onSuccess, onError, onPending);
}
function sendCommandShareLinkList(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("share_link.list", input, config, onSuccess, onError, onPending);
}
function sendCommandShareLinkCreate(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("share_link.create", input, config, onSuccess, onError, onPending);
}
function sendCommandShareLinkUpdate(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("share_link.update", input, config, onSuccess, onError, onPending);
}
function sendCommandShareLinkDelete(input, config, onSuccess, onError, onPending){
	//TODO check that all the mandatory inputs are there
	sendCommand("share_link.delete", input, config, onSuccess, onError, onPending);
}
/******************AccessType******************/
var AccessType = function(){};
AccessType.NONE = 0;
AccessType.READ = 1;
AccessType.READ_WRITE = 2;
/******************AccessType******************/
/******************EnumStatus******************/
var EnumStatus = function(){};
EnumStatus.COMMAND_STATUS_DONE = 0;
EnumStatus.COMMAND_STATUS_QUEUED = 1;
EnumStatus.COMMAND_STATUS_IN_PROGRESS = 2;
EnumStatus.COMMAND_STATUS_ERROR = 3;
EnumStatus.COMMAND_STATUS_CANCELLED = 4;
/******************EnumStatus******************/
/******************EnumCommandErrorCode******************/
var EnumCommandErrorCode = function(){};
EnumCommandErrorCode.ERROR_NO_ERROR = 0;
EnumCommandErrorCode.ERROR_MISSING_COMMAND_BODY = 1;
EnumCommandErrorCode.ERROR_MISSING_PARAMETERS = 2;
EnumCommandErrorCode.ERROR_INVALID_PARAMETERS = 3;
EnumCommandErrorCode.ERROR_NOT_ALLOWED = 4;
EnumCommandErrorCode.ERROR_INVALID_PATH = 5;
EnumCommandErrorCode.ERROR_FILE_SYSTEM = 6;
EnumCommandErrorCode.ERROR_SAVING = 7;
EnumCommandErrorCode.ERROR_UNKNOWN = 8;
/******************EnumCommandErrorCode******************/
/******************EnumShareLinkType******************/
var EnumShareLinkType = function(){};
EnumShareLinkType.EnumShareByKey = 0;
EnumShareLinkType.EnumRestricted = 1;
EnumShareLinkType.EnumAuthenticated = 2;
/******************EnumShareLinkType******************/
