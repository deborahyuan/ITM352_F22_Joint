/* 
Server for Assignment1
Author: Deborah Yuan
Date: 11/2/22
Desc: This server, server.js, provides validation for the data submitted by the form on products display, responding with the appropriate response depending on whether the quantities inputted are valid or invalid. In case of valid quantities, the user will be sent to the invoice. With invalid quantities, the user will be sent an error.
*/

const { getRandomValues } = require("crypto");
var express = require("express");
var app = express();
var path = require("path");

app.use(express.static(__dirname + "/public")); // route all other GET/POST requests to files in public
app.use("/css", express.static(__dirname + "/public")); // ?
app.use(express.urlencoded({ extended: true }));

var fs = require("fs");
var fname = "user_registration_info.json";

var errors = {}; // empty error array

if (fs.existsSync(fname)) {
	var stats = fs.statSync(fname);
	data = fs.readFileSync(fname, "utf-8");
	users = JSON.parse(data);
	console.log(users);
} else {
	console.log("Sorry file " + fname + " does not exist.");
	users = {};
}

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

// pulling products data from products.json
var products = require(__dirname + "/products.json");

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

/*app.get("/login", function (request, response) {
	// Give a simple login form
	str = `
<body>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
	response.send(str);
});*/

loggedin = false;

// process purchase request (validate quantities, check quantity available)

let validinput = true; // assume that all terms are valid
ordered = "";
let allblank = false; // assume that it ISN'T all blank
let instock = true;
let othererrors = false; //assume that there aren't other errors

app.post("/purchase", function (request, response) {
	// process form by redirecting to the receipt page

	let customerquantities = request.body[`quantitytextbox`];
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
			products[i].quantity_available -= Number(qtys); // Stock, or quantity_available is subtracted by the order quantity
			products[i].quantity_sold =
				Number(products[i].quantity_sold) + Number(qtys); // EC IR1: Total amount sold, or quantity_sold increases by the order quantity
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

	if (customerquantities.join("") == 0) {
		// if the array customerquantities adds up to 0, that means there are no quantities typed in
		allblank = true;
	}

	// If we found an error, redirect back to the order page, if not, proceed to invoice

	if (allblank) {
		// if all boxes are blank, there is an error, pops up alert
		console.log(allblank);
		response.redirect(
			"products_display.html?error=Invalid%20Quantity,%20No%20Quantities%20Selected!%20Please%20type%20in%20values!"
		);
	} else if (!validinput) {
		// quantity is "Not a Number, Negative Value, or not an Integer", pops up alert
		response.redirect(
			"products_display.html?error=Invalid%20Quantity,%20Please%20Fix%20the%20Errors%20in%20Red%20on%20the%20Order%20Page!"
		);
	} else if (!instock) {
		// Existing stock is less than desired quantity, pops up alert
		response.redirect(
			"products_display.html?error=Invalid%20Quantity,%20Requested%20Quantity%20Exceeds%20Stock"
		);
	} else if (othererrors) {
		// textbox has gone missing? or some other error, pops up alert
		response.redirect(
			"products_display.html?error=Invalid%20Quantity,%20Unknown%20Error%20has%20occured"
		);
	} else {
		// If everything is good, redirect to the invoice page.
		response.redirect("login.html?" + ordered);
	}
});

app.post("/login", function (request, response) {
	// Process login form POST and redirect to logged in page if ok, back to login page if not
	let inputusername = request.body[`username`].toLowerCase();
	console.log(inputusername);
	let inputpassword = request.body[`password`];
	if (typeof users[inputusername] != "undefined") {
		if (users[inputusername].password == inputpassword) {
			loggedin = true;
			response.redirect(
				"loginsuccess.html?" +
					ordered +
					"&success=User%20" +
					inputusername +
					"%20is%20logged%20in"
			);
		} else {
			response.redirect(
				"login.html?" + ordered + "&error=Password%20is%20incorrect!"
			);
		}
		return;
	}
	response.redirect(
		"login.html?" + ordered + "&error=Username%20Does%20Not%20Exist"
	);
});

