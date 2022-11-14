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
	invoicestring =
		`<!DOCTYPE html>
	<html lang="en">
	<!-- 
	Invoice for Assignment1
	Author: Deborah Yuan
	Date: 11/2/22
	Desc: This html page produces an invoice for the customer after the quantities of products that the customer is requesting has already been validated. The validation for the user inputted quantities is done on the server, with invoice.html pulling the quantities from search params. This invoice includes an image of the product purchased (IR5), the product name, quantity, price, extended price, subtotal, shipping, tax, and total. The bottom of the invoice features a back button, which gives users the opportunity to go back to the purchasing page to buy more products if they want.
	-->
	
	<!-- this produces an invoice AFTER valid quantities have been typed and the customer is ready to check out-->
	
	<head>
	  <meta charset="UTF-8">
	  <meta http-equiv="X-UA-Compatible" content="IE=edge">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	
	  <script src="../products.json"></script>
	  <script src="../user_registration_info.json" type="application/json
	  "></script> <!-- loading in user data from user_registration_info.json -->
	
	  <link rel="preconnect" href="https://fonts.googleapis.com">
	  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
	
	  <link href="products-style.css" rel="stylesheet">
	  
	
	  <title>Invoice</title>
	</head>
	
	<body>
	  <main>` /* function section */ +
		// isNonNegativeInteger tests the input for errors, then returns error messages if any
		function isNonNegativeInteger(queryString, returnErrors = false) {
			errors = []; // assume no errors at first
			if (Number(queryString) != queryString) {
				errors.push("Not a number!"); // Check if string is a number value
			} else {
				if (queryString < 0) errors.push("a Negative value!"); // Check if it is non-negative
				if (parseInt(queryString) != queryString)
					errors.push("Not an integer!"); // Check that it is an integer
			}

			if (returnErrors) {
				// second parameter:
				return errors; // return errors if true
			} else if (errors.length == 0) {
				// else if there are no errors
				return true; // then there are no errors, hence true
			} else {
				return false; // else there is an unknown error?
			}
		};

	var quantities = []; // declaring empty array 'quantities'
	let params = new URLSearchParams(request.query);
	console.log(params);
	params.forEach(
		// for each iterates through all the keys
		function (value, key) {
			quantities.push(value); // pushes the value to quantities array
		}
	);

	// generate_item_rows used to write out rows in the table:
	function generate_item_rows(quantities) {
		for (let i in quantities) {
			if (quantities[i] == 0) {
				// if quantities = 0, then skip the row
				continue;
			} else {
				let extended_price = quantities[i] * products[i].price;
				// toFixed added to $ values to preserve cents
				document.write(`
		<tr>
		  <td align="center"><img src="${
				products[i].image
			}" class="img-responsive" style="width:50%; height:auto;" alt="Image"></td>
		  <td>${products[i].name}</td>
		  <td align="center">${quantities[i]}</td>
		  <td align="center">$${products[i].price.toFixed(2)}</td>
		  <td>$${(quantities[i] * products[i].price).toFixed(2)}</td>
		</tr>
		  `);
				subtotal += extended_price;
			}
		}

		// Compute subtotal
		var subtotal = 0;

		+`
	<h1 class="invoiceheader" style="text-align: center;">Invoice</h1>
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
	` + generate_item_rows(quantities); // call the function that produces table rows

		// Compute tax
		var tax_rate = 0.0475;
		var tax = tax_rate * subtotal;

		// Compute shipping
		var shipping;
		if (subtotal < 1000) {
			shipping = 5;
		} else if (subtotal >= 1000 && subtotal < 1500) {
			shipping = 10;
		} else if (subtotal >= 1500) {
			shipping = subtotal * 0.02;
		}

		// Compute grand total
		var total = tax + subtotal + shipping;

		+`
	<!-- table formatting, with some inline css -->
	<tr>
	  <td colspan="5" width="100%">&nbsp;</td>
	</tr>
	<tr>
	  <td style="text-align: right;" colspan="4" width="67%">Sub-total</td>
	  <td width="54%">$
		<script>document.write(subtotal.toFixed(2))</script>
	  </td>
	</tr>
	<tr>
	  <td style="text-align: right;" colspan="4" width="67%">Tax @ 4.75%</span></td>
	  <td width="54%">$
		<script>document.write(tax.toFixed(2))</script>
	  </td>
	</tr>
	<tr>
	  <td style="text-align: right;" colspan="4" width="67%">Shipping</td>
	  <td width="54%">$
		<script>document.write(shipping.toFixed(2))</script>
	  </td>
	</tr>
	<tr>
	  <td style="text-align: right;" colspan="4" width="67%"><strong>Total</strong></td>
	  <td width="54%"><strong>$
		  <script>document.write(total.toFixed(2))</script>
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
		<form name='confirmpurchase' action="/logout" method="POST">
	  <input type="submit" id="button" value='Confirm Purchase' id="Return"></input>
	</form>
	 </td>
	</tr>
  </tbody>
</table>
</main>
</body>

</html>
	`;
	}
	response.send(invoicestring);
});

/*app.post("/invoice", function (request, response) {
	console.log(ordered);
	response.redirect("invoice.html?" + ordered);
});*/

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
