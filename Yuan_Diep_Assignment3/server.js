/* 
Server for Assignment3
Author: Deborah Yuan & Evon Diep
Date: 12/18/22
Desc: This server, server.js, provides validation for the data submitted by the form on products display, responding with the appropriate response depending on whether the quantities inputted are valid or invalid. In case of valid quantities, the user will be sent to the login. With invalid quantities, the user will be sent an error and be returned to the products display page. This server also contains almost all the pages for this Assignment. The products display html and other htmls are routed through our server, so it's not apparent that we have html filed.
*/

var express = require("express"); // requires node's express
var app = express();
var path = require("path");
var session = require("express-session");
var cookieParser = require("cookie-parser");

// require products data // ASSIGNMENT 3 EXAMPLE CODE
products_data = require("./products.json");

// require products data // ASSIGNMENT 3 EXAMPLE CODE
user_data = require("./user_registration_info.json");

// require nodemailer to email invoices
const nodemailer = require("nodemailer");

app.use(express.static(__dirname + "/public")); // route all other GET/POST requests to files in public
app.use("/css", express.static(__dirname + "/public")); // calls css for everything in server
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	session({ secret: "ihateassignment3", resave: true, saveUninitialized: true })
);
// Code modified from https://stackoverflow.com/questions/60369148/how-do-i-replace-deprecated-crypto-createcipher-in-node-js#:~:text=according%20to%20the%20deprecation%20docs,salt)%20and%20static%20initialization%20vectors and https://stackoverflow.com/questions/51280576/trying-to-add-data-in-unsupported-state-at-cipher-update

// require crypto for password encryption
const crypto = require("crypto");

// Encrypt text
function encrypt(text) {
	encryptAlgo = crypto.createCipher("aes192", "ihateassignment3");
	let encrypted = encryptAlgo.update(text, "utf-8", "hex");
	encrypted += encryptAlgo.final("hex");
	return encrypted;
}

// Decrypt text
function decrypt(encrypted) {
	decryptAlgo = crypto.createDecipher("aes192", "ihateassignment3");
	let decrypted = decryptAlgo.update(encrypted, "hex", "utf-8");
	decrypted += decryptAlgo.final("utf-8");
	return decrypted;
}

// read files
var fs = require("fs");
var fname = "user_registration_info.json";
var prodname = __dirname + "/products.json";
var actname = __dirname + "/active_users.json";
var proddisplay = __dirname + "/products_display.html";
var index = __dirname + "/index.html";
var manageUser = __dirname + "/manageusers.html";
var manageProd = __dirname + "/manageproducts.html";

if (fs.existsSync(fname)) {
	// file syncing/rewriting for user registration info
	data = fs.readFileSync(fname, "utf-8");
	users = JSON.parse(data);
	console.log(users);
} else {
	console.log("Sorry file " + fname + " does not exist.");
	users = {};
}

if (fs.existsSync(prodname)) {
	// file syncing/rewriting for products
	proddata = fs.readFileSync(prodname, "utf-8");
	products = JSON.parse(proddata);
	console.log(products);
	console.log("LENGTH" + products.length);
} else {
	console.log("Sorry file " + prodname + " does not exist.");
	products = {};
}

if (fs.existsSync(actname)) {
	// file syncing/rewriting for active user file; act like act-ive
	actdata = fs.readFileSync(actname, "utf-8");
	actusers = JSON.parse(actdata);
	console.log(actusers);
} else {
	console.log("Sorry file " + actname + " does not exist.");
	actusers = {};
}
var regErrors = {}; // empty error object for errors in edit account and register pages

var totalItems = 0;

/* FUNCTIONS */

// date function
function getCurrentDate() {
	// PART OF IR4: OBTAINING TIME OF USER LOGIN
	var date = new Date(); // pulls new (current) date
	hours = date.getHours(); // variable for hours
	time = hours < 12 ? "AM" : "PM"; // variable for time, which sets AM or PM according to whether or not hours is less than 12
	hours = ((hours + 11) % 12) + 1; // uses % to check remainder for hours to convert from 24 hr clock to 12 hr clock
	minutes = date.getMinutes(); // variable for minutes
	minutes = minutes < 10 ? `0${minutes}` : `${minutes}`; // adds 0 in front of the minutes value if it is less than 10
	new_date =
		date.getMonth() +
		1 +
		"/" +
		date.getDate() +
		"/" +
		date.getFullYear() +
		" " +
		hours +
		":" +
		minutes +
		time; // creates a variable called new_date, which combines month, day, year, hours, minutes, then AM/PM
	return new_date; // calling on the function returns the current date + time
}

// isNonNegativeInteger tests the input for errors, then returns error messages if any, REUSED FROM ASSIGNMENT 1
function isNonNegativeInteger(queryString, returnErrors = false) {
	errors = []; // assume no errors at first
	if (Number(queryString) != queryString) {
		errors.push("Not a number!"); // Check if string is a number value
	} else {
		if (queryString < 0) errors.push("a Negative value!"); // Check if it is non-negative
		if (queryString == -0) errors.push("no -0 allowed!"); // blocks weird values like -0
		if (parseInt(queryString) != queryString) errors.push("Not an integer!"); // Check that it is an integer
	}

	if (returnErrors) {
		// if there are errors, return errors
		return errors;
	} else if (errors.length == 0) {
		return true;
	} else {
		return false;
	}
}

// REQUIREMENT: get cart item count from sessions
app.post("/get_cart", function (request, response) {
	response.json(request.session.cart);
});

// TAKEN FROM ASSIGNMENT 3 SAMPLE CODE
app.post("/get_products_data", function (request, response) {
	response.json(products_data);
});

// TAKEN FROM ASSIGNMENT 3 SAMPLE CODE
app.post("/get_user_data", function (request, response) {
	response.json(user_data);
});

// Gets all products_display for each series and maintains last visited in sessions
app.get("/products_display", function (request, response) {
	console.log(request.session.cookie);
	let params = new URLSearchParams(request.query);
	console.log("HERE " + params);

	// IR1: maintain the last product page visited
	if (params.has(`series`) && params.get(`series`) == `iPhone`) {
		request.session.lastPageVisited = "products_display?series=iPhone";
		console.log("#1" + request.session.lastPageVisited);
	} else if (params.has(`series`) && params.get(`series`) == `iPad`) {
		request.session.lastPageVisited = "products_display?series=iPad";
		console.log("#2" + request.session.lastPageVisited);
	} else if (params.has(`series`) && params.get(`series`) == `Mac`) {
		request.session.lastPageVisited = "products_display?series=Mac";
		console.log("#3" + request.session.lastPageVisited);
	} else {
		request.session.lastPageVisited = "products_display";
		console.log("#4" + request.session.lastPageVisited);
	}

	if (
		typeof request.session.invoice != "undefined" ||
		request.session.invoice == true
	) {
		request.session.destroy(); // ends session
	}
	// gets products_display.html using the server through sendFile
	response.sendFile(proddisplay);
});

// GOES TO INDEX
app.get("/", function (request, response) {
	console.log(request.session.cookie);
	if (
		typeof request.session.invoice != "undefined" ||
		request.session.invoice == true
	) {
		request.session.destroy(); // ends session
	}
	if (
		typeof request.cookies["activeuser"] != "undefined" &&
		typeof request.session.lastPageVisited != "undefined"
	) {
		// IR1: if the cookie exists, take user (must be logged in) to last page visited if they leave the site and come back
		response.redirect(request.session.lastPageVisited);
	}
	// gets index using the server through sendFile
	let params = new URLSearchParams(request.query);
	console.log(params);
	response.sendFile(index);
});

app.get("/index", function (request, response) {
	console.log(request.session.cookie);
	if (
		typeof request.session.invoice != "undefined" ||
		request.session.invoice == true
	) {
		request.session.destroy(); // ends session
	}
	if (
		typeof request.cookies["activeuser"] != "undefined" &&
		typeof request.session.lastPageVisited != "undefined"
	) {
		// IR1: if the cookie exists, take user (must be logged in) to last page visited if they leave the site and come back
		response.redirect(request.session.lastPageVisited);
	}
	// gets index using the server through sendFile
	let params = new URLSearchParams(request.query);
	console.log(params);
	response.sendFile(index);
});

// GOES TO MANAGE USERS IF ADMIN
app.get("/manageusers", function (request, response) {
	if (
		typeof request.session.invoice != "undefined" ||
		request.session.invoice == true
	) {
		request.session.destroy(); // ends session
	}

	if (
		typeof request.cookies["activeuser"] == "undefined" ||
		request.cookies["activeuser"] == ""
	) {
		response.redirect("/products_display");
	} else {
		active_user = request.cookies["activeuser"];
		if (users[active_user].admin == true) {
			response.sendFile(manageUser);
		} else {
			response.redirect("/products_display");
		}
	}
});

// GOES TO MANAGE USERS IF ADMIN
app.get("/manageproducts", function (request, response) {
	if (
		typeof request.session.invoice != "undefined" ||
		request.session.invoice == true
	) {
		request.session.destroy(); // ends session
	}

	if (
		typeof request.cookies["activeuser"] == "undefined" ||
		request.cookies["activeuser"] == ""
	) {
		response.redirect("/products_display");
	} else {
		active_user = request.cookies["activeuser"];
		if (users[active_user].admin == true) {
			response.sendFile(manageProd);
		} else {
			response.redirect("/products_display");
		}
	}
});

// ADDING TO CART FUNCTIONALITY
app.post("/addtocart", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	series = request.body["series"]; // get the product series sent from the form post
	customerquantities = [];

	customerquantities = request.body["quantitytextbox"];

	console.log("QUANTITIES=" + customerquantities);
	console.log("2QUANTITIES=" + customerquantities[1]);
	console.log("helloseries=" + series);

	products = products_data[series];

	// CODE PARTIALLY REUSED FROM ASSIGNMENT 1&2
	// process purchase request (validate quantities, check quantity available)
	let validinput = 0; // assume that all terms are valid
	let allblank = false; // assume that it ISN'T all blank
	let instock = 0; // if it is in stock

	ordered = ""; // have a variable called ordered with no value, purchased quantities will initially be in here

	for (let i in customerquantities) {
		// Iterate over all text boxes in the form.
		qtys = Number(customerquantities[i]);

		let model = products[i]["name"];
		if (qtys == 0) {
			// assigning no value to certain models to avoid errors in invoice
			ordered += model + "=" + qtys + "&";
		} else if (
			/^\d*$/.test(qtys) &&
			Number(qtys) <= products[i].quantity_available
		) {
			// if qtys is true, added to ordered string
			ordered += model + "=" + qtys + "&"; // appears in invoice's URL
		} else if (qtys == -0) {
			// if qtys is -0 block order
			validinput += 1;
			ordered += model + "=" + qtys + "&"; // appears in invoice's URL
		} else if (/^\d*$/.test(qtys) != true) {
			// quantity is "Not a Number, Negative Value, or not an Integer"
			validinput += 1;
			ordered += model + "=" + qtys + "&";
		} else if (Number(qtys) >= products[i].quantity_available) {
			// Existing stock is less than desired quantity
			instock += 1;
			ordered += model + "=" + qtys + "&";
		} else {
			// textbox has gone missing? or some other error
			othererrors = true;
		}
	}

	if (customerquantities.join("") == 0) {
		// if the array customerquantities adds up to 0, that means there are no quantities typed in
		allblank = true;
	}

	if (validinput > 0 || allblank || instock > 0) {
		if (allblank) {
			// if all boxes are blank, there is an error, pops up alert
			console.log(allblank);
			response.redirect(
				"products_display?" +
					ordered +
					"series=" +
					series +
					"&" +
					"error=Invalid%20Quantity:%20No%20Quantities%20Selected!%20Please%20type%20in%20values!"
			);
		} else if (validinput > 0) {
			// quantity is "Not a Number, Negative Value, or not an Integer", pops up alert
			response.redirect(
				"products_display?" +
					ordered +
					"series=" +
					series +
					"&" +
					"error=Invalid%20Quantity:%20Please%20Fix%20the%20Errors%20on%20the%20Order%20Page!"
			);
		} else if (instock > 0) {
			// Existing stock is less than desired quantity, pops up alert
			// ordered = "";
			response.redirect(
				"products_display?" +
					ordered +
					"series=" +
					series +
					"&" +
					"error=Invalid%20Quantity:%20Requested%20Quantity%20Exceeds%20Stock"
			);
		} else {
			// textbox has gone missing? or some other error, pops up alert
			// ordered = "";
			response.redirect(
				"products_display?" +
					ordered +
					"series=" +
					series +
					"&" +
					"error=Invalid%20Quantity:%20Unknown%20Error%20has%20occured"
			);
		}
	} else {
		shoppingCart = request.session.cart; // create shopping cart session

		for (i in customerquantities) {
			customerquantities[i] = Number(customerquantities[i]);
		}

		if (typeof request.session.cart == "undefined") {
			// if shoppingCart session doesn't exist, then make a session object called shoppingCart
			request.session.cart = {};
			request.session.cart[series] = customerquantities;

			console.log("CARTSERIES=" + request.session.cart[series]);
			console.log("sessioncartinfo=" + request.session.cart);
			for (let i in customerquantities) {
				continue;
			}
		} else if (typeof request.session.cart[series] == "undefined") {
			// if shoppingCart series doesn't exist, then add series
			request.session.cart[series] = customerquantities;
		} else {
			for (let i in customerquantities) {
				if (
					Number(customerquantities[i]) >= products[i]["quantity_available"]
				) {
					continue;
				} else {
					request.session.cart[series][i] =
						Number(request.session.cart[series][i]) +
						Number(customerquantities[i]);

					console.log(
						"request.session.cart" +
							series +
							[i] +
							"=" +
							request.session.cart[series][i]
					);
				}
			}
		}
		totalItems = 0; // initializes totalItems to 0
		for (series in request.session.cart) {
			totalItems =
				Number(totalItems) +
				request.session.cart[series].reduce((a, b) => Number(a) + Number(b)); // adds the quantities so this can be used to display # of items in cart
		}
		shoppingCart = request.session.cart; //sync Cart
		response.redirect("products_display?" + "series=" + series);
	}
});

