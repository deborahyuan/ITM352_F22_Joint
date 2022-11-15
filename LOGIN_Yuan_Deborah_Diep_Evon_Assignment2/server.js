/* 
Server for Assignment1
Author: Deborah Yuan
Date: 11/2/22
Desc: This server, server.js, provides validation for the data submitted by the form on products display, responding with the appropriate response depending on whether the quantities inputted are valid or invalid. In case of valid quantities, the user will be sent to the invoice. With invalid quantities, the user will be sent an error.
*/

const { getRandomValues } = require("crypto");
var express = require("express");
/*var bcrypt = require("bcrypt"); // for bcrypt */
var app = express();
var path = require("path");

app.use(express.static(__dirname + "/public")); // route all other GET/POST requests to files in public
app.use("/css", express.static(__dirname + "/public")); // ?
app.use(express.urlencoded({ extended: true }));

// read files
var fs = require("fs");
const e = require("express");
var fname = "user_registration_info.json";
var prodname = __dirname + "/products.json";
var actname = __dirname + "/active_users.json";

if (fs.existsSync(fname)) {
	var stats = fs.statSync(fname);
	data = fs.readFileSync(fname, "utf-8");
	users = JSON.parse(data);
	console.log(users);
} else {
	console.log("Sorry file " + fname + " does not exist.");
	users = {};
}

if (fs.existsSync(prodname)) {
	var stats = fs.statSync(prodname);
	proddata = fs.readFileSync(prodname, "utf-8");
	products = JSON.parse(proddata);
	console.log(products);
	console.log("LENGTH" + products.length);
} else {
	console.log("Sorry file " + prodname + " does not exist.");
	products = {};
}

if (fs.existsSync(actname)) {
	var stats = fs.statSync(actname);
	actdata = fs.readFileSync(actname, "utf-8");
	actusers = JSON.parse(actdata);
	console.log(actusers);
} else {
	console.log("Sorry file " + actname + " does not exist.");
	actusers = {};
}

var errors = {}; // empty error array

/* BCRYPT
var hash = bcrypt.hashSync("my password");
console.log(hash);

bcrypt.compareSync("my password", hash); // true
console.log(bcrypt.compareSync("my password", hash)); // true

bcrypt.compareSync("not my password", hash); // false
console.log(bcrypt.compareSync("not my password", hash)); // true
*/
/* bcrypt testing CURRENTLY NOT WORKING :()
import * as bcrypt from 'bcrypt'
// generateHash('password123');
function generateHash (typeof password == 'string') {
	const salt = bcrypt.genSaltSync(12); // range of 10-12 is generally sufficient protection
	const hash = bcrypt.hashSync(password, salt);// inside ()  is what we are trying to hash, random data
	return hash;

}
console.log (generateHash('password123'));
*/

/* functions */

// isNonNegativeInteger tests the input for errors, then returns error messages if any
function isNonNegativeInteger(queryString, returnErrors = false) {
	errors = []; // assume no errors at first
	if (Number(queryString) != queryString) {
		errors.push("Not a number!"); // Check if string is a number value
	} else {
		if (queryString < 0) errors.push("a Negative value!"); // Check if it is non-negative
		if (parseInt(queryString) != queryString) errors.push("Not an integer!"); // Check that it is an integer
	}

	if (returnErrors) {
		return errors;
	} else if (errors.length == 0) {
		return true;
	} else {
		return false;
	}
}

app.get("/products.json", function (request, response, next) {
	// if /products.json is being requested, then send back products as a string
	response.type(".json");
	var products_str = `var products = ${JSON.stringify(products)};`;
	response.send(products_str);
});

// monitor all requests
app.all("*", function (request, response, next) {
	console.log(request.method + " to " + request.path);
	next();
});

// THIS IS FOR LOGIN AND REGISTER

loggedin = false;

ordered = "";

