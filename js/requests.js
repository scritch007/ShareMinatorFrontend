
var user = null;

function sendRequest(obj){
	request = {
        type:obj.method,
        beforeSend: function (request)
        {
        	if (null != user){
        		request.setRequestHeader("Authentication", user.authentication_header);
        	}
        	request.setRequestHeader("Content-Type", "application/json; charset=utf-8")

        },
        url: obj.url,
        processData: false,
        success: function(results) {
			obj.onSuccess(results);

        },
        error: function(request, status, error){
        	if (401 == request.status){
        		user = null;
        	}
        	if ((null != obj.onError) && (undefined != obj.onError)){
        		obj.onError(request, status, error);
        	}
        },
        dataType:"json"
    }
    if (null != obj.data || undefined != obj.data){
    	request.data = JSON.stringify(obj.data);
    }
   	$.ajax(request);
}

function sendCommand(command, input, request, onSuccess, onError, onPending){
	request.url = "commands";
	request.method = "POST";
    request.onSuccess = onSuccess;
    request.onError = onError;
	var key = queryString["key"];

    var splitted = command.split(".");
    var cmd = {name: command};
    cmd[splitted[0]] = {};
    cmd[splitted[0]][splitted[1]] = { input: input};
    request.data = cmd;
	if (undefined != key){
		request.data.auth_key = key;
	}
		var tempOnSuccess = request.onSuccess;
		request.onSuccess = function(result){
			if ((2 == result.state.status) || (1 == result.state.status)){
                if (undefined != request.poll && request.poll){
				    window.setTimeout(function(){
				    	sendRequest({
				    		url:"commands/" + this.command_id,
				    		method:"GET",
				    		onSuccess: tempOnSuccess
				    	});
				    }.bind(result), 3000);
				    return
                }else if (onPending){
                    onPending(result);
                    return
                }
			}
            if (3 == result.state.status){
                if ((null != request.onError) || (undefined != request.onError)){
                    request.onError(request, result.state.error_code, 200);
                }

            }else if (0 == result.state.status){
                tempOnSuccess(result);
            }
	}
	sendRequest(request);
}