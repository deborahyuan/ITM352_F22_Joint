// POST FOR LOGIN
app.post("/login", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	// Process login form POST and redirect to logged in page if ok, back to login page if not
	let inputusername = request.body[`username`].toLowerCase();
	console.log(inputusername);
	let inputpassword = request.body[`password`];
	let currentuser = inputusername; // current user is based off of what the person put in as their username
	loginError = {}; // resets to no errors

	var encryptedPassword = encrypt(inputpassword); // variable to encrypt the inputted password

	if (typeof users[inputusername] != "undefined") {
		//
		if (users[inputusername].password == encryptedPassword) {
			// if the password typed in the login page matches with the one on file then...
			users[inputusername].amtlogin += Number(1); // increase the number of times someone has logged in by 1
			actusers[inputusername] = {}; // creates an emtpy array for a new active(online/logged in) user
			users[inputusername].loginstatus = true; // sets the user's account login status to true
			users[inputusername].lasttimelog = users[inputusername].currtimelog; // changes what was previously the current time logged in to the LAST time they logged in
			users[inputusername].currtimelog = getCurrentDate(); // get current date and set that to the current time in the user's account
			actusers[inputusername] = users[inputusername]; // copies over all the information on the user's account, including login status, into the active user object JSON
			userstatus = "currentuser=" + currentuser + "&"; // creates a variable user status to add to params later

			response.cookie("activeuser", inputusername); // sets the cookie's active user as the username if credentials are correct

			let data = JSON.stringify(users); // rewrites user reg. file
			let actdata = JSON.stringify(actusers); // rewrites active user file
			fs.writeFileSync(fname, data, "utf-8"); // syncs user reg. file
			fs.writeFileSync(actname, actdata, "utf-8"); // syncs active user file
			response.redirect("loginsuccess?" + params.toString() + "&" + userstatus); // appends the currentuser to the end of params
		} else {
			// if the password was incorrect, then keep the user on the login page, with their inputted username kept as a sticky
			response.redirect(
				"login?" + params.toString() + "&username=" + inputusername
			);
			loginError["badloginpass"] = `Password is incorrect!`; // the login error for bad password is then set
		}
		return;
	}
	response.redirect(
		"login?" + params.toString() + "&username=" + inputusername // puts username into params to make it sticky
	);
	loginError["nonexistuser"] = `Username does not exist`; // the login error for when the username doesn't exist is then set
});