app.post("/purchase", function (request, response) {
	// process purchase request (validate quantities, check quantity available)
	let validinput = true; // assume that all terms are valid
	let allblank = false; // assume that it ISN'T all blank
	let instock = true;
	let othererrors = false; //assume that there aren't other errors
	// process form by redirecting to the receipt page
	customerquantities = request.body[`quantitytextbox`];
	console.log("QUANTITIES=" + customerquantities);
	for (let i in customerquantities) {
		// Iterate over all text boxes in the form.
		qtys = customerquantities[i];

		let model = products[i]["name"];
		if (qtys == 0) {
			// assigning no value to certain models to avoid errors in invoice.html
			ordered += model + "=" + qtys + "&";
		} else if (
			isNonNegativeInteger(qtys) &&
			Number(qtys) <= products[i].quantity_available
		) {
			// if qtys is true, added to ordered string
			ordered += model + "=" + qtys + "&"; // appears in invoice.html's URL
		} else if (isNonNegativeInteger(qtys) != true) {
			// quantity is "Not a Number, Negative Value, or not an Integer"
			validinput = false;
		} else if (Number(qtys) >= products[i].quantity_available) {
			// Existing stock is less than desired quantity
			instock = false;
		} else {
			// textbox has gone missing? or some other error
			othererrors = true;
		}
	}

	console.log(customerquantities);
	/*if (users[user_name] == undefined && user_pass == user_pass2) {
		if (users[user_name] != user_name) {
			products[i].quantity_available = user_name;
			products[i].quantity_sold = user_pass;
			let data = JSON.stringify(users);

			fs.writeFileSync(fname, data, "utf-8");
			response.redirect("./invoice?" + params.toString());
		}*/

	if (customerquantities.join("") == 0) {
		// if the array customerquantities adds up to 0, that means there are no quantities typed in
		allblank = true;
	}

	// If we found an error, redirect back to the order page, if not, proceed to invoice

	if (allblank) {
		// if all boxes are blank, there is an error, pops up alert
		console.log(allblank);
		ordered = "";
		response.redirect(
			"products_display.html?error=Invalid%20Quantity:%20No%20Quantities%20Selected!%20Please%20type%20in%20values!"
		);
	} else if (!validinput) {
		// quantity is "Not a Number, Negative Value, or not an Integer", pops up alert
		ordered = "";
		response.redirect(
			"products_display.html?error=Invalid%20Quantity:%20Please%20Fix%20the%20Errors%20in%20Red%20on%20the%20Order%20Page!"
		);
	} else if (!instock) {
		// Existing stock is less than desired quantity, pops up alert
		ordered = "";
		response.redirect(
			"products_display.html?error=Invalid%20Quantity:%20Requested%20Quantity%20Exceeds%20Stock"
		);
	} else if (othererrors) {
		// textbox has gone missing? or some other error, pops up alert
		ordered = "";
		response.redirect(
			"products_display.html?error=Invalid%20Quantity:%20Unknown%20Error%20has%20occured"
		);
	} else {
		// If everything is good, redirect to the invoice page.
		response.redirect("login?" + ordered);
	}
});

app.get("/login", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	console.log(params.toString());
	response.send(`
	<script>
	let params = (new URL(document.location)).searchParams; // pull params from search URL

	/* allows for us to create an error alert based off of the results of the server's validataion*/
		
	  var quantities = []; // declaring empty array 'quantities'
	  params.forEach ( // for each iterates through all the keys
		function(value,key)
		{
		  quantities.push(value); // pushes the value to quantities array
		}
	  )
	

	console.log("Params=" + params); // shows what the params are in the console
	// Check for an error and if so, pop up an alert to the user
	if (params.has("error")) {
	  let err_msg = params.get("error");
	  alert(err_msg);
	}
	</script>
	<body>
		<form name='login' action="?${params.toString()}" method="POST">
		
			<span id="usernamelabel" name="usernamelabel">Enter a username</span><BR><BR>
			<input type="text" id ="username" class="username" name="username" placeholder="Username"</input><BR><BR>
			<span id="passwordlabel" name="passwordlabel">Enter a password</span><BR><BR>
			<input type="text" id ="password" class="userpasswordname" name="password" placeholder="Password"</input><BR><BR>
		
	</body>
	<footer class="container-fluid text-center">
		<!-- footer -->
		<input type="submit" value='Login' id="button"></input>
	</form>
	<form name='login' action='/startregister' method="POST">
	<input type="submit" value='New User? Click Here' id="button"></input>
	</form>`);
});

app.post("/login", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	// Process login form POST and redirect to logged in page if ok, back to login page if not
	let inputusername = request.body[`username`].toLowerCase();
	console.log(inputusername);
	let inputpassword = request.body[`password`];
	let currentuser = inputusername;
	if (typeof users[inputusername] != "undefined") {
		//
		if (users[inputusername].password == inputpassword) {
			actusers[inputusername] = {};
			actusers[inputusername] = users[inputusername];
			actusers[inputusername].loginstatus = true;
			userstatus = "currentuser=" + currentuser + "&";
			let actdata = JSON.stringify(actusers);
			fs.writeFileSync(actname, actdata, "utf-8");
			response.redirect("loginsuccess?" + userstatus + params.toString());
		} else {
			response.redirect(
				"login?" + params.toString() + "&error=Password%20is%20incorrect!"
			);
		}
		return;
	}
	response.redirect(
		"login?" + params.toString() + "&error=Username%20Does%20Not%20Exist"
	);
});

