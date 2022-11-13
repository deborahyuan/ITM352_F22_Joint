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

// read files
var fs = require("fs");
var fname = "user_registration_info.json";
var prodname = __dirname + "/products.json";

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
} else {
	console.log("Sorry file " + prodname + " does not exist.");
	products = {};
}

var errors = {}; // empty error array
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

ordered = "";

app.post("/purchase", function (request, response) {
	// process purchase request (validate quantities, check quantity available)
	let validinput = true; // assume that all terms are valid
	let allblank = false; // assume that it ISN'T all blank
	let instock = true;
	let othererrors = false; //assume that there aren't other errors
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
			let proddata = JSON.stringify(products);
			fs.writeFileSync(prodname, proddata, "utf-8");
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
	/*if (users[user_name] == undefined && user_pass == user_pass2) {
		if (users[user_name] != user_name) {
			products[i].quantity_available = user_name;
			products[i].quantity_sold = user_pass;
			let data = JSON.stringify(users);

			fs.writeFileSync(fname, data, "utf-8");
			response.redirect("./invoice.html?" + params.toString());
		}*/

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
		response.redirect("login.html?" + params.toString());
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
	let user_pass = POST["password"];
	let user_pass2 = POST["passwordconfirm"];

	if (users[user_name] == undefined && user_pass == user_pass2) {
		if (users[user_name] != user_name) {
			users[user_name] = {};
			users[user_name].name = user_name;
			users[user_name].password = user_pass;
			loggedin = true;
			let data = JSON.stringify(users);

			fs.writeFileSync(fname, data, "utf-8");
			response.redirect("./invoice.html?" + params.toString());
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

app.post("/invoice", function (request, response) {
	console.log(ordered);
	response.redirect("invoice.html?" + ordered);
});

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