app.post("/purchase", function (request, response) {
	// CODE PARTIALLY REUSED FROM ASSIGNMENT 1&2
	// process purchase request (validate quantities, check quantity available)
	let validinput = true; // assume that all terms are valid
	let allblank = false; // assume that it ISN'T all blank
	let instock = true; // if it is in stock
	let othererrors = false; //assume that there aren't other errors
	// process form by redirecting to the receipt page
	ordered = ""; // sets ordered back to empty
	customerquantities = request.body[`quantitytextbox`];
	series = request.body["series"];

	products = products[series];
	console.log("helloproducts=" + products[0]["name"]);

	// If we found an error, redirect back to the order page, if not, proceed to login

	console.log("QUANTITIES=" + customerquantities);
	for (let i in customerquantities) {
		// Iterate over all text boxes in the form.
		qtys = customerquantities[i];

		let model = products[i]["name"];
		if (qtys == 0) {
			// assigning no value to certain models to avoid errors in invoice

			ordered += model + "=" + qtys + "&";
		} else if (
			isNonNegativeInteger(qtys) &&
			Number(qtys) <= products[i].quantity_available
		) {
			// if qtys is true, added to ordered string
			ordered += model + "=" + qtys + "&"; // appears in invoice's URL
		} else if (qtys == -0) {
			// if qtys is -0 block order
			validinput = false;
			ordered += model + "=" + qtys + "&"; // appears in invoice's URL
		} else if (isNonNegativeInteger(qtys) != true) {
			// quantity is "Not a Number, Negative Value, or not an Integer"
			validinput = false;
			ordered += model + "=" + qtys + "&";
		} else if (Number(qtys) >= products[i].quantity_available) {
			// Existing stock is less than desired quantity
			instock = false;
			ordered += model + "=" + qtys + "&";
		} else {
			// textbox has gone missing? or some other error
			othererrors = true;
		}
	}

	if (customerquantities.join("") == 0) {
		// if the array customerquantities adds up to 0, that means there are no quantities typed in
		allblank = true;
	}

	shoppingCart = request.session.cart; // create shopping cart session

	if (typeof shoppingCart == "undefined") {
		// if shoppingCart session doesn't exist, then make a session object called shoppingCart
		request.session.cart = {};
		request.session.cart[series] = customerquantities;
		console.log("sessioncartinfo=" + request.session.cart);
	}

	if (typeof shoppingCart[series] == "undefined") {
		// if shoppingCart series doesn't exist, then add series
		request.session.cart[series] = "";
		for (let i in customerquantities) {
			// Iterate over all text boxes in the form.
			qtys = customerquantities[i];
			let model = products[i]["name"];
			request.session.cart[series][model];
		}

		if (qtys == 0) {
			// assigning no value to certain models to avoid errors in invoice

			ordered += model + "=" + qtys + "&";
		} else if (
			isNonNegativeInteger(qtys) &&
			Number(qtys) <= products[i].quantity_available
		) {
			// if qtys is true, added to ordered string
			ordered += model + "=" + qtys + "&"; // appears in invoice's URL
		} else if (qtys == -0) {
			// if qtys is -0 block order
			validinput = false;
			ordered += model + "=" + qtys + "&"; // appears in invoice's URL
		} else if (isNonNegativeInteger(qtys) != true) {
			// quantity is "Not a Number, Negative Value, or not an Integer"
			validinput = false;
			ordered += model + "=" + qtys + "&";
		} else if (Number(qtys) >= products[i].quantity_available) {
			// Existing stock is less than desired quantity
			instock = false;
			ordered += model + "=" + qtys + "&";
		} else {
			// textbox has gone missing? or some other error
			othererrors = true;
		}
	}

	if (allblank) {
		// if all boxes are blank, there is an error, pops up alert
		console.log(allblank);
		// ordered = "";
		response.redirect(
			"products_display?" +
				ordered +
				"error=Invalid%20Quantity:%20No%20Quantities%20Selected!%20Please%20type%20in%20values!"
		);
	} else if (!validinput) {
		// quantity is "Not a Number, Negative Value, or not an Integer", pops up alert
		// ordered = "";
		response.redirect(
			"products_display?" +
				ordered +
				"error=Invalid%20Quantity:%20Please%20Fix%20the%20Errors%20on%20the%20Order%20Page!"
		);
	} else if (!instock) {
		// Existing stock is less than desired quantity, pops up alert
		// ordered = "";
		response.redirect(
			"products_display?" +
				ordered +
				"error=Invalid%20Quantity:%20Requested%20Quantity%20Exceeds%20Stock"
		);
	} else if (othererrors) {
		// textbox has gone missing? or some other error, pops up alert
		// ordered = "";
		response.redirect(
			"products_display?" +
				ordered +
				"error=Invalid%20Quantity:%20Unknown%20Error%20has%20occured"
		);
	} else {
		// If everything is good, redirect to the invoice page.
		response.redirect("login?" + ordered);
	}
});

loginError = {}; // empty error object for login error messages

// LOGIN
app.get("/login", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	console.log(params.toString());
	ordered = "";
	if (typeof request.cookies["activeuser"] != "undefined") {
		response.redirect("./products_display");
	} else {
		response.write(`
	<!-- 
		Login Page for Assignment3
		Author: Deborah Yuan & Evon Diep
		Date: 12/14/22
		Desc: This page serves as a login page for a user visiting the site. It features login capabilities, with textboxes for entering a username and password if the user has an account on the site. If the user attempts to log in with an invalid username or incorrect password, they will not be allowed to proceed, with error messages showing up underneath the textboxes. In addition, there are 2 buttons below the textboxes: Loginand Register. Each button has a different functionality. If the user does not have an account with us and needs to register, they will be sent to the register page. 
		
		<head>
  <meta charset="utf-8">

  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Shopping Cart</title>

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

  <script src="../user_registration_info.json" type="application/json
  "></script> <!-- loading in user data from user_registration_info.json -->
  <script src="./functions.js"></script>
  <style>
    /* Remove the navbar's default rounded borders and increase the bottom margin */
    .navbar {
      margin-bottom: 50px;
      border-radius: 0;
    }

    /* Remove the jumbotron's default bottom margin */
    .jumbotron {
      margin-top: 0;
      margin-bottom: 0;
      position: relative;

    }

    /* Add a gray background color and some padding to the footer */
    footer {
      background-color: rgba(0, 0, 0, 0);
    }
  </style>
</head>
	<html>

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

	</script>

	<!-- navigation bar from w3 schools -->
	<nav class="navbar navbar-inverse">  
	  <div class="container-fluid">
		<div class="navbar-header">
		<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
		  <span class="icon-bar"></span>
		  <span class="icon-bar"></span>
		  <span class="icon-bar"></span>
		</button>
		<a class="navbar-brand active" href="./">
		   <!-- corner navbar Apple icon -->
		  <img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment1_images/Apple-Logo.png" width="20" alt=""></a>
		</div>
		<div class="collapse navbar-collapse" id="myNavbar">
		<ul class="nav navbar-nav">
		  <li><a href="./products_display">Home</a></li>
		</ul>
		<ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
		  <li id="iPhonetab"><a href="./products_display?series=iPhone">iPhone</a></li>
		</ul>
		<ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
		  <li id="iPadtab"><a href="./products_display?series=iPad">iPad</a></li>
		</ul>
		<ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
			  <li id="Mactab"><a href="./products_display?series=Mac">Mac</a></li>
		</ul>
		<ul class="nav navbar-nav navbar-right">
		<ul class="nav navbar-nav">
		<li class="active"><a href="./login">&emsp;<span class="glyphicon glyphicon-user"></span>&emsp;Login&emsp;</a></li>
		</ul>
		<ul class="nav navbar-nav">
		 <li><a href="./cart">&emsp;<span class="glyphicon glyphicon-shopping-cart"></span>&emsp;Cart (${totalItems})&emsp;</a></li>
		 
		  </ul>
		</ul> 
	  </div>
	  </nav>

	<body style="background-color: black;">
	<div class="container text-center" style="padding-top: 5px;">
	<img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment2_images/applergbgif.gif" alt="" style="max-width: 20%;" ></a>
	</div>
	<div class="container text-center" style="padding-bottom: 50px; padding-top: 0px;">
	<h1 style="font-size: 4em; color:white">Login</h1>
	<p style="font-size: 1.5em; color:white">Enter your Account Information Below to Log In</p>
	<!-- This login form's action involves splitting "username" off of the params, if it exists. Sticky forms were implemented, using "username" in the params to make it stick. This code just makes sure that this sticky does not move onto the next page -->
	<form name='login' action="?${
		params.toString().split("username")[0]
	}" method="POST">
	<BR>

	<span id="usernamelabel" name="usernamelabel" style="color: white;"><p style="font-family: 'Source Sans Pro', sans-serif;"><B>Enter a username</B></p></span>
	<input type="text" id ="username" class="username" name="username" placeholder="Username" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif" ></input><BR>
	<!-- error message if user doesn't exist -->
	<p style="color:#c4c4ff; font-family: 'Source Sans Pro', sans-serif;"><b>${
		typeof loginError["nonexistuser"] != "undefined"
			? loginError["nonexistuser"]
			: ""
	}</b></p><BR><BR>

	<span id="passwordlabel" name="passwordlabel" style="color: white;"><p style="font-family: 'Source Sans Pro', sans-serif;"><B>Enter a password</B></p></span>
	<input type="password" id ="password" class="userpasswordname" name="password" placeholder="Password" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif;"></input><BR>
	<!-- error message if the password is incorrect -->
	<p style="color:#c4c4ff; "><b>${
		typeof loginError["badloginpass"] != "undefined"
			? loginError["badloginpass"]
			: ""
	}</b></p><BR>
<BR>
<input type="submit" value='Login        ' id="button" style="min-width:20%;" class="button" style="font-family: 'Source Sans Pro', sans-serif;"></input>
</form><BR>

<form name='login' action='/register' method="GET">
<input type="submit" value='New User? Click Here     ' id="button2" style="min-width:20%;"  class="button" style="font-family: 'Source Sans Pro', sans-serif;"></input>
</form><BR>
<script>
if (params.has('username')) {
	var stickyUser = params.get('username');
	document.getElementById('username').value = stickyUser;
};	
</script>
</html>`);
		response.end();
	}
});

// RETURN TO PRODUCTS DISPLAY
app.post("/returntoproductsdisplay", function (request, response) {
	// if a customer on the login page no longer wishes to proceed with logging in, clicking on the button "Return to Products" will make use of this functionality
	let params = new URLSearchParams(request.query);
	console.log(params);
	response.redirect("/products_display?" + params.toString());
});