// page if Login is successful
app.get("/loginsuccess", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	if (params.has("currentuser")) {
		currentuser = params.get("currentuser");
	}
	console.log(currentuser);
	console.log(params);
	console.log(params.toString());
	if (Object.keys(actusers).length == 1) {
		// grammar fixer
		str =
			"There is currently " +
			Object.keys(actusers).length +
			" person logged in.";
	} else {
		str =
			"There are currently " +
			Object.keys(actusers).length +
			" people logged in.";
	}
	loggedin = true;
	response.send(
		`
	<p> ${currentuser}, you have logged in successfully. ${str}
	<p> You were last logged in DATE AND TIME. Welcome back!<p>
	<form name='editaccount' action='?${params.toString()}' method="POST">
	<input type="submit" value='Edit Account Information' id="button"></input>
	</form>
	<form name='gotoinvoice' action='invoice?${params.toString()}' method="GET">
	<input type="submit" value='Go To Invoice' id="button"></input>
	</form>`
	);
});

app.post("/loginsuccess", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	response.redirect("editaccount?" + params.toString());
});

// page to Edit Account

app.get("/editaccount", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	if (params.has("currentuser")) {
		currentuser = params.get("currentuser");
	}
	console.log(currentuser);
	response.send(`
	<body>
		<form name='editaccount' action="?${params.toString()}" method="POST">
			<span id="accountpageinstruction" name="accountpageinstruction">Hi ${currentuser}, edit your account information here:</span>
			<p>Only enter information into the following textboxes if you want to change these pieces of information. Otherwise, leave the box blank.<p>
			<span id="editfullnamelabel" name="editfullnamelabel">Enter your current full name in the first textbox, then your new full name in the second textbox</span><BR><BR>
			<input type="text" id ="currentfullname" class="currentfullname" name="currentfullname" placeholder="Enter Current Full Name"</input><BR><BR>
			<input type="text" id ="newfullname" class="newfullname" name="newfullname" placeholder="Enter New Full Name"</input><BR><BR>
			<span id="editusernamelabel" name="editusernamelabel">Enter your current email in the first textbox, then your new email in the second textbox</span><BR><BR>
			<input type="text" id ="currentusername" class="currentusername" name="currentusername" placeholder="Enter Current Email"</input><BR><BR>
			<input type="text" id ="newusername" class="newusername" name="newusername" placeholder="Enter New Email"</input><BR><BR>
			<span id="editpasswordlabel" name="editpasswordlabel">Enter your current password in the first textbox, then your new password in the second textbox</span><BR><BR>
			<input type="text" id ="currentpassword" class="currentpassword" name="currentpassword" placeholder="Enter Current Password"</input><BR><BR>
			<input type="text" id ="newpassword" class="newpassword" name="newpassword" placeholder="Enter New Password"</input><BR><BR>
			<span id="passwordconfirmlabel" name="passwordconfirmlabel">Confirm your new password by typing it again</span><BR><BR>
			<input type="text" id ="newpasswordconfirm" class="newpasswordconfirm" name="newpasswordconfirm" placeholder="Enter New Password Again"</input><BR><BR>
	</body>
	<footer class="container-fluid text-center">
		<!-- footer -->
		<input type="submit" value='Submit Changes' id="button"></input>
	</form>`);
});