// with help from Bobby Roth
app.get("/register", function (request, response) {
	let params = new URLSearchParams(request.query);
	
	response.send(
	`
	<script> 
	if(${errors == true}) 
	{
		alert("Username is taken!");
		${errors = false};
	}
	</script>
	<form method ="POST" action ="?${params.toString()}">
	<span id="usernamelabel" name="usernamelabel">Enter an email</span><BR><BR>
	<input type="text" id ="username" class="username" name="username" placeholder="bob@example.com"</input><BR><BR>
	<span id="passwordlabel" name="passwordlabel">Enter a password</span><BR><BR>
	<input type="text" id ="password" class="password" name="password" placeholder="Password"</input><BR><BR>
	<span id="passwordlabelconfirm" name="passwordlabelconfirm">Repeat password</span><BR><BR>
	<input type="text" id ="passwordconfirm" class="passwordconfirm" name="passwordconfirm" placeholder="Password"</input><BR><BR>

	<input type="submit" value='Register' id="button"></input>
	</form>
	`
	)
	errors = false;
});

app.post("/register", function (request, response) {
	let params = new URLSearchParams(request.query);
	// process a simple register form
	username = request.body.username.toLowerCase();
	console.log(ordered);
	// check is username taken
	if (typeof users[username] != "undefined") {
		errors["username_taken"] = `Hey! ${username} is already registered!`;
	}
	if (request.body.password != request.body.passwordconfirm) {
		errors["password_mismatch"] = `Repeat password not the same as password!`;
	}
	if (request.body.username == "") {
		errors["no_username"] = `You need to select a username!`;
	}
	if (Object.keys(errors).length == 0) {
		//
		users[username] = {};
		users[username].password = request.body.password;
		fs.writeFileSync(fname, JSON.stringify(users));
		console.log("Saved: " + users);
		loggedin = true;
		response.redirect(
			"registrationsuccess" +
				ordered +
				"&success=User%20" +
				username +
				"%20is%20registered!"
		);
	} else {
		console.log(errors);
		response.send(errors);
	}
});

app.get ("/registrationsuccess", function (request, response) {
	let params = new URLSearchParams(request.query);
	response.send(`
	<script>
	let params = (new URL(document.location)).searchParams;
	console.log("Params=" +params);
	console.log(typeof params);

	var quantities = []; // declaring empty array 'quantities'
	console.log(params);
	params.forEach ( // for each iterates through all the keys
		function(value,key)
		{
		quantities.push(value); // pushes  the value to quantities array
		}
	)

	console.log("Params=" + params); // shows what the params are in the console
	// Check for an error and if so, pop up an alert to the user
	if (params.has("success")) {
		let reg_suc = params.get("success");
		document.write('${reg_suc}');
	}
</script>

<form name='invoice' action="/invoice" method="POST">
<input type="submit" id="myBtn" value='To Invoice' style="font-size:large"></button>
</form>
	`)
});

/*app.post("/register", function (request, response) {
	// process a simple register form
	let POST = request.body[`username`];
	console.log(POST);
	let user_name = POST["username"];
	let user_pass = POST["password"];
	let user_pass2 = POST["passwordconfirm"];

	if (users[user_name] == undefined && user_pass == user_pass2) {
		users[user_name] = {};
		users[user_name].name = user_name;
		users[user_name].password = user_pass;

		let data = JSON.stringify(users);
		fs.writeFileSync(fname, data, "utf-8");

		response.send("Got a registration");
		loggedin = true;
	} else if (user_name != undefined) {
		response.send("User " + user_name + " already exists!");
	} else {
		response.send("Passwords don't match!");
	}
});*/

app.post("/startregister", function (request, response) {
	console.log(ordered);
	response.redirect("register.html?" + ordered);
});

app.post("/invoice", function (request, response) {
	console.log(ordered);
	response.redirect("invoice.html?" + ordered);
});

/* app.post("/invoice2", function (request, response) {
 	let params = new URLSearchParams(request.query);
	console.log(params.toString());
	response.redirect("invoice.html?" + params.toString());
}); */

app.post("/checkstatus", function (request, response) {
	if (loggedin == true) {
		response.redirect("account.html");
	} else {
		response.redirect("login.html");
	}
});

app.post("/logout", function (request, response) {
	loggedin = false;
	ordered = "";
	response.redirect("logout.html");
});

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