// POST FOR LOGIN
app.post("/login", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	// Process login form POST and redirect to logged in page if ok, back to login page if not
	let inputusername = request.body[`username`].toLowerCase();
	console.log(inputusername);
	let inputpassword = request.body[`password`];
	loginError = {}; // resets to no errors

	var encryptedPassword = encrypt(inputpassword); // variable to encrypt the inputted password

	if (typeof users[inputusername] != "undefined") {
		// if the passwords match
		if (
			users[inputusername].password == encryptedPassword ||
			(!users[inputusername].encrypted &&
				users[inputusername].password == inputpassword)
		) {
			// if the password typed in the login page matches with the one on file then...
			users[inputusername].amtlogin += Number(1); // increase the number of times someone has logged in by 1
			actusers[inputusername] = {}; // creates an emtpy array for a new active(online/logged in) user
			users[inputusername].loginstatus = true; // sets the user's account login status to true
			users[inputusername].lasttimelog = users[inputusername].currtimelog; // changes what was previously the current time logged in to the LAST time they logged in
			users[inputusername].currtimelog = getCurrentDate(); // get current date and set that to the current time in the user's account

			response.cookie("activeuser", inputusername, { maxAge: 1200000 }); // sets the cookie's active user as the username if credentials are correct
			active_user = request.cookies["activeuser"]; // active user cookie set to active_user variable

			let data = JSON.stringify(users); // rewrites user reg. file
			let actdata = JSON.stringify(actusers); // rewrites active user file
			fs.writeFileSync(fname, data, "utf-8"); // syncs user reg. file
			fs.writeFileSync(actname, actdata, "utf-8"); // syncs active user file
			if (typeof request.session.lastPageVisited != "undefined") {
				//IR 1: redirect to last page visited after logging in
				response.redirect(request.session.lastPageVisited);
			} else {
				response.redirect("/products_display"); // IR1: if products display hasn't been visited before, then redirect them to products_display
			}
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
	if (
		typeof request.session.invoice != "undefined" ||
		request.session.invoice == true
	) {
		request.session.destroy(); // ends session
	}
	//
	if (typeof request.cookies["activeuser"] == "undefined") {
		response.redirect("./");
	} else {
		active_user = request.cookies["activeuser"]; // active user cookie set to active_user variable

		// WELCOME MESSAGES
		if (Object.keys(actusers).length == 1) {
			// Keeping track of how many users are logged in (using values stored in the active_users.json object)
			// if there is 1 active user in the object (the number is 2 because there is an object permanently there that isn't a user's account), then adjust the sentence structure
			// grammar fixer
			str =
				"There is currently " +
				Number(Object.keys(actusers).length) +
				" person logged in.";
		} else {
			str =
				"There are currently " +
				Number(Object.keys(actusers).length) +
				" people logged in.";
		}

		if (users[active_user].amtlogin == 1) {
			// if the user has only logged in once, adjust the grammar
			// grammar fixer
			str2 =
				"You've logged in a total of " + users[active_user].amtlogin + " time.";
		} else {
			str2 =
				"You've logged in a total of " +
				users[active_user].amtlogin +
				" times.";
		}

		if (
			// if this is the user's first time logging in
			users[active_user].lasttimelog == 0 ||
			typeof users[active_user].lasttimelog == "undefined"
		) {
			str3 = "This is the first time you've logged in.";
		} else {
			str3 =
				"You were last logged in on " +
				users[active_user].lasttimelog +
				". <B>Welcome back!<B>";
		}

		let data = JSON.stringify(users); // rewrites user reg. file
		fs.writeFileSync(fname, data, "utf-8"); // syncs user reg. file

		response.write(
			`
		<!-- 
		Login/Registration Success for Assignment3
		Author: Deborah Yuan & Evon Diep
		Date: 12/18/22
		Desc: This page displays the user's full name, the number of people currently logged in at the moment, the number of times the user has logged in, and the last day and time they were logged in. This page will be displayed when a user clicked on their name in the navigation bar. From this page, users can edit their account by clicking the button, or they can check out by going to their cart. This is also where they will be able to logout of their account at any time. The buttons in the right corner are also functioning.
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
			<a class="navbar-brand active" href="./">
			   <!-- corner navbar Apple icon -->
			  <img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment1_images/Apple-Logo.png" width="20" alt=""></a>
			</div>
			<div class="collapse navbar-collapse" id="myNavbar">
			<ul class="nav navbar-nav">
			  <li><a href="./products_display">Home</a></li>
			</ul>
			<ul class="nav navbar-nav">
			  <!-- clicking this 'tab' leads to products display -->
			  <li id="iPhonetab"><a href="./products_display?series=iPhone">iPhone</a></li>
			</ul>
			<ul class="nav navbar-nav">
			  <!-- clicking this 'tab' leads to products display -->
			  <li id="iPadtab"><a href="./products_display?series=iPad">iPad</a></li>
			</ul>
			<ul class="nav navbar-nav">
			  <!-- clicking this 'tab' leads to products display -->
				  <li id="Mactab"><a href="./products_display?series=Mac">Mac</a></li>
			</ul>
			`
		);
		if (typeof active_user != "undefined" && users[active_user].admin == true) {
			response.write(`
	<ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
<li id="ManageProductstab"><a href="./manageproducts">Manage Products</a></li>
</ul>`);
		}
		if (typeof active_user != "undefined" && users[active_user].admin == true) {
			response.write(`
	<ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
<li id="ManageUserstab"><a href="./manageusers">Manage Users</a></li>
</ul>`);
		}
		response.write(`
			<ul class="nav navbar-nav navbar-right">
			<ul class="nav navbar-nav">
			`);

		if (typeof active_user != "undefined") {
			response.write(
				`<li><a href="./loginsuccess"><span class="glyphicon glyphicon-user"></span>&emsp;${users[active_user].fullname}&emsp;</a></li>`
			);
		} else {
			response.write(
				`<li><a href="./login">&emsp;<span class="glyphicon glyphicon-user"></span>&emsp;Login&emsp;</a></li>`
			);
		}
		response.write(`
			</ul>
			<ul class="nav navbar-nav">
			 <li><a href="./cart">&emsp;<span class="glyphicon glyphicon-shopping-cart"></span>&emsp;Cart (${totalItems})&emsp;</a></li>
			  </ul>
			</ul> 
		  </div>
		  </nav>

		  <div class="container text-center" style="padding-bottom: 50px;">
		  <h1 style="font-size: 6em;"> ${users[active_user].fullname},</h1>
		  <p style="font-size: 2em;">you have logged in successfully</p>
		</div>

		<div class="container text-center" style="padding-bottom: 50px;">
		<p style="font-size: 2em;">${str}<BR>${str2}<BR>${str3}</p>
	  </div>
	  <div class="container text-center" style="padding-bottom: 50px;">
	<form name='editaccount' action='./editaccount' method="GET">
	<input type="submit" value='Edit Account Information      ' id="button"; class="button" style="min-width: 20%"></input>
	</form>
	<form name='gotoinvoice' action='/cart' method="GET">
	<input type="submit" value='Go To Invoice      ' id="button2"; class="button" style="min-width: 20%"></input>
	</form>
	<form name='logoutbutton' action='/logout' method="GET">
	<input type="submit" value='Logout       ' id="button3"; class="button" style="min-width: 20%"></input>
	</form>
	</div>`);
	}
	response.end();
});

// ADMIN PAGES, MANAGE PRODUCTS
app.post("/manageproducts", function (request, response) {
	series = request.body[`series`];
	console.log("SERIES=" + series);
	for (i in products_data[series]) {
		products_data[series][i].name =
			request.body[`manageproducts_name_${series}+${i}`]; // saves new name available
		products_data[series][i].quantity_available = Number(
			request.body[`manageproducts_quantAvail_${series}+${i}`]
		); // saves new quantities available
		products_data[series][i].quantity_sold = Number(
			request.body[`manageproducts_quantSold_${series}+${i}`]
		); // saves new quantities sold
		products_data[series][i].price = Number(
			request.body[`manageproducts_price_${series}+${i}`]
		); // saves new quantities sold
	}
	products = products_data;
	let proddata = JSON.stringify(products);
	fs.writeFileSync(prodname, proddata, "utf-8");

	response.redirect("/manageproducts");
});

// ADMIN PAGES, MANAGE PRODUCTS
app.post("/manageusers", function (request, response) {
	regEx = {};
	for (username in users) {
		new_full_name =
			request.body[`manageusers_fullname_${users[username].username}`];
		new_user_name =
			request.body[`manageusers_username_${users[username].username}`];
		new_pass = request.body[`manageusers_password_${users[username].username}`];
		adminstatus = request.body[`manageusers_admin_${users[username].username}`];
		deleteuser = request.body[`manageusers_delete_${users[username].username}`];

		changetonew = false; // assume that we are not changing the username/email

		// if new full name box isn't empty
		users[username].fullname = new_full_name; // set new full name to current full name

		users[username].password = new_pass;

		users[username].encrypted = false;

		if (
			adminstatus == "true" ||
			adminstatus == "True" ||
			adminstatus == "TRUE"
		) {
			console.log("hiADMIN");
			users[username].admin = true;
		} else if (
			adminstatus == "false" ||
			adminstatus == "False" ||
			adminstatus == "FALSE"
		) {
			console.log("NOTADMIN");
			users[username].admin = false;
		} else {
			console.log("RIP");
			regErrors["notaboolean"] = `Admin Status can only be True or False.`;
		}

		if (deleteuser == "yes" || deleteuser == "Yes" || deleteuser == "YES") {
			delete users[username];
		}

		if (username != new_user_name) {
			users[new_user_name] = {}; // makes empty object for the user's new account
			users[new_user_name].password = users[username].password; // copies over current password
			users[new_user_name].username = new_user_name; // copies over current password
			users[new_user_name].loginstatus = users[username].loginstatus; // copies over current login status
			users[new_user_name].amtlogin = users[username].amtlogin; // copies over the amount of times logged in
			users[new_user_name].fullname = users[username].fullname; // copies over user's full name
			users[new_user_name].lasttimelog = users[username].lasttimelog; // copies over user's last time logging in
			users[new_user_name].currtimelog = users[username].currtimelog; // copies over user's last time logging in
			users[new_user_name].encrypted = users[username].encrypted; // copies over user's encrypted password status
			users[new_user_name].admin = users[username].admin; // copies over user's admin account status

			changetonew = true; // set to true means that new params will be made

			response.cookie("activeuser", new_user_name, { maxAge: 1200000 }); // renaming the cookie "activeuser" to the new username
			active_user = request.cookies["activeuser"]; // changing the variable active_user to the new username

			delete actusers[username];
			actusers[new_user_name] = {};
			delete users[username];
		}
	}

	adduser = request.body[`manageusers_add_new`];
	add_full_name = request.body[`manageusers_fullname_new`];
	add_user_name = request.body[`manageusers_username_new`];
	add_pass = request.body[`manageusers_password_new`];
	addadminstatus = request.body[`manageusers_admin_new`];

	if (adduser == "yes" || deleteuser == "Yes" || deleteuser == "YES") {
		users[add_user_name] = {}; // makes empty object for the user's new account
		add_pass_encrypt = encrypt(add_pass); // encrypts password
		users[add_user_name].password = add_pass_encrypt; // new password
		users[add_user_name].username = add_user_name; // new username
		users[add_user_name].loginstatus = false; // new login status
		users[add_user_name].amtlogin = 0; // 0 times logged in
		users[add_user_name].fullname = add_full_name; // copies over user's full name
		users[add_user_name].lasttimelog = ""; // last logged in N/A
		users[add_user_name].currtimelog = ""; // not currently logged in

		users[add_user_name].encrypted = true; // password just encrypted
		users[add_user_name].admin = false; // default no admin status
	}

	let data = JSON.stringify(users);
	let actdata = JSON.stringify(actusers);

	fs.writeFileSync(fname, data, "utf-8");
	fs.writeFileSync(actname, actdata, "utf-8");
	users = JSON.parse(data);
	user_data = users;

	response.redirect("/manageusers");
});

// GO TO CART
app.get("/cart", function (request, response) {
	// if the session exists for invoice
	if (
		typeof request.session.invoice != "undefined" ||
		request.session.invoice == true
	) {
		request.session.destroy(); // end the session
	}
	if (typeof request.session.cart == "undefined") {
		// if the session doesn't exist for cart
		console.log(`Your cart is empty.`);
	} else {
		console.log(
			`iPhone = ${request.session.cart["iPhone"]} <BR> iPad = ${request.session.cart["iPad"]} <BR> Mac = ${request.session.cart["Mac"]}`
		); // logs a message to the console that includes the quantity of each item in the cart
	}
	if (
		typeof request.cookies["activeuser"] != "undefined" &&
		request.cookies["activeuser"] != "" // if the "activeuser" cookie is defined and not an empty string
	) {
		active_user = request.cookies["activeuser"]; // sets variable to the value of the "activeuser" cookie
	}
	if (
		typeof active_user != "undefined" &&
		request.cookies["activeuser"] != "" // if there is an active user and the cookie for it isn't empty/does exist
	) {
		usernameCart = users[active_user].fullname + "'s"; // displays their full name on the page
	} else {
		usernameCart = "Your"; // if the active user or cookie doesn't exist (user is not logged in), it displays "Your Cart" instead
	}

	response.write(`
	<!DOCTYPE html>
	<html lang="en">
	<!-- 
	Cart for Assignment3
	Author: Deborah Yuan
	Date: 12/18/22
	Desc: This page, generated on server produces an cart for the customer after the quantities of products that the customer is requesting has already been validated. The validation for the user inputted quantities is done on the server, with cart pulling the quantities from search params. This cart includes an image of the product purchased, the product name, quantity, price, extended price, subtotal, shipping, tax, and total. The bottom of the invoice features a back button, which gives users the opportunity to go back to the purchasing page to buy more products if they want. Before proceeding onto checking out, the user must be logged in. There is also a recalculate cart function built in!
	-->
	
	<!-- this produces an invoice AFTER valid quantities have been typed and the customer is ready to check out-->
	
	<head>
  <meta charset="utf-8">

  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Shopping Cart</title>

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

  <script src="../user_registration_info.json" type="application/json
  "></script> <!-- loading in user data from user_registration_info.json -->
  <script src="./functions.js"></script>
  <style>
    /* Remove the navbar's default rounded borders and increase the bottom margin */
    .navbar {
      margin-bottom: 50px;
      border-radius: 0;
    }

    /* Remove the jumbotron's default bottom margin */
    .jumbotron {
      margin-top: 0;
      margin-bottom: 0;
      position: relative;

    }

    /* Add a gray background color and some padding to the footer */
    footer {
      background-color: rgba(0, 0, 0, 0);
    }
  </style>
</head>
	<body>
	  <main>
	
	  <!-- navigation bar from w3 schools -->
	  <nav class="navbar navbar-inverse">  
		<div class="container-fluid">
		  <div class="navbar-header">
		  <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
		  </button>
		  <a class="navbar-brand active" href="./">
			 <!-- corner navbar Apple icon -->
			<img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment1_images/Apple-Logo.png" width="20" alt=""></a>
		  </div>
		  <div class="collapse navbar-collapse" id="myNavbar">
		  <ul class="nav navbar-nav">
			<li><a href="./products_display">Home</a></li>
		  </ul>
		  <ul class="nav navbar-nav">
			<!-- clicking this 'tab' leads to products display -->
			<li id="iPhonetab"><a href="./products_display?series=iPhone">iPhone</a></li>
		  </ul>
		  <ul class="nav navbar-nav">
			<!-- clicking this 'tab' leads to products display -->
			<li id="iPadtab"><a href="./products_display?series=iPad">iPad</a></li>
		  </ul>
		  <ul class="nav navbar-nav">
			<!-- clicking this 'tab' leads to products display -->
				<li id="Mactab"><a href="./products_display?series=Mac">Mac</a></li>
		  </ul>
		  `);
	if (typeof active_user != "undefined" && users[active_user].admin == true) {
		response.write(`
	  <ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
  <li id="ManageProductstab"><a href="./manageproducts">Manage Products</a></li>
  </ul>`);
	}
	if (typeof active_user != "undefined" && users[active_user].admin == true) {
		response.write(`
	  <ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
  <li id="ManageUserstab"><a href="./manageusers">Manage Users</a></li>
  </ul>`);
	}
	response.write(`
		  <ul class="nav navbar-nav navbar-right">
		  <ul class="nav navbar-nav">`);

	if (typeof active_user != "undefined") {
		response.write(
			`<li><a href="./loginsuccess">&emsp;<span class="glyphicon glyphicon-user"></span>&emsp;${users[active_user].fullname}&emsp;</a></li>`
		);
	} else {
		response.write(
			`<li><a href="./login">&emsp;<span class="glyphicon glyphicon-user"></span>&emsp;Login&emsp;</a></li>`
		);
	}
	response.write(`
		  </ul>
		  <ul class="nav navbar-nav">
		   <li class="active"><a href="./cart">&emsp;<span class="glyphicon glyphicon-shopping-cart"></span>&emsp;Cart (${totalItems})&emsp;</a></li>
			</ul>
		  </ul> 
		</div>
		</nav>
	
		<div class="top-btn"> <!-- code and css partially borrowed from https://codepen.io/rafi_kadir/pen/oNgOyZb --> 
		<i class="fas fa-arrow-up">↑</i>
  </div>
  <script>
// ARROW TO SCROLL TO TOP FUNCTIONALITY

document.addEventListener("scroll", handleScroll); // code modified from (https://dev.to/ljcdev/scroll-to-top-button-in-vanilla-js-beginners-2nc)
// get a reference to our predefined button
var scrollToTopBtn = document.querySelector(".top-btn");

function handleScroll() {
  var scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var GOLDEN_RATIO = 0.5;

  if ((document.documentElement.scrollTop / scrollableHeight ) > GOLDEN_RATIO) {
    //show button
    if(!scrollToTopBtn.classList.contains("showScrollBtn"))
    scrollToTopBtn.classList.add("showScrollBtn")
  } else {
    //hide button
    if(scrollToTopBtn.classList.contains("showScrollBtn"))
    scrollToTopBtn.classList.remove("showScrollBtn")
  }
}

scrollToTopBtn.addEventListener("click", scrollToTop);

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

  </script>
	

	<h1 class="invoiceheader" style="text-align: center;">${usernameCart} Cart</h1>
	<BR>
	  <table class="invoice-table"> <!-- base css acquired from yt tutorial (https://www.youtube.com/watch?v=biI9OFH6Nmg&ab_channel=dcode)-->
		<tbody>
		  <thead>`);

	var cartTotalItems = 0;

	for (series in request.session.cart) {
		cartTotalItems += request.session.cart[series].reduce((a, b) => a + b); // adds the quantities so this can be used to display # of items in cart
	}

	// if there is no cart session or if there are no items in the cart
	if (typeof request.session.cart == "undefined" || cartTotalItems == 0) {
		response.write(
			`<tr><th style= "text-align: center;"><h1>Your cart is empty.</h1></th></tr>
			</thead>
			<tr><td style= "text-align: center;"><h2 class="underlinecss"><a href="/products_display" style = "color: black; text-decoration: none;">Return to shopping</a></h2></td></tr>`
		);
	} else {
		// if there are items in the cart
		response.write(`
		<form name='cart_form' action="/recalculatecart" method="POST">
		  <tr>
			<th align="center">Image</th>
			<th>Item</th>
			<th>Quantity</th>
			<th>Cost of Item</th>
			<th>Extended Price</th>
		  </tr>
		</thead>
`);
		// Compute subtotal
		var subtotal = 0;

		response.write(`
<script>
</script>`);

		// if a user has any iPhones in their cart, then calculate the prices
		if (typeof request.session.cart["iPhone"] != "undefined") {
			quantities = request.session.cart["iPhone"];
			products = products_data["iPhone"];
			for (let i in quantities) {
				if (quantities[i] == 0) {
					// if quantities = 0, then skip the row
					continue;
				} else {
					var extended_price = quantities[i] * products[i].price;
					console.log(products[i].price);
					// toFixed added to $ values to preserve cents
					response.write(`
<tr>
<td align="center"><img src="${
						products[i].image
					}" class="img-responsive" style="width:50%; height:auto;" alt="Image"></td>
<td>${products[i].name}</td>
<td align="center"><input type="number" name='cartquantitytextbox_iPhone+${i}' id ='cartquantitytextbox_iPhone+${i}' min="0" max="${Number(
						products[i].quantity_available
					)}" step="1" onkeydown="quantityError(this)" onkeyup="quantityError(this)" onmouseup="quantityError(this)"></input><BR><p id="cartquantitytextbox_iPhone+${i}_msg"></p></td>
<td align="center" class="cartquantityPrice[${i}]_iPhone"">$${products[
						i
					].price.toFixed(2)}</td>
<td class="cartquantityExtendedPrice[${i}]_iPhone">$${(
						quantities[i] * products[i].price
					).toFixed(2)}</td>
</tr>

<script>

setInputFilter(document.getElementById('cartquantitytextbox_iPhone+${i}'), 
function (value) {
if (/^(\s*|\d+)$/
.test(value) == false) {
// must be a number
return /^(\s*|\d+)$/.test(value);
} else if (/^-?\d*$/.test(value) == false) {
// must be an integer
return /^-?\d*$/.test(value);
} else if (/^\d*$/.test(value) == false) {
// must be a non negative integer
return /^\d*$/.test(value);
} else if (value > ${
						Number(products[i].quantity_available) + Number(quantities[i])
					}){ // requesting for more than current stock
	return false;
} else {
return true;
}
}, 
${Number(products[i].quantity_available) + Number(quantities[i])})
</script>`);
					subtotal += extended_price;
					console.log(products[i].price);
				}
			}
		}
		// if a user has any iPads in their cart, then calculate the prices
		if (typeof request.session.cart["iPad"] != "undefined") {
			quantities = request.session.cart["iPad"];
			products = products_data["iPad"];
			for (let i in quantities) {
				if (quantities[i] == 0) {
					// if quantities = 0, then skip the row
					continue;
				} else {
					var extended_price = quantities[i] * products[i].price;
					console.log(products[i].price);
					// toFixed added to $ values to preserve cents
					response.write(`
	<tr>
	  <td align="center"><img src="${
			products[i].image
		}" class="img-responsive" style="width:50%; height:auto;" alt="Image"></td>
	  <td>${products[i].name}</td>
	  <td align="center"><input type="number" name="cartquantitytextbox_iPad+${i}" id ="cartquantitytextbox_iPad+${i}" min="0" max="${Number(
						products[i].quantity_available
					)}" step="0.01" onkeydown="quantityError(this)" onkeyup="quantityError(this)" onmouseup="quantityError(this)"></input><BR><p id="cartquantitytextbox_iPad+${i}_msg"></p></td>
	  <td align="center">$${products[i].price.toFixed(2)}</td>
	  <td>$${(quantities[i] * products[i].price).toFixed(2)}</td>
	</tr>
	<script>
	setInputFilter(document.getElementById("cartquantitytextbox_iPad+${i}"), 
		function (value) {
		if (/^(\s*|\d+)$/
		.test(value) == false) {
		// must be a number
		return /^(\s*|\d+)$/.test(value);
		} else if (/^-?\d*$/.test(value) == false) {
		// must be an integer
		return /^-?\d*$/.test(value);
		} else if (/^\d*$/.test(value) == false) {
		// must be a non negative integer
		return /^\d*$/.test(value);
		} else if (value > ${
			Number(products[i].quantity_available) + Number(quantities[i])
		}){ // requesting for more than current stock
			return false;
		} else {
		return true;
		}
		}, 
		${Number(products[i].quantity_available) + Number(quantities[i])})
	</script>`);
					subtotal += extended_price;
					console.log(products[i].price);
				}
			}
		}

		// if a user has any Macs in their cart, then calculate the prices
		if (typeof request.session.cart["Mac"] != "undefined") {
			quantities = request.session.cart["Mac"];
			products = products_data["Mac"];
			for (let i in quantities) {
				if (quantities[i] == 0) {
					// if quantities = 0, then skip the row
					continue;
				} else {
					var extended_price = quantities[i] * products[i].price;
					console.log(products[i].price);
					// toFixed added to $ values to preserve cents
					response.write(`
	<tr>
	  <td align="center"><img src="${
			products[i].image
		}" class="img-responsive" style="width:50%; height:auto;" alt="Image"></td>
	  <td>${products[i].name}</td>
	  <td align="center"><input type="number" name="cartquantitytextbox_Mac+${i}" id ="cartquantitytextbox_Mac+${i}" min="0" max="${Number(
						products[i].quantity_available
					)}" step="1" onkeydown="quantityError(this)" onkeyup="quantityError(this)" onmouseup="quantityError(this)"></input><BR><p id="cartquantitytextbox_Mac+${i}_msg"></p></td>
	  <td align="center">$${products[i].price.toFixed(2)}</td>
	  <td>$${(quantities[i] * products[i].price).toFixed(2)}</td>
	</tr>
	<script>
	setInputFilter(document.getElementById("cartquantitytextbox_Mac+${i}"), 
		function (value) {
		if (/^(\s*|\d+)$/
		.test(value) == false) {
		// must be a number
		return /^(\s*|\d+)$/.test(value);
		} else if (/^-?\d*$/.test(value) == false) {
		// must be an integer
		return /^-?\d*$/.test(value);
		} else if (/^\d*$/.test(value) == false) {
		// must be a non negative integer
		return /^\d*$/.test(value);
		} else if (value > ${
			Number(products[i].quantity_available) + Number(quantities[i])
		}){ // requesting for more than current stock
			return false;
		} else {
		return true;
		}
		}, 
		${Number(products[i].quantity_available) + Number(quantities[i])})
	</script>`);
					subtotal += extended_price;
					console.log(products[i].price);
				}
			}
		}

		// Compute shipping
		var shipping;
		if (subtotal < 1000) {
			shipping = 5;
		} else if (subtotal >= 1000 && subtotal < 1500) {
			shipping = 10;
		} else if (subtotal >= 1500) {
			shipping = subtotal * 0.02;
		}

		// Compute tax
		var tax_rate = 0.0475;
		var tax = tax_rate * subtotal;

		// Compute grand total
		var total = tax + subtotal + shipping;

		response.write(`
		  <!-- table formatting, with some inline css -->
		  <tr>
			<td colspan="5" width="100%">&nbsp;</td>
		  </tr>
		  <tr>
			<td style="text-align: right;" colspan="4" width="67%">Sub-total</td>
			<td width="54%">$
			  ${subtotal.toFixed(2)}
			</td>
		  </tr>
		  <tr>
			<td style="text-align: right;" colspan="4" width="67%">Tax @ 4.75%</span></td>
			<td width="54%">$
			${tax.toFixed(2)}
			</td>
		  </tr>
		  <tr>
			<td style="text-align: right;" colspan="4" width="67%">Shipping</td>
			<td width="54%">$
			${shipping.toFixed(2)}
			</td>
		  </tr>
		  <tr>
			<td style="text-align: right;" colspan="4" width="67%"><strong>Total</strong></td>
			<td width="54%"><strong>$
			${total.toFixed(2)}
			  </strong></td>
		  </tr>
		  <tr>
			<td style="text-align: center;" colspan="5" width="100%">
			  <b> <!-- shipping policy info -->
				Shipping Policy:
				<BR>
				Orders with subtotals of $0 - $999.99 will be charged $5 for shipping.
				<BR>
				Orders with subtotals of $1000 - $1499.99 will be charged $10 for shipping.
				<BR>Orders with subtotals of $1500 and over will be charged 2% of the subtotal amount.</b>
			</td>
		  </tr>
		  <tr>
			<td style="text-align: center;" colspan="5" width="100%">
			<input type="submit" id="button" value='Recalculate Cost' class="button"></input>
		  </form>
		   </td>
		  </tr>
		  <tr>
			<td style="text-align: center;" colspan="5" width="100%">
			<form name='confirm_purchase' action="/toinvoice" method="POST">
			<input type="submit" id="button" value='Confirm Purchase' class="button"></input>
		  </form>
		   </td>
		  </tr>
		</tbody>
	  </table>
	</main>
	</body>
	`);

		if (typeof request.session.cart["iPhone"] != "undefined") {
			quantities = request.session.cart["iPhone"];
			products = products_data["iPhone"];
			response.write(`<script>`);
			for (let i in quantities) {
				if (quantities[i] == 0 || quantities[i] == "") {
					// check if the quantities are 0 or empty string
					// adding textbox error messages based on inputted value
					continue;
				} else {
					response.write(`
	cart_form['cartquantitytextbox_iPhone+${i}'].value = ${quantities[i]}
	`); // sets value of the textbox to quantities
				}
			}
			response.write(`</script>`);
		}

		if (typeof request.session.cart["iPad"] != "undefined") {
			quantities = request.session.cart["iPad"];
			products = products_data["iPad"];
			response.write(`<script>`);
			for (let i in quantities) {
				if (quantities[i] == 0 || quantities[i] == "") {
					// check if the quantities are 0 or empty string
					// adding textbox error messages based on inputted value
					continue;
				} else {
					response.write(`
		cart_form["cartquantitytextbox_iPad+${i}"].value = ${quantities[i]}
		`); // sets value of the textbox to quantities
				}
			}
			response.write(`</script>`);
		}

		if (typeof request.session.cart["Mac"] != "undefined") {
			quantities = request.session.cart["Mac"];
			products = products_data["Mac"];
			response.write(`<script>`);
			for (let i in quantities) {
				if (quantities[i] == 0 || quantities[i] == "") {
					// check if the quantities are 0 or empty string
					// adding textbox error messages based on inputted value
					continue;
				} else {
					response.write(`
		cart_form["cartquantitytextbox_Mac+${i}"].value = ${quantities[i]}
		`); // sets value of the textbox to quantities
				}
			}
			response.write(`</script>`);
		}

		response.write(`
	</html>`);
	}

	response.end();
});

app.post("/recalculatecart", function (request, response, next) {
	for (series in request.session.cart) {
		console.log("SERIES=" + series);
		console.log("CURR REQ CART=" + request.session.cart[series]);

		// Iterates over the properties of the request.session.cart, and for each series, it is updating the corresponding item in the cart by setting the value of the current property of request.session.cart[series]  to the value of  cartquantitytextbox_${series}+${i}
		for (i in request.session.cart[series]) {
			if (
				typeof request.body[`cartquantitytextbox_${series}+${i}`] == "undefined"
			) {
				continue;
			} else {
				request.session.cart[series][i] = Number(
					request.body[`cartquantitytextbox_${series}+${i}`]
				);
			}
			console.log("REQBOD=" + request.session.cart[series]);
		}
	}

	// for the cart counter
	totalItems = 0;
	for (series in request.session.cart) {
		totalItems =
			Number(totalItems) +
			request.session.cart[series].reduce((a, b) => Number(a) + Number(b)); // adds the quantities so this can be used to display # of items in cart
	}
	console.log(request.session);
	response.redirect("./cart");
});

app.post("/toinvoice", function (request, response, next) {
	// check if a cookie with the name "activeuser" exists; if it does, set a variable named active_user to the value of that cookie
	if (
		typeof request.cookies["activeuser"] == "undefined" ||
		request.cookies["activeuser"] == ""
	) {
		response.redirect("/login");
	} else {
		active_user = request.cookies["activeuser"];

		// Modified code from Assignment 3 Examples (Dan Port)
		var invoice_str = `Thank you ${users[active_user].fullname} for your order!

	<BR>
	
<table border>
<thead>
<tr>
  <th>Item</th>
  <th>Quantity</th>
  <th>Cost of Item</th>
  <th>Extended Price</th>
  </tr>
</thead>`;

		// Compute subtotal
		var subtotal = 0;

		// Compute shipping
		var shipping;

		// iterates over the products in the products_data and builds a string that represents an invoice, including the name, quantity, price, and extended price of each item in the shopping cart; also calculates the subtotal of the invoice by adding the extended price of each item in the cart
		var shopping_cart = request.session.cart;
		for (series in products_data) {
			for (i = 0; i < products_data[series].length; i++) {
				if (typeof shopping_cart[series] == "undefined") continue;
				qty = shopping_cart[series][i];
				if (qty > 0) {
					invoice_str += `
			<tr>
	  <td>${products_data[series][i].name}</td>
	  <td align="center">${qty}</td>
	  <td align="center">$${products_data[series][i].price.toFixed(2)}</td>
	  <td>$${qty * products_data[series][i].price.toFixed(2)}</td>
	</tr>
	`;
					subtotal += qty * products_data[series][i].price;
					console.log("ello " + typeof subtotal);
				}
			}
		}

		// compute rates
		if (subtotal < 1000) {
			shipping = 5;
		} else if (subtotal >= 1000 && subtotal < 1500) {
			shipping = 10;
		} else if (subtotal >= 1500) {
			shipping = subtotal * 0.02;
		}

		// Compute tax
		var tax_rate = 0.0475;
		var tax = tax_rate * subtotal;

		for (let i in quantities) {
			if (quantities[i] == 0) {
				// if quantities = 0, then skip the row
				continue;
			} else {
				let extended_price = quantities[i] * products[i].price;
			}
		}

		// Compute grand total
		var total = tax + subtotal + shipping;

		invoice_str += `

<tr>
<td colspan="5" width="100%">&nbsp;</td>
</tr>
<tr>
<td style="text-align: right;" colspan="4" width="67%">Sub-total</td>
<td width="54%">$
${subtotal.toFixed(2)}
</td>
</tr>
<tr>
<td style="text-align: right;" colspan="4" width="67%">Tax @ 4.75%</span></td>
<td width="54%">$
${tax.toFixed(2)}
</td>
</tr>
<tr>
<td style="text-align: right;" colspan="4" width="67%">Shipping</td>
<td width="54%">$
${shipping.toFixed(2)}
</td>
</tr>
<tr>
<td style="text-align: right;" colspan="4" width="67%"><strong>Total</strong></td>
<td width="54%"><strong>$
${total.toFixed(2)}
</strong></td>

<tr>
<td style="text-align: center;" colspan="5" width="100%">
<b> <!-- shipping policy info -->
Shipping Policy:
<BR>
Orders with subtotals of $0 - $999.99 will be charged $5 for shipping.
<BR>
Orders with subtotals of $1000 - $1499.99 will be charged $10 for shipping.
<BR>Orders with subtotals of $1500 and over will be charged 2% of the subtotal amount.</b>
</td>
</tr>
`;

		invoice_str += "</table>";
		// send invoice as email
		// Set up mail server
		// With modifications from https://www.youtube.com/watch?v=nF9g1825mwk and https://stackoverflow.com/questions/45478293/username-and-password-not-accepted-when-using-nodemailer
		var transporter = nodemailer.createTransport({
			host: "mail.hawaii.edu",
			port: 25,
			secure: false, // use TLS
			tls: {
				// do not fail on invalid certs
				rejectUnauthorized: false,
			},
		});

		// With reference to Assignment 3 Code Examples by Dan Port
		var user_email = request.cookies["activeuser"];
		var mailOptions = {
			from: "phoney_store@bogus.com", // change or leave this email to something related to our store?
			to: user_email,
			subject: "Thank you for your purchase!",
			html: invoice_str,
		};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				return console.log(error);
			}
			console.log("Message sent: %s", info.messageId);
			console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
		});

		totalItems = 0;

		response.write(`
<!DOCTYPE html>
<html lang="en">
<!-- 
Invoice for Assignment3
Author: Deborah Yuan and Evon Diep
Date: 12/18/22
Desc: This html page produces an invoice after the customer has confirmed their purchase. This invoice includes an image of the product purchased (IR5), the product name, quantity, price, extended price, subtotal, shipping, tax, and total. The bottom of the invoice features a Review Products button, which gives users the opportunity to rate the product. The second button on the page is a Return to Home button, which redirects the user back to the home or products_display page (IR1: after checkout, the last page visited becomes the home page)
-->

<!-- this produces an invoice AFTER valid quantities have been typed and the customer is ready to check out-->

<head>
<meta charset="utf-8">

<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Invoice</title>

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

<script src="../user_registration_info.json" type="application/json
"></script> <!-- loading in user data from user_registration_info.json -->
<script src="./functions.js"></script>
<style>
/* Remove the navbar's default rounded borders and increase the bottom margin */
.navbar {
  margin-bottom: 50px;
  border-radius: 0;
}

/* Remove the jumbotron's default bottom margin */
.jumbotron {
  margin-top: 0;
  margin-bottom: 0;
  position: relative;

}

/* Add a gray background color and some padding to the footer */
footer {
  background-color: rgba(0, 0, 0, 0);
}
</style>
</head>
<body>
  <main>

  <!-- navigation bar from w3 schools -->
  <nav class="navbar navbar-inverse">  
	<div class="container-fluid">
	  <div class="navbar-header">
	  <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
		<span class="icon-bar"></span>
		<span class="icon-bar"></span>
		<span class="icon-bar"></span>
	  </button>
	  <a class="navbar-brand active" href="./">
		 <!-- corner navbar Apple icon -->
		<img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment1_images/Apple-Logo.png" width="20" alt=""></a>
	  </div>
	  <div class="collapse navbar-collapse" id="myNavbar">
	  <ul class="nav navbar-nav">
		<li><a href="./products_display">Home</a></li>
	  </ul>
	  <ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
		<li id="iPhonetab"><a href="./products_display?series=iPhone">iPhone</a></li>
	  </ul>
	  <ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
		<li id="iPadtab"><a href="./products_display?series=iPad">iPad</a></li>
	  </ul>
	  <ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
			<li id="Mactab"><a href="./products_display?series=Mac">Mac</a></li>
	  </ul>
	  `);
		if (typeof active_user != "undefined" && users[active_user].admin == true) {
			response.write(`
	<ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
<li id="ManageProductstab"><a href="./manageproducts">Manage Products</a></li>
</ul>`);
		}
		if (typeof active_user != "undefined" && users[active_user].admin == true) {
			response.write(`
	<ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
<li id="ManageUserstab"><a href="./manageusers">Manage Users</a></li>
</ul>`);
		}
		response.write(`
	  <ul class="nav navbar-nav navbar-right">
	  <ul class="nav navbar-nav">
	<li><a href="./loginsuccess">&emsp;<span class="glyphicon glyphicon-user"></span>&emsp;${users[active_user].fullname}&emsp;</a></li>
	  </ul>
	  <ul class="nav navbar-nav">
	   <li class="active"><a href="./cart">&emsp;<span class="glyphicon glyphicon-shopping-cart"></span>&emsp;Cart (${totalItems})&emsp;</a></li>
		</ul>
	  </ul> 
	</div>
	</nav>

	<div class="top-btn"> <!-- code and css partially borrowed from https://codepen.io/rafi_kadir/pen/oNgOyZb --> 
	<i class="fas fa-arrow-up">↑</i>
</div>
<script>
// ARROW TO SCROLL TO TOP FUNCTIONALITY

document.addEventListener("scroll", handleScroll); // code modified from (https://dev.to/ljcdev/scroll-to-top-button-in-vanilla-js-beginners-2nc)
// get a reference to our predefined button
var scrollToTopBtn = document.querySelector(".top-btn");

function handleScroll() {
var scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
var GOLDEN_RATIO = 0.5;

if ((document.documentElement.scrollTop / scrollableHeight ) > GOLDEN_RATIO) {
//show button
if(!scrollToTopBtn.classList.contains("showScrollBtn"))
scrollToTopBtn.classList.add("showScrollBtn")
} else {
//hide button
if(scrollToTopBtn.classList.contains("showScrollBtn"))
scrollToTopBtn.classList.remove("showScrollBtn")
}
}

scrollToTopBtn.addEventListener("click", scrollToTop);

function scrollToTop() {
window.scrollTo({
top: 0,
behavior: "smooth"
});
}

</script>

<h1 class="invoiceheader" style="text-align: center">${users[active_user].fullname}'s Invoice</h1>
<h2 style="text-align: center">A copy of the Invoice has been sent to ${users[active_user].username}!</h2>
<BR>
  <table class="invoice-table"> <!-- base css acquired from yt tutorial (https://www.youtube.com/watch?v=biI9OFH6Nmg&ab_channel=dcode)-->
	<tbody>
	  <thead>
	  <tr>
		<th align="center">Image</th>
		<th>Item</th>
		<th>Quantity</th>
		<th>Cost of Item</th>
		<th>Extended Price</th>
	  </tr>
	</thead>
`);
		// Compute subtotal
		var subtotal = 0;

		// iterates over the items in the shopping cart stored in the request.session.cart, and for each item, it is calculating the extended price based on the quantity of the item and its price
		for (series in request.session.cart) {
			quantities = request.session.cart[series];
			// products = products_data[series];
			for (let i in quantities) {
				if (quantities[i] == "" || quantities[i] == 0) {
					// if quantities = 0, then skip the row
					continue;
				} else {
					var extended_price = quantities[i] * products_data[series][i].price;
					console.log(products_data[series][i].price);
					// toFixed added to $ values to preserve cents
					response.write(`
<tr>
<td align="center"><img src="${
						products_data[series][i].image
					}" class="img-responsive" style="width:50%; height:auto;" alt="Image"></td>
<td>${products_data[series][i].name}</td>
<td align="center">${request.session.cart[series][i]}</td>
<td align="center">$${products_data[series][i].price.toFixed(2)}</td>
<td>$${(quantities[i] * products_data[series][i].price).toFixed(2)}</td>
</tr>
`);
					subtotal += extended_price;

					products_data[series][i].quantity_available -= Number(quantities[i]); // Stock, or quantity_available is subtracted by the order quantity
					products_data[series][i].quantity_sold =
						Number(products_data[series][i].quantity_sold) +
						Number(quantities[i]); //Total amount sold, or quantity_sold increases by the order quantity
				}
			}
		}

		// Compute shipping
		var shipping;
		if (subtotal < 1000) {
			shipping = 5;
		} else if (subtotal >= 1000 && subtotal < 1500) {
			shipping = 10;
		} else if (subtotal >= 1500) {
			shipping = subtotal * 0.02;
		}

		// Compute tax
		var tax_rate = 0.0475;
		var tax = tax_rate * subtotal;

		// Compute grand total
		var total = tax + subtotal + shipping;

		response.write(`
	  <!-- table formatting, with some inline css -->
	  <tr>
		<td colspan="5" width="100%">&nbsp;</td>
	  </tr>
	  <tr>
		<td style="text-align: right;" colspan="4" width="67%">Sub-total</td>
		<td width="54%">$
		  ${subtotal.toFixed(2)}
		</td>
	  </tr>
	  <tr>
		<td style="text-align: right;" colspan="4" width="67%">Tax @ 4.75%</span></td>
		<td width="54%">$
		${tax.toFixed(2)}
		</td>
	  </tr>
	  <tr>
		<td style="text-align: right;" colspan="4" width="67%">Shipping</td>
		<td width="54%">$
		${shipping.toFixed(2)}
		</td>
	  </tr>
	  <tr>
		<td style="text-align: right;" colspan="4" width="67%"><strong>Total</strong></td>
		<td width="54%"><strong>$
		${total.toFixed(2)}
		  </strong></td>
	  </tr>
	  <tr>
		<td style="text-align: center;" colspan="5" width="100%">
		  <b> <!-- shipping policy info -->
			Shipping Policy:
			<BR>
			Orders with subtotals of $0 - $999.99 will be charged $5 for shipping.
			<BR>
			Orders with subtotals of $1000 - $1499.99 will be charged $10 for shipping.
			<BR>Orders with subtotals of $1500 and over will be charged 2% of the subtotal amount.</b>
		</td>
	  </tr>
	  <tr>
		<td style="text-align: center;" colspan="5" width="100%">
	  <form name='gotoreview' action='/toreview' method="GET">
	  <input type="submit" value='Review Products' id="button1"; class="button" style="min-width: 20%"></input>
	  </form>
	   </td>
	  </tr>
	  <tr>
		<td style="text-align: center;" colspan="5" width="100%">
		<form name='returntoproducts' action='/products_display' method="GET">
	<input type="submit" value='Return to Home' id="button2"; class="button" style="min-width: 20%"></input>
	</form>
	   </td>
	  </tr>
	</tbody>
  </table>
</main>
</body>
</script>
</html>`);
		products = products_data;
		let proddata = JSON.stringify(products);
		fs.writeFileSync(prodname, proddata, "utf-8");
		request.session.invoice = true;
		response.end();
	}
});