app.post("/editaccount", function (request, response) {
	let params = new URLSearchParams(request.query);
	if (params.has("currentuser")) {
		currentuser = params.get("currentuser");
	}
	console.log(params);
	POST = request.body;
	curr_full_name = POST["currentfullname"];
	console.log(curr_full_name);
	new_full_name = POST["newfullname"];
	console.log(new_full_name);
	curr_user_name = POST["currentusername"]; // USERNAME IS THE EMAIL
	new_user_name = POST["newusername"];
	curr_pass = POST["currentpassword"];
	new_pass = POST["newpassword"];
	new_pass_2 = POST["newpasswordconfirm"];
	currentuserreqedit = false; // does the current username/email require editing the params?

	// if the current username/email exists
	if (new_full_name == "") {
		console.log("New Full Name is blank"); // status
	} else if (actusers[currentuser].name != curr_full_name) {
		console.log("Current Full Name is incorrect"); // status
	} else {
		// if new full name box isn't empty
		actusers[currentuser].name = new_full_name; // set new full name to current full name
	}

	// if the new password isn't blank and matches
	if (new_pass == "") {
		console.log("New Password is blank"); // status
		// if password isn't blank
	} else if (actusers[currentuser].password != curr_pass) {
		console.log("Current Password is incorrect"); // status
	} else if (new_pass != new_pass_2) {
		console.log("New Password Doesn't match"); // status
	} else {
		actusers[currentuser].password = new_pass; // set current password to new password
	}

	if (new_user_name == "") {
		//pulls email/username value from params if the customer doesn't plan on changing their email/username
		// if new username box is empty
		console.log("New Email is blank");
	} else {
		// if the new email/username box has a value in it, meaning the customer wants to change their username/email

		if (actusers[currentuser] != curr_user_name) {
			console.log("Username error: Current Email is incorrect");
		} else if (users[new_user_name] != undefined) {
			// if other accounts are using the desired email
			console.log("Username error: the username is already taken!"); // status if email is in use
		} else {
		}

		actusers[new_user_name] = actusers[currentuser];
		delete actusers[currentuser];
		return actusers;
		console.log("tempfile" + tempfile);
		actusers[new_user_name] = tempfile;
		console.log("actusers[new_user_name]" + actusers[new_user_name]);
		actusers[currentuser] = actusers[new_user_name];
		console.log("currentuser" + currentuser);
		currentuserreqedit = true;

		actusers[new_user_name].loginstatus = true;
		users[currentuser] = actusers[new_user_name];

		response.redirect("loginsuccess?" + params.toString());
	}
});

// with help from Bobby Roth :]
app.get("/register", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	console.log(params.toString());
	response.send(
		`
	<script> 
	if(${errors == true}) 
	{
		alert("Username is taken!");
		${(errors = false)};
	}
	</script>
	<form method ="POST" action ="?${params.toString()}">
	<span id="fullnamelabel" name="fullnamelabel">Enter your full name</span><BR><BR>
	<input type="text" id ="fullname" class="fullname" name="fullname" placeholder="First Name Last Name"</input><BR><BR>
	<span id="usernamelabel" name="usernamelabel">Enter an email</span><BR><BR>
	<input type="text" id ="username" class="username" name="username" placeholder="bob@example.com"</input><BR><BR>
	<span id="passwordlabel" name="passwordlabel">Enter a password</span><BR><BR>
	<input type="text" id ="password" class="password" name="password" placeholder="Password"</input><BR><BR>
	<span id="passwordlabelconfirm" name="passwordlabelconfirm">Repeat password</span><BR><BR>
	<input type="text" id ="passwordconfirm" class="passwordconfirm" name="passwordconfirm" placeholder="Password"</input><BR><BR>

	<input type="submit" value='Register' id="button"></input>
	</form>
	`
	);
	errors = false;
});

app.post("/register", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	let POST = request.body;
	let user_name = POST["username"];
	let user_fullname = POST["fullname"];
	let user_pass = POST["password"];
	let user_pass2 = POST["passwordconfirm"];

	if (users[user_name] == undefined && user_pass == user_pass2) {
		if (users[user_name] != user_name) {
			users[user_name] = {};
			users[user_name].name = user_fullname;
			users[user_name].password = user_pass;
			loggedin = true;
			let data = JSON.stringify(users);

			fs.writeFileSync(fname, data, "utf-8");
			response.redirect("./invoice?" + params.toString());
		}
	} else {
		response.redirect("./register?" + params.toString());
		errors = true;
	}
});

app.post("/startregister", function (request, response) {
	console.log(ordered);
	response.redirect("register?" + ordered);
});

app.get("/invoice", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log("params=" + params.toString);
	var quantities = []; // declaring empty array 'quantities'
	params.forEach(
		// for each iterates through all the keys
		function (value, key) {
			quantities.push(value); // pushes the value to quantities array
		}
	);
	console.log("quantities=" + quantities);
	if (loggedin === true) {
		// modified from stack overflow (https://stackoverflow.com/questions/34909706/how-to-prevent-user-from-accessing-webpage-directly-in-node-js)
		for (i in quantities) {
			values = quantities[i];
			if (values != 0 && isNonNegativeInteger(values)) {
				console.log("values= " + values);
				products[i].quantity_available -= Number(values); // Stock, or quantity_available is subtracted by the order quantity
				products[i].quantity_sold =
					Number(products[i].quantity_sold) + Number(values); // EC IR1: Total amount sold, or quantity_sold increases by the order quantity
				let proddata = JSON.stringify(products);
				fs.writeFileSync(prodname, proddata, "utf-8");
			}
		}
		response.redirect("invoice.html?" + params.toString());
	} else {
		response.redirect("products_display.html");
	}
});

app.post("/logout", function (request, response) {
	loggedin = false;
	ordered = "";
	response.redirect("logout.html");
});

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
