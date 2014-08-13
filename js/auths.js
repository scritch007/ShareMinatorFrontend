var availableAuths = [];

function HandleAuthsResult(result){
	console.log(result);
	for (var i =0; i < result.length; i++){
		switch(result[i]){
			case "DummyAuth":
			availableAuths.push(result[i]);
			break;
			default:
			console.log("Unknown authentication type " + result[i]);
			break;
		}
	}
}

function checkAuth(callback){
	if (undefined != sessionStorage.current_user){
		//Hide login button and show logout one
		document.getElementById("logout").style.display="";
		document.getElementById("login").style.display="none";
		document.getElementById("signup").style.display="none";
		user = JSON.parse(sessionStorage.current_user)
		//Todo ask for who you really are
		callback(sessionStorage.Authentication);
	}else{
		callback(null);
	}
}

function validatePassword(){
	var pass2=document.getElementById("signupPasswordCheck").value;
	var pass1=document.getElementById("signupPassword").value;
	if(pass1!=pass2)
	    document.getElementById("signupPasswordCheck").setCustomValidity("Passwords Don't Match");
	else
	    document.getElementById("signupPasswordCheck").setCustomValidity('');
	//empty string means no validation error
}

function signup(){

	PopupClass.show({
		"title": "Sign up",
		message: function(self){
			var content_div = document.createElement("form");
			content_div.setAttribute("role", "form");
			//Content
			var loginDiv = document.createElement("div");
			var loginLabel = document.createElement("label");
			loginLabel.innerHTML = "Login";
			loginLabel.htmlFor="loginInput";
			var loginInput = document.createElement("input");
			loginInput.id="loginInput";
			loginInput.type = "text";
			loginInput.name="fname";
			loginInput.placeholder = "Enter your login";
			loginInput.setAttribute("required", true);
			loginInput.className = "form-control";
			self.loginInput = loginInput;
			loginDiv.appendChild(loginLabel);
			loginDiv.appendChild(loginInput);
			content_div.appendChild(loginDiv);
			var passwordDiv = document.createElement("div");
			var passwordLabel = document.createElement("label");
			passwordLabel.innerHTML = "Password";
			var passwordInput = document.createElement("input");
			passwordInput.type = "password";
			passwordInput.id = "signupPassword";
			passwordInput.placeholder = "Enter your password";
			passwordInput.setAttribute("required", true);
			passwordInput.className = "form-control";
			self.passwordInput = passwordInput;
			passwordDiv.appendChild(passwordLabel);
			passwordDiv.appendChild(passwordInput);
			content_div.appendChild(passwordDiv);

			var passwordcheckDiv = document.createElement("div");
			var passwordcheckLabel = document.createElement("label");
			passwordcheckLabel.innerHTML = "Password Verification";
			var passwordcheckInput = document.createElement("input");
			passwordcheckInput.type = "password";
			passwordcheckInput.id = "signupPasswordCheck";
			passwordcheckInput.placeholder = "Enter same password";
			passwordcheckInput.setAttribute("required", true);
			passwordcheckInput.className = "form-control";
			passwordcheckDiv.appendChild(passwordcheckLabel);
			passwordcheckDiv.appendChild(passwordcheckInput);
			content_div.appendChild(passwordcheckDiv);

			passwordInput.onchange = validatePassword;
		    passwordcheckInput.onchange = validatePassword;

			var emailDiv = document.createElement("div");
			var emailLabel = document.createElement("label");
			emailLabel.innerHTML = "Email";
			emailLabel.htmlFor = "signupEmail"
			var emailInput = document.createElement("input");
			emailInput.type = "email";
			emailInput.name = "email";
			emailInput.id = "signupEmail";
			emailInput.placeholder = "Enter your email";
			emailInput.setAttribute("required", true);
			emailInput.className = "form-control";
			self.emailInput = emailInput;
			emailDiv.appendChild(emailLabel);
			emailDiv.appendChild(emailInput);
			content_div.appendChild(emailDiv);
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
				label:"Signup",
				cssClass: "btn-primary",
				action: function(self){
					sendRequest({
							url:"auths/DummyAuth/create",
							method:"POST",
							data: {
								"login": self.loginInput.value,
								"password": self.passwordInput.value,
								"email": self.emailInput.value
							},
							onSuccess: function(result){
								console.log("Account created");
								self.close();
							}
						}
					);
				}
			}
		]
	});
}

function login(){
	PopupClass.show({
		title: "Login",
		message: function(self){
			var contentDiv = document.createElement("form");
			contentDiv.setAttribute("role", "form");
			var loginDiv = document.createElement("div");
			var loginLabel = document.createElement("label");
			loginLabel.htmlFor="loginInput";
			loginLabel.innerHTML = "Login";
			var loginInput = document.createElement("input");
			loginInput.type = "text";
			loginInput.setAttribute("required", true);
			loginInput.className = "form-control";
			self.loginInput = loginInput;
			loginInput.placeholder = "Enter your login";
			loginDiv.appendChild(loginLabel);
			loginDiv.appendChild(loginInput);
			contentDiv.appendChild(loginDiv);
			var passwordDiv = document.createElement("div");
			var passwordLabel = document.createElement("label");
			passwordLabel.htmlFor="passwordInput";
			passwordLabel.innerHTML = "Password";
			var passwordInput = document.createElement("input");
			passwordInput.type = "password";
			passwordInput.setAttribute("required", true);
			passwordInput.placeholder = "Enter your login";
			passwordInput.className = "form-control";
			self.passwordInput = passwordInput;
			passwordDiv.appendChild(passwordLabel);
			passwordDiv.appendChild(passwordInput);
			contentDiv.appendChild(passwordDiv);
			return contentDiv;
		},
		buttons:[
			{
				label: "Cancel",
				action: function(self){
					self.close();
				}
			},{
				label: "Login",
				cssClass:"btn-primary",
				action: function(self){
					sendRequest(
						{
							url:"auths/DummyAuth/get_challenge",
							method:"GET",
							onSuccess: function(result){
								//TODO at one point we should hash the challenge but never mind for now :)
								sendRequest(
									{
										url: "auths/DummyAuth/auth",
										method: "POST",
										data: {
											"login": self.loginInput.value,
											"challenge_hash": result.challenge + ":" + self.passwordInput.value,
											"ref": result.ref
										},
										onSuccess: function(result){
											//Hide login button and show logout one
											document.getElementById("logout").style.display="";
											document.getElementById("signup").style.display="none";
											document.getElementById("login").style.display="none";
											//Set the Global Header
											user = result;
											sessionStorage.current_user = JSON.stringify(user);
											self.close();
											browse(current_folder.path);
										}
									}
								);
							}
						}
					);
				}
			}
		]
	});
}

function logout(){
	delete sessionStorage.current_user;
	user = null;
	//Hide login button and show logout one
	document.getElementById("logout").style.display="none";
	document.getElementById("login").style.display="";
	document.getElementById("signup").style.display="";
	browse("/");
}