// IR5: REVIEWING PRODUCTS
app.get("/toreview", function (request, response) {
	if (typeof request.session.invoice == "undefined") {
		// if there is no invoice session then they won't be allowed to rate and therefore, redirects to products_display
		response.redirect("/products_display");
	} else {
		if (
			typeof request.cookies["activeuser"] != "undefined" &&
			request.cookies["activeuser"] != ""
		) {
			active_user = request.cookies["activeuser"];
		}

		response.write(`
	<!DOCTYPE html>
	<html lang="en">
	<!-- 
	Review Page for Assignment3
	Author: Deborah Yuan
	Date: 12/10/22
	Desc: This page displays a table of the products that were just purchased in a given order. The product image, item, and quantity are displayed. In the last column of the table, there is an option to leave a rating out of 5 stars. Once the user selects the number of stars for the rating and submits the form (using the Submit Review button on the page), it will redirect them back to the products_display page. When the user goes back to view the products_display for the product purchased, the new rating under the product will show an average of all the ratings given.
	-->
	
	<!-- this produces an invoice AFTER valid quantities have been typed and the customer is ready to check out-->
	
	<head>
	<meta charset="utf-8">
	
	<meta name="viewport" content="width=device-width, initial-scale=1">
	
	<title>Invoice</title>
	
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

	<script src="../user_registration_info.json" type="application/json
	"></script> <!-- loading in user data from user_registration_info.json -->
	<script src="./functions.js"></script>
	<style>
	/* Remove the navbar's default rounded borders and increase the bottom margin */
	.navbar {
	  margin-bottom: 50px;
	  border-radius: 0;
	}
	
	/* Remove the jumbotron's default bottom margin */
	.jumbotron {
	  margin-top: 0;
	  margin-bottom: 0;
	  position: relative;
	
	}
	
	/* Add a gray background color and some padding to the footer */
	footer {
	  background-color: rgba(0, 0, 0, 0);
	}
	</style>
	</head>
	<body>
	  <main>
	
	  <!-- navigation bar from w3 schools -->
	  <nav class="navbar navbar-inverse">  
		<div class="container-fluid">
		  <div class="navbar-header">
		  <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
			<span class="icon-bar"></span>
		  </button>
		  <a class="navbar-brand active" href="./">
			 <!-- corner navbar Apple icon -->
			<img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment1_images/Apple-Logo.png" width="20" alt=""></a>
		  </div>
		  <div class="collapse navbar-collapse" id="myNavbar">
		  <ul class="nav navbar-nav">
			<li><a href="./products_display">Home</a></li>
		  </ul>
		  <ul class="nav navbar-nav">
			<!-- clicking this 'tab' leads to products display -->
			<li id="iPhonetab"><a href="./products_display?series=iPhone">iPhone</a></li>
		  </ul>
		  <ul class="nav navbar-nav">
			<!-- clicking this 'tab' leads to products display -->
			<li id="iPadtab"><a href="./products_display?series=iPad">iPad</a></li>
		  </ul>
		  <ul class="nav navbar-nav">
			<!-- clicking this 'tab' leads to products display -->
				<li id="Mactab"><a href="./products_display?series=Mac">Mac</a></li>
		  </ul>`);
		if (typeof active_user != "undefined" && users[active_user].admin == true) {
			response.write(`
	<ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
<li id="ManageProductstab"><a href="./manageproducts">Manage Products</a></li>
</ul>`);
		}
		if (typeof active_user != "undefined" && users[active_user].admin == true) {
			response.write(`
	<ul class="nav navbar-nav">
		<!-- clicking this 'tab' leads to products display -->
<li id="ManageUserstab"><a href="./manageusers">Manage Users</a></li>
</ul>`);
		}
		response.write(`
		  <ul class="nav navbar-nav navbar-right">
		  <ul class="nav navbar-nav">
		<li><a href="./loginsuccess">&emsp;<span class="glyphicon glyphicon-user"></span>&emsp;${users[active_user].fullname}&emsp;</a></li>
		  </ul>
		  <ul class="nav navbar-nav">
		   <li class="active"><a href="./cart">&emsp;<span class="glyphicon glyphicon-shopping-cart"></span>&emsp;Cart (${totalItems})&emsp;</a></li>
			</ul>
		  </ul> 
		</div>
		</nav>
	
		<div class="top-btn"> <!-- code and css partially borrowed from https://codepen.io/rafi_kadir/pen/oNgOyZb --> 
		<i class="fas fa-arrow-up">↑</i>
	</div>
	<script>
	// ARROW TO SCROLL TO TOP FUNCTIONALITY
	
	document.addEventListener("scroll", handleScroll); // code modified from (https://dev.to/ljcdev/scroll-to-top-button-in-vanilla-js-beginners-2nc)
	// get a reference to our predefined button
	var scrollToTopBtn = document.querySelector(".top-btn");
	
	function handleScroll() {
	var scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	var GOLDEN_RATIO = 0.5;
	
	if ((document.documentElement.scrollTop / scrollableHeight ) > GOLDEN_RATIO) {
	//show button
	if(!scrollToTopBtn.classList.contains("showScrollBtn"))
	scrollToTopBtn.classList.add("showScrollBtn")
	} else {
	//hide button
	if(scrollToTopBtn.classList.contains("showScrollBtn"))
	scrollToTopBtn.classList.remove("showScrollBtn")
	}
	}
	
	scrollToTopBtn.addEventListener("click", scrollToTop);
	
	function scrollToTop() {
	window.scrollTo({
	top: 0,
	behavior: "smooth"
	});
	}
	
	</script>
	
	<h1 class="invoiceheader" style="text-align: center">${users[active_user].fullname}'s Product Review Page</h1>
	<h2 style="text-align: center">Leave a review for the products you just purchased!</h2>
	<BR>
	<form name='postreview' action='/toreview' method="POST">
	  <table class="invoice-table"> <!-- base css acquired from yt tutorial (https://www.youtube.com/watch?v=biI9OFH6Nmg&ab_channel=dcode)-->
		<tbody>
		  <thead>
		  <tr>
			<th align="center">Image</th>
			<th>Item</th>
			<th>Quantity</th>
			<th>Rating</th>
		  </tr>
		</thead>
	`);
		// Compute subtotal
		var subtotal = 0;

		// iterates over the items in the shopping cart stored in the request.session.cart, and for each item, it is calculating the extended price based on the quantity of the item and its price
		for (series in request.session.cart) {
			quantities = request.session.cart[series];
			products = products_data[series];
			for (let i in quantities) {
				if (quantities[i] == "" || quantities[i] == 0) {
					// if quantities = 0, then skip the row
					continue;
				} else {
					var extended_price = quantities[i] * products[i].price;
					console.log(products[i].price);
					// toFixed added to $ values to preserve cents
					response.write(`
	<tr>
	<td align="center"><img src="${products[i].image}" class="img-responsive" style="width:50%; height:auto;" alt="Image"></td>
	<td>${products[i].name}</td>
	<td align="center">${quantities[i]}</td>
	<td>
	<div class="rating">
  <input type="radio" name="rating_${series}+${i}" value="5" id="5_${series}+${i}"><label for="5_${series}+${i}">☆</label>
  <input type="radio" name="rating_${series}+${i}" value="4" id="4_${series}+${i}"><label for="4_${series}+${i}">☆</label>
  <input type="radio" name="rating_${series}+${i}" value="3" id="3_${series}+${i}"><label for="3_${series}+${i}">☆</label>
  <input type="radio" name="rating_${series}+${i}" value="2" id="2_${series}+${i}"><label for="2_${series}+${i}">☆</label>
  <input type="radio" name="rating_${series}+${i}" value="1" id="1_${series}+${i}"><label for="1_${series}+${i}">☆</label>
</div>
</td>
</tr>`);
				}
			}
		}
		response.write(`
		  <tr>
			<td style="text-align: center;" colspan="5" width="100%">
		  <input type="submit" value='Submit Review    ' id="button1"; class="button" style="min-width: 20%"></input>
		  </form>
		   </td>
		  </tr>
		  <tr>
		  </tr>
		</tbody>
	  </table>
	</main>
	</body>
	</script>
	</html>`);
		response.end();
	}
});