// GET LOGIN SUCCESS : the page you get sent to if login is successful
app.get("/loginsuccess", function (request, response) {
	//
	let params = new URLSearchParams(request.query); // grabs params from query
	console.log(params.toString());
	if (params.has("currentuser")) {
		// if params has currentuser, set that as a variable
		currentuser = params.get("currentuser");
	}

	tfiles["loginsuccesstemp"] = {}; // writing temp files to solve issue of restarting server T^T
	tfiles["loginsuccesstemp"].currentuser = currentuser;
	tfiles["loginsuccesstemp"].stringparams = params.toString();

	let tempdata = JSON.stringify(tfiles); // writing and syncing temp data files
	fs.writeFileSync(tempname, tempdata, "utf-8");

	// WELCOME MESSAGES
	if (Object.keys(actusers).length == 2) {
		// PART OF IR5: keeping track of how many users are logged in (using values stored in the active_users.json object)
		// if there is 1 active user in the object (the number is 2 because there is an object permanently there that isn't a user's account), then adjust the sentence structure
		// grammar fixer
		str =
			"There is currently " +
			Number(Object.keys(actusers).length - 1) +
			" person logged in.";
	} else {
		str =
			"There are currently " +
			Number(Object.keys(actusers).length - 1) +
			" people logged in.";
	}

	if (actusers[tfiles["loginsuccesstemp"].currentuser].amtlogin == 1) {
		// if the user has only logged in once, adjust the grammar
		// grammar fixer
		str2 =
			"You've logged in a total of " +
			actusers[tfiles["loginsuccesstemp"].currentuser].amtlogin +
			" time.";
	} else {
		str2 =
			"You've logged in a total of " +
			actusers[tfiles["loginsuccesstemp"].currentuser].amtlogin +
			" times.";
	}

	if (
		// if this is the user's first time logging in
		actusers[tfiles["loginsuccesstemp"].currentuser].lasttimelog == 0 ||
		actusers[tfiles["loginsuccesstemp"].currentuser].lasttimelog == undefined
	) {
		str3 = "This is the first time you've logged in.";
	} else {
		str3 =
			"You were last logged in on " +
			actusers[tfiles["loginsuccesstemp"].currentuser].lasttimelog +
			". <B>Welcome back!<B>";
	}
	response.send(
		`
		<!-- 
		Login/Registration Success for Assignment2
		Author: Deborah Yuan & Evon Diep
		Date: 11/16=8/22
		Desc: This page serves as welcome page for users who have either JUST logged in or JUST registered. From this page, users can edit their account by clicking the button, or they can check out by going to their invoice. The buttons in the right corner are also functioning.
		-->
		
		<head>
		  <meta charset="utf-8">
		
		  <meta name="viewport" content="width=device-width, initial-scale=1">
		
		  <title>Smart Phone Store</title>
		
		  <!-- bootstrap from w3 schools (https://www.w3schools.com/bootstrap/tryit.asp?filename=trybs_temp_store&stacked=h) -->
		  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
		  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
		  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
		
		  <!-- google fonts -->
		  <link rel="preconnect" href="https://fonts.googleapis.com">
		  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
		
		   <!-- my own stylesheet (products-style.css) -->
		  <link href="products-style.css" rel="stylesheet">
		  <style>
			/* Remove the navbar's default rounded borders and increase the bottom margin */
			.navbar {
			  margin-bottom: 50px;
			  border-radius: 0;
			}

		  </style>
		</head>
		
		 <!-- navigation bar from w3 schools -->
		  <nav class="navbar navbar-inverse">  
			<div class="container-fluid">
			  <div class="navbar-header">
				<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
				  <span class="icon-bar"></span>
				  <span class="icon-bar"></span>
				  <span class="icon-bar"></span>
				</button>
				<a class="navbar-brand" href="#">
				   <!-- corner navbar Apple icon -->
				  <img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment1_images/Apple-Logo.png" width="20" alt=""></a>
			  </div>
			  <div class="collapse navbar-collapse" id="myNavbar">
				<ul class="nav navbar-nav">
				  <li class="active"><a href="./">Home</a></li>
				</ul>
				<ul class="nav navbar-nav">
				  <!-- clicking this 'tab' leads to products display -->
				  <li ><a href="./products_display.html">Products</a></li>
				</ul>
				<ul class="nav navbar-nav navbar-right">
				<div class="collapse navbar-collapse" id="myNavbar">
				<ul class="nav navbar-nav">
				<li>
				<!-- click the text to redirect to edit account page, learned from (https://stackoverflow.com/questions/23672139/how-to-submit-a-form-by-clicking-a-link-javascript) -->
				<form action="?${tfiles["loginsuccesstemp"].stringparams}" method="POST" style="position: absolute; top: 14px; right: 70px; width: 100px">
				<a href="javascript:;" onclick="parentNode.submit();" style="text-decoration: none; color: grey;"><span class="glyphicon glyphicon-user"></span> Edit Account</a>
				<input type="hidden" name="mess" value='Edit Account'>
				</form></li>
				</ul>
				<ul class="nav navbar-nav">
				<li>
				<!-- click the text to redirect to invoice -->
				<form action="invoice?${tfiles["loginsuccesstemp"].stringparams}" method="POST" style="position: absolute; top: 14px; right: -50px; width: 100px">
				<a href="javascript:;" onclick="parentNode.submit();" style="text-decoration: none; color: grey;"><span class="glyphicon glyphicon-shopping-cart"></span> Invoice</a>
				<input type="hidden" name="mess" value='Invoice'>
				</form></li>
				</ul>
				</ul> 
			  </div>
			</div>
		  </nav>
	
		  <div class="container text-center" style="padding-bottom: 50px;">
		  <h1 style="font-size: 6em;"> ${actusers[currentuser].fullname},</h1>
		  <p style="font-size: 2em;">you have logged in successfully</p>
		</div>

		<div class="container text-center" style="padding-bottom: 50px;">
		<p style="font-size: 2em;">${str}<BR>${str2}<BR>${str3}</p>
	  </div>
	  <div class="container text-center" style="padding-bottom: 50px;">
	<form name='editaccount' action='?${tfiles["loginsuccesstemp"].stringparams}' method="POST">
	<input type="submit" value='Edit Account Information      ' id="button"; class="button" style="min-width: 20%"></input>
	</form>
	<form name='gotoinvoice' action='/invoice?${tfiles["loginsuccesstemp"].stringparams}' method="POST">
	<input type="submit" value='Go To Invoice      ' id="button2"; class="button" style="min-width: 20%"></input>
	</form>
	</div>`
	);
});
