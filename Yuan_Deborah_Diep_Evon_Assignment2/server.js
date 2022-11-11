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

// process purchase request (validate quantities, check quantity available)

app.post("/purchase", function (request, response) {
	// process form by redirecting to the receipt page

	let validinput = true; // assume that all terms are valid
	let ordered = "";
	let allblank = false; // assume that it ISN'T all blank
	let instock = true;
	let othererrors = false; //assume that there aren't other errors

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
		response.redirect("invoice.html?" + ordered);
	}
});

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