// IR5: PRODUCT RATINGS
app.post("/toreview", function (request, response) {
	for (series in request.session.cart) {
		console.log("SERIES=" + series);
		console.log("CURR REQ CART=" + request.session.cart[series]);

		// iterates over the items in the shopping cart stored in the request.session.cart, and for each item, it updates the rating and number of reviewers for the corresponding product in the products_data based on the value of the request.body[rating_${series}+${i}]
		for (i in request.session.cart[series]) {
			if (typeof request.body[`rating_${series}+${i}`] == "undefined") {
				continue;
			} else {
				products_data[series][i].rating += Number(
					request.body[`rating_${series}+${i}`]
				);
				products_data[series][i].reviewers++;
			}
			console.log("REQBOD=" + request.session.cart[series]);
		}
	}
	console.log(request.session);

	products_data[series][i].quantity_available -= Number(
		request.body[`rating_${series}+${i}`]
	); // Stock, or quantity_available is subtracted by the order quantity
	products_data[series][i].quantity_sold =
		Number(products_data[series][i].quantity_sold) +
		Number(request.body[`rating_${series}+${i}`]); // EC IR1: Total amount sold, or quantity_sold increases by the order quantity

	products = products_data;
	let proddata = JSON.stringify(products);
	fs.writeFileSync(prodname, proddata, "utf-8");

	request.session.destroy(); // ends session

	response.redirect("products_display");
});

// POST LOGIN SUCCESS
app.post("/loginsuccess", function (request, response) {
	// redirects to edit account page
	response.redirect("editaccount");
});

// Code modified from Assignment 2 Example Codes
// GET page to Edit Account
app.get("/editaccount", function (request, response) {
	let params = new URLSearchParams(request.query);
	if (
		// if the user isn't logged in
		typeof request.cookies["activeuser"] == "undefined" ||
		request.cookies["activeuser"] == ""
	) {
		console.log("You can't access this page unless you are logged in!");
		response.redirect("./products_display");
	} else {
		active_user = request.cookies["activeuser"];

		response.send(`
	<!-- 
		Edit Account for Assignment3
		Author: Deborah Yuan & Evon Diep
		Date: 11/18/22
		Desc: This page is where the user can choose to edit their full name, username (email), or password. All changes will be updated and saved. If there are any errors with the user's inputs, they will be blocked from submission. Edit Account textboxes are sticky for everything but the password. The user can choose to click a button to go back to the Login/Registration success page, or they can edit their account as many times as they wish.
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
		
			/* Remove the jumbotron's default bottom margin */
			.jumbotron {
			  margin-bottom: 0;
			}
		
			/* Add a gray background color and some padding to the footer */
			footer {
			  background-color: rgba(0, 0, 0, 0);
			}
		  </style>
		</head>
		<script>
			let params = (new URL(document.location)).searchParams;
		
			if (params.has('currentuser')) { // if params has current user, it'll change the value of the element that has the id 'currentfullname' to the current full name; same concept applies for below
				var currentfullname = params.get('currentfullname');
				document.getElementById('currentfullname').value = currentfullname;
		
				var newfullname = params.get('newfullname');
				document.getElementById('newfullname').value = newfullname;
		
				var currentusername = params.get('currentusername');
				document.getElementById('currentusername').value = currentusername;
		
				var newusername = params.get('newusername');
				document.getElementById('newusername').value = newusername;
			};
	</script>
	<!-- navigation bar from w3 schools -->
	<nav class="navbar navbar-inverse">  
	  <div class="container-fluid">
		<div class="navbar-header">
		<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
		  <span class="icon-bar"></span>
		  <span class="icon-bar"></span>
		  <span class="icon-bar"></span>
		</button>
		<a class="navbar-brand active" href="./">
		   <!-- corner navbar Apple icon -->
		  <img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment1_images/Apple-Logo.png" width="20" alt=""></a>
		</div>
		<div class="collapse navbar-collapse" id="myNavbar">
		<ul class="nav navbar-nav">
		  <li><a href="./products_display">Home</a></li>
		</ul>
		<ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
		  <li id="iPhonetab"><a href="./products_display?series=iPhone">iPhone</a></li>
		</ul>
		<ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
		  <li id="iPadtab"><a href="./products_display?series=iPad">iPad</a></li>
		</ul>
		<ul class="nav navbar-nav">
		  <!-- clicking this 'tab' leads to products display -->
			  <li id="Mactab"><a href="./products_display?series=Mac">Mac</a></li>
		</ul>
		<ul class="nav navbar-nav navbar-right">
		<ul class="nav navbar-nav">
		<li class="active"><a href="./loginsuccess"><span class="glyphicon glyphicon-user"></span>&emsp;${
			users[active_user].fullname
		}&emsp;</a></li>
		</ul>
		<ul class="nav navbar-nav">
		 <li><a href="./cart">&emsp;<span class="glyphicon glyphicon-shopping-cart"></span>&emsp;Cart (${totalItems})&emsp;</a></li>
		  </ul>
		</ul> 
	  </div>
	  </nav>
	</nav>

<body>

<div class="container text-center" style="padding-bottom: 50px;">

<form name='editaccount' action='?${params.toString()}' method="POST">

	<span id="accountpageinstruction" name="accountpageinstruction"><h1 style="font-size: 6em; margin: 0px;">Hi ${
		users[active_user].fullname
	},</h1></span><BR>
	<p style="font-size: 2em;">Edit your account information here:</p>
	<p style="font-size: 1.5em;">Only enter information into the following textboxes if you want to change these pieces of information. Otherwise, leave the box blank.<p>

	<span id="editfullnamelabel" name="editfullnamelabel"><p style="font-size: 1em;"><B>Enter your current full name in the first textbox,  <BR>then your new full name in the second textbox</B></p></span>

	<input type="text" id ="currentfullname" class="currentfullname" name="currentfullname" placeholder="Enter Current Full Name" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif"></input><BR><BR>
	<!-- displays errors for incorrect name or too short/long full name -->
	<p style="color:#A74ADC"><b>${
		typeof regErrors["wrong_name"] != "undefined" ? regErrors["wrong_name"] : ""
	}${
			typeof regErrors["bad_userlength"] != "undefined"
				? regErrors["bad_userlength"]
				: ""
		}${
			typeof regErrors["bad_user"] != "undefined" ? regErrors["bad_user"] : ""
		}</b></p>

	<input type="text" id ="newfullname" class="newfullname" name="newfullname" placeholder="Enter New Full Name" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif"></input><BR><BR>

			
	<span id="editusernamelabel" name="editusernamelabel"><p style="font-size: 1em;"><B>Enter your current email in the first textbox,  <BR>then your new email in the second textbox</B></p></span>

	<input type="text" id ="currentusername" class="currentusername" name="currentusername" placeholder="Enter Current Email"  style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif""></input><BR><BR>	
	<!-- displays errors for a taken email or incorrect email -->
	<p style="color:#A74ADC"><b>${
		typeof regErrors["taken_email"] != "undefined"
			? regErrors["taken_email"]
			: ""
	}${
			typeof regErrors["wrong_email"] != "undefined"
				? regErrors["wrong_email"]
				: ""
		}${
			typeof regErrors["bad_email"] != "undefined" ? regErrors["bad_email"] : ""
		}</b></p>

	<input type="text" id ="newusername" class="newusername" name="newusername" placeholder="Enter New Email" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif"></input><BR><BR>




	<span id="editpasswordlabel" name="editpasswordlabel"><p style="font-size: 1em;"><B>Enter your current password in the first textbox,  <BR>then your new password in the second textbox</B></p></span>

	<input type="password" id ="currentpassword" class="currentpassword" name="currentpassword" placeholder="Enter Current Password" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif"></input><BR><BR>	
	<!-- displays errors for wrong password name or too short/long password name -->
	<p style="color:#A74ADC"><b>${
		typeof regErrors["wrong_pass"] != "undefined" ? regErrors["wrong_pass"] : ""
	}${
			typeof regErrors["bad_passlength"] != "undefined"
				? regErrors["bad_passlength"]
				: ""
		}</b></p>

	<input type="password" id ="newpassword" class="newpassword" name="newpassword" placeholder="Enter New Password" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif"></input><BR><BR>



	<span id="passwordconfirmlabel" name="passwordconfirmlabel"><p style="font-size: 1em;"><B>Confirm your new password by typing it again</B></p></span>
	<input type="password" id ="newpasswordconfirm" class="newpasswordconfirm" name="newpasswordconfirm" placeholder="Enter New Password Again" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif"></input><BR><BR>
	<!-- displays errors for incorrect password confirmation, doesn't match other password change box OR empty box -->
	<p style="color:#A74ADC"><b>${
		typeof regErrors["bad_pass"] != "undefined" ? regErrors["bad_pass"] : ""
	}${
			typeof regErrors["nomatch_pass"] != "undefined"
				? regErrors["nomatch_pass"]
				: ""
		}${
			typeof regErrors["contains_space"] != "undefined"
				? regErrors["contains_space"]
				: ""
		}</b></p><BR>
			
<input type="submit" value='Submit Changes       ' id="button"; class="button" style="min-width:30%"></input></form><BR>

<form name='returntologinsuccess' action="/loginsuccess" method="POST">
<input type="submit" value='Return to Previous Page     ' id="button2"; class="button" style="min-width:30%;"></input></form>
			</div>


	</body>
	`);
	}
});

// Code inspired by Assignment 2 Code Examples
// POST FOR EDIT ACCOUNT
app.post("/editaccount", function (request, response) {
	// POST for editing the account information
	let params = new URLSearchParams(request.query); // grab params from url
	active_user = request.cookies["activeuser"];

	regErrors = {}; // reset errors array

	console.log("EDITACCPARAM" + params);

	POST = request.body; // sets POST equal to request body
	curr_full_name = POST["currentfullname"]; // sets individual textbox inputs to their respective variable names; CURR = current
	new_full_name = POST["newfullname"];
	curr_user_name = POST["currentusername"]; // USERNAME IS THE EMAIL
	new_user_name = POST["newusername"];
	curr_pass = POST["currentpassword"];
	new_pass = POST["newpassword"];
	new_pass_2 = POST["newpasswordconfirm"];
	changetonew = false; // assume that we are not changing the username/email

	// if the current username/email exists
	if (new_full_name == "") {
		console.log("New Full Name is blank"); // status
	} else if (users[active_user].fullname != curr_full_name) {
		console.log("Current Full Name is incorrect"); // status
		console.log(
			"new: " + users[active_user].fullname + "current " + curr_full_name
		);
		regErrors["wrong_name"] = `Current Full Name is incorrect!`; // pushes out this error in regErrors array if true
	} else if (new_full_name.length < 2 || new_full_name.length > 30) {
		regErrors["bad_userlength"] = `Name must be between 2 and 30 characters.`; // checks to see if full name entered is between 2 and 30 characters
	} else if (/^[a-zA-Z\s]*$/.test(new_full_name) != true) {
		regErrors["bad_user"] = `Name must only contain letters.`; // pushes out this error in regErrors array if true
	} else {
		// if new full name box isn't empty
		users[active_user].fullname = new_full_name; // set new full name to current full name
	}
	var encryptedPassword = encrypt(curr_pass);
	// if the new password isn't blank and matches
	if (new_pass == "") {
		console.log("New Password is blank"); // status
		// if password isn't blank
	} else if (
		!(
			users[active_user].password == encryptedPassword ||
			(!users[active_user].encrypted &&
				users[active_user].password == curr_pass)
		)
	) {
		console.log("Current Password is incorrect"); // status
		regErrors["wrong_pass"] = `Current Password is incorrect!`; // pushes out this error in regErrors array if true
	} else if (new_pass != new_pass_2) {
		console.log("New Password Doesn't match"); // status
		regErrors["nomatch_pass"] = `New password does not match!`; // pushes out this error in regErrors array if true
	} else if (
		/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]/.test(new_pass) == false
	) {
		regErrors[
			"bad_pass"
		] = `Password must contain at least one special character and one number.`;
	} else if (new_pass.length < 10 || new_pass.length > 16) {
		regErrors[
			"bad_passlength"
		] = `Password must be between 10 and 16 characters.`; // pushes out this error in regErrors array if true
	} else if (/^\S*$/.test(new_pass) == false) {
		regErrors["contains_space"] = `Passwords should not contain spaces.`;
	} else {
		users[active_user].password = encrypt(new_pass); // set current password to new password; ENCRYPT NEW PASS HERE
		if (!users[active_user].encrypted) {
			users[active_user].encrypted = true;
		}
	}

	if (new_user_name == "") {
		//pulls email/username value from params if the customer doesn't plan on changing their email/username
		// if new username box is empty
		console.log("New Email is blank");
	} else {
		// if the new email/username box has a value in it, meaning the customer wants to change their username/email
		if (active_user != curr_user_name) {
			console.log("Username error: Current Email is incorrect");
			regErrors["wrong_email"] = `Username error: Current Email is incorrect`;
		}
		if (typeof users[new_user_name] != "undefined") {
			// if other accounts are using the desired email
			console.log("Username error: the Email is already taken!"); // status if email is in use
			regErrors["taken_email"] = `Username error: the Email is already taken!`;
		}

		if (
			/^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+(?:\.[a-zA-Z0-9-]+)*$/.test(
				// makes sure there are no special characters in the email and NEEDS @
				request.body.newusername
			) == false
		) {
			{
				regErrors["bad_email"] = `Please enter a valid email.`;
			}
		}

		if (Object.keys(regErrors).length == 0) {
			users[new_user_name] = {}; // makes empty object for the user's new account
			users[new_user_name].password = users[active_user].password; // copies over current password
			users[new_user_name].new_user_name = new_user_name; // copies over current password
			users[new_user_name].loginstatus = users[active_user].loginstatus; // copies over current login status
			users[new_user_name].amtlogin = users[active_user].amtlogin; // copies over the amount of times logged in
			users[new_user_name].fullname = users[active_user].fullname; // copies over user's full name
			users[new_user_name].lasttimelog = users[active_user].lasttimelog; // copies over user's last time logging in
			users[new_user_name].currtimelog = users[active_user].currtimelog; // copies over user's last time logging in
			users[new_user_name].encrypted = users[active_user].encrypted; // copies over user's encrypted password status
			users[new_user_name].admin = users[active_user].admin; // copies over user's admin account status

			changetonew = true; // set to true means that new params will be made

			delete actusers[active_user];
			actusers[new_user_name] = {};
			delete users[active_user];

			response.cookie("activeuser", new_user_name, { maxAge: 1200000 }); // renaming the cookie "activeuser" to the new username
			active_user = request.cookies["activeuser"]; // changing the variable active_user to the new username
		}
	}

	if (Object.keys(regErrors).length == 0) {
		// if there are no errors then save the file
		let data = JSON.stringify(users);
		let actdata = JSON.stringify(actusers);

		fs.writeFileSync(fname, data, "utf-8");
		fs.writeFileSync(actname, actdata, "utf-8");

		response.redirect("loginsuccess");
	} else {
		response.redirect(
			// otherwise use sticky forms and have the user correct the error
			"./editaccount?" +
				params.toString() +
				"&currentfullname=" +
				curr_full_name +
				"&newfullname=" +
				new_full_name +
				"&currentusername=" +
				curr_user_name +
				"&newusername=" +
				new_user_name
		); // puts the textbox input into search params to make forms sticky
	}
});

// Code inspired by Assignment 2 Code Examples
app.get("/register", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);
	console.log(params.toString());

	response.send(
		`
		<!-- 
		Registration Page for Assignment3
		Author: Deborah Yuan & Evon Diep
		Date: 12/18/22
		Desc: This register page serves as a page for new site users to create an account to purchase items. If the username they try to use is already taken, errors will appear. Same goes for if their Full Name is not valid, or if their password doesn't meet the security requirements. Of course, password inputs are protected and hidden. Passwords registered will also be encrypted.
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
		</head>
	<html>
		<script>
			let params = (new URL(document.location)).searchParams;
	

			</script>
	
		
			<body style="background-color: black;">
			<div class="container text-center" style="padding-top: 30px;">
			<img src="https://raw.githubusercontent.com/deborahyuan/Assignment1imgs/main/Assignment2_images/applergbgif.gif" alt="" style="max-width: 20%;" ></a>
			</div>
			<div class="container text-center" style="padding-bottom: 50px; padding-top: 0px;">
			<h1 style="font-size: 4em; color:white">Register</h1>
			<p style="font-size: 1.5em; color:white">Enter your Account Information Below to Register</p>

		
			<form method ="POST" action ="?${params.toString().split("fullname")[0]}">
			<!-- if the boxes are empty, then return error -->
			<p style="color:#c4c4ff; font-family: 'Source Sans Pro', sans-serif;">
			<b>${
				typeof regErrors["empty_boxes"] != "undefined"
					? regErrors["empty_boxes"]
					: ""
			}</b></p>
			
			<span id="fullnamelabel" name="fullnamelabel" style="color: white; font-family: 'Source Sans Pro', sans-serif;"><B>Enter your full name</B></span><BR>
			<input type="text" id ="fullname" class="fullname" name="fullname" placeholder="First Name Last Name" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif;"></input><BR>
			<!-- if full name length is incorrect or if it is empty -->
			<p style="color:#c4c4ff; font-family: 'Source Sans Pro', sans-serif;">
			<b>${
				typeof regErrors["bad_userlength"] != "undefined"
					? regErrors["bad_userlength"]
					: ""
			}<BR>
			${
				typeof regErrors["bad_user"] != "undefined" ? regErrors["bad_user"] : ""
			}</b></p><BR>
		
			<span id="usernamelabel" name="usernamelabel" style="color: white; font-family: 'Source Sans Pro', sans-serif;"><B>Enter an email</B></span><BR>
			<input type="text" id ="username" class="username" name="username" placeholder="example@example.com" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif;"></input><BR>
			<!-- if the email is taken or email doesn't have @ -->
			<p style="color:#c4c4ff; font-family: 'Source Sans Pro', sans-serif;"><b>${
				typeof regErrors["bad_email"] != "undefined"
					? regErrors["bad_email"]
					: ""
			}<BR>
			${
				typeof regErrors["username_taken"] != "undefined"
					? regErrors["username_taken"]
					: ""
			}</b></p><BR>
		
			<span id="passwordlabel" name="passwordlabel" style="color: white; font-family: 'Source Sans Pro', sans-serif;"><B>Enter a password</B></span><BR>
			<input type="password" id ="password" class="password" name="password" placeholder="Password" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif;"></input><BR>
			<!-- checks password -->
			<p style="color:#c4c4ff; font-family: 'Source Sans Pro', sans-serif;">
			<b>${
				typeof regErrors["bad_pass"] != "undefined" ? regErrors["bad_pass"] : ""
			}</b><BR>
			<b>${
				typeof regErrors["bad_passlength"] != "undefined"
					? regErrors["bad_passlength"]
					: ""
			}
			${
				typeof regErrors["contains_space"] != "undefined"
					? regErrors["contains_space"]
					: ""
			}</b></p><BR>
				
		
			<span id="passwordlabelconfirm" name="passwordlabelconfirm" style="color: white; font-family: 'Source Sans Pro', sans-serif;"><B>Repeat password</B></span><BR>
			<input type="password" id ="passwordconfirm" class="passwordconfirm" name="passwordconfirm" placeholder="Password" style="border-radius: 5px; font-family: 'Source Sans Pro', sans-serif;"></input><BR>
			<p style="color:#c4c4ff; font-family: 'Source Sans Pro', sans-serif;">
			<b>${
				typeof regErrors["password_mismatch"] != "undefined"
					? regErrors["password_mismatch"]
					: ""
			}</b></p><BR><BR>
				
			<input type="submit" value='Register        ' id="submitbutton" class="button" name="submitbutton" style="min-width:20%; font-family: 'Source Sans Pro', sans-serif;"></input>
			</form>
			<BR>
			<form name='returntologin' action='/login' method="GET">
	<input type="submit" value='Return to Login       ' id="button2"   class="button" style="min-width:20%; font-family: 'Source Sans Pro', sans-serif;"></input></form>
			<script>
			if (params.has('fullname')) {
				var fullname = params.get('fullname');
				document.getElementById('fullname').value = fullname;
				document.getElementById("submitbutton").outerHTML = '<input type="submit" value="Continue        " id="submitbutton" class="button" name="submitbutton" style="min-width:20%";></input>'
			}
	
			if (params.has('email')) {
					var email = params.get('email');
					document.getElementById('username').value = email;
			};
			</script>`
	);
});

// Code inspired by Assignment 2 Code Examples
// POST REGISTER
app.post("/register", function (request, response) {
	let params = new URLSearchParams(request.query);
	console.log(params);

	regErrors = {}; // sets regErrors to empty so errors don't show up when page reloads
	fullname = request.body.fullname;
	user_name = request.body.username.toLowerCase();
	password = request.body.password;
	currentuser = user_name;
	pass_repeat = request.body.passwordconfirm;

	username = request.body.username.toLowerCase();
	// check for empty textboxes
	if (
		request.body.fullname == "" ||
		request.body.username == "" ||
		request.body.password == "" ||
		request.body.passwordconfirm == ""
	) {
		regErrors["empty_boxes"] = `All textboxes must be filled.`;
	}

	// FULL NAME VALIDATION
	// checks to see if full name entered is between 2 and 30 characters
	if (request.body.fullname.length < 2 || request.body.fullname.length > 30) {
		regErrors["bad_userlength"] = `Name must be between 2 and 30 characters.`;
	}

	// check to see if full name only contains letters
	if (/^[a-zA-Z\s]*$/.test(request.body.fullname) == false) {
		// regEx retrieved from stack overflow
		regErrors["bad_user"] = `Name must only contain letters.`;
	}

	// EMAIL VALIDATION
	// check if email is taken
	if (typeof users[user_name] != "undefined") {
		regErrors["username_taken"] = `Sorry, ${username} is already registered!`;
	}
	// checks if email follows X@Y.Z format
	if (
		/^[a-zA-Z0-9._]+@[a-zA-Z0-9.]+(?:\.[a-zA-Z0-9-]+)*$/.test(
			// // regEx retrieved from stack overflow
			request.body.username
		) == false
	) {
		regErrors["bad_email"] = `Please enter a valid email.`;
	}

	// PASSWORD VALIDATION
	// password must contain at least one special character and one number; regEx retrieved from stack overflow
	if (
		/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]/.test(
			request.body.password
		) == false
	) {
		regErrors[
			"bad_pass"
		] = `Password must contain at least one special character and one number.`;
	}

	// checks if password is not in between 10 and 16 characters
	if (request.body.password.length < 10 || request.body.password.length > 16) {
		regErrors[
			"bad_passlength"
		] = `Password must be between 10 and 16 characters.`;
	}

	// checks if password contains spaces; regEx retrieved from stack overflow
	if (/^\S*$/.test(request.body.password) == false) {
		regErrors["contains_space"] = `Passwords should not contain spaces.`;
	}

	// checks if the two passwords match
	if (request.body.password != request.body.passwordconfirm) {
		regErrors["password_mismatch"] = `Passwords must match!`;
	}
	if (Object.keys(regErrors).length == 0) {
		users[user_name] = {};
		users[user_name].username = request.body.username;
		users[user_name].fullname = request.body.fullname;
		users[user_name].password = encrypt(request.body.password); // encrypt password
		users[user_name].loginstatus = true;
		users[user_name].lasttimelog = 0;
		users[user_name].currtimelog = getCurrentDate(); // retrieves current date
		users[user_name].amtlogin = 1;
		users[user_name].admin = false;
		users[user_name].encrypted = true;
		actusers[user_name] = {};
		actusers[user_name] = users[user_name];

		response.cookie("activeuser", user_name, { maxAge: 1200000 }); // renaming the cookie "activeuser" to the new username; cookie expires after 20 minutes
		// sets the cookie's active user as the username if credentials are correct
		active_user = request.cookies["activeuser"]; // active user cookie set to active_user variable

		let data = JSON.stringify(users);
		let actdata = JSON.stringify(actusers);

		fs.writeFileSync(fname, data, "utf-8");
		fs.writeFileSync(actname, actdata, "utf-8");

		if (typeof request.session.lastPageVisited != "undefined") {
			//IR 1: redirect to last page visited after logging in
			response.redirect(request.session.lastPageVisited);
		} else {
			response.redirect("/products_display"); // IR1: if products display hasn't been visited before, then redirect them to products_display
		}
	} else {
		response.redirect(
			"./register?" +
				params.toString() +
				"&fullname=" +
				request.body.fullname +
				"&email=" +
				request.body.username
		); // keeps name and email input in URL to make form sticky
		console.log("errors=" + regErrors);
	}
});

// GET LOGOUT, officially logs out user and removes them from active user list
app.get("/logout", function (request, response) {
	ordered = "";
	users[active_user].loginstatus = false;
	delete actusers[active_user];
	response.clearCookie(["activeuser"]);
	active_user = null;
	// CHANGE LAST PAGE VISITED IN SESSIONS TO HOMEPAGE
	let data = JSON.stringify(users);
	let actdata = JSON.stringify(actusers);
	fs.writeFileSync(fname, data, "utf-8");
	fs.writeFileSync(actname, actdata, "utf-8");
	response.redirect("/");
});

// monitor all requests
app.all("*", function (request, response, next) {
	console.log(request.method + " to " + request.path);
	//console.log(request);
	next();
});

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
