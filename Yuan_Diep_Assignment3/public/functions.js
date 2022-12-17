function loadJSON(service, callback) {
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open("POST", service, false);
	xobj.onreadystatechange = function () {
		if (xobj.readyState == 4 && xobj.status == "200") {
			// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
			callback(xobj.responseText);
		}
	};
	xobj.send(null);
}

function isNonNegativeInteger(queryString, returnErrors = false) {
	errors = []; // assume no errors at first
	if (queryString != "") {
		if (/^-?[0-9]*\.{0,1}[0-9]+$/.test(queryString) == false) {
			errors.push("Not a number!"); // Check if string is a number value
		}
		if (/^-?[0-9]+$/.test(queryString) == false) {
			errors.push("Not an integer!"); // Check that it is an integer
		} else if (/^[0-9]+$/.test(queryString) == false) {
			errors.push("A negative integer!"); // Check that it is an neg integer
		} else if (/^(\s*|\d+)$/.test(queryString) == false) {
			errors.push("Is an Invalid Quantity!");
		}
	}
	if (returnErrors) {
		// if there are errors, return errors
		return errors;
	}

	if (errors.length == 0) {
		return true;
	} else {
		return false;
	}
}

function quantityError(theTextbox) {
	let input_string = theTextbox.value;
	let error_array = isNonNegativeInteger(input_string, true);
	let test = document.getElementsByClassName(theTextbox.name).item(0);
	console.log("inputSTring=" + input_string);
	if (Number(input_string) > Number(theTextbox.max)) {
		// if user inputted quantity is > products[i].quantity_available, then...
		document.getElementById(theTextbox.name + "_msg").outerHTML =
			'<p id="' +
			theTextbox.name +
			'_msg"><font color="red"><b>We do not have ' +
			input_string +
			" available.</b></font></p>"; //
		var extra = input_string - Number(theTextbox.max); //
		setTimeout(function () {
			// delays this code for a bit (500) so the user inputted quantity that exceeds stock isn't INSTANTLY changed
			document.getElementById(theTextbox.name).value = input_string - extra; // quantitytextbox = user inputted quantity - the # of products that exceeds stock
		}, 500);
		document.getElementById(theTextbox.name).style.borderColor = "red"; // changes quantitytextbox's border to red
		return;
	} else {
		document.getElementById(theTextbox.name).style.borderColor = "black"; // if the quantity is fixed, changes quantitytextbox's border to red
		document.getElementById(theTextbox.name + "_msg").outerHTML =
			'<p id="' + theTextbox.name + '_msg"></p>';
	}

	if (error_array.length == 0 || typeof error_array == "undefined") {
		document.getElementById(theTextbox.name).style.borderColor = "black"; // if the quantity is fixed, changes quantitytextbox's border to red

		// If there are no errors...
		if (Number(input_string) == "" || Number(input_string) == "0") {
			document.getElementById(theTextbox.name + "_msg").outerHTML =
				'<p id="' + theTextbox.name + '_msg"></p>';
		} else {
			document.getElementById(theTextbox.name + "_msg").outerHTML =
				'<p id="' +
				theTextbox.name +
				'_msg"> You want <b>' +
				input_string +
				"</b></p>"; //  tell the user how much they want
		}
	} else {
		document.getElementById(theTextbox.name).style.borderColor = "red"; // changes quantitytextbox's border to red
		// tell the user what the errors are and make the text red
		document.getElementById(theTextbox.name + "_msg").outerHTML =
			'<p id="' +
			theTextbox.name +
			'_msg"><font color="red"><b>Quantity is ' +
			error_array.join("; ") +
			"</b></font></p>";
	}
}

// HEAVILY MODIFIED, inspired by emkey08's response (https://stackoverflow.com/questions/469357/html-text-input-allow-only-numeric-input)
function setInputFilter(textbox, inputFilter, prodQuantity) {
	["focusout", "blur"].forEach(function (event) {
		textbox.addEventListener(event, function (e) {
			this.setCustomValidity("");
		});
	});
	[
		"input",
		"keydown",
		"keyup",
		"mousedown",
		"mouseup",
		"change",
		"contextmenu",
		"drop",
		"focusin",
	].forEach(function (event) {
		textbox.addEventListener(event, function (e) {
			if (inputFilter(this.value) || this.value == "") {
				// Accepted value
				if (["onclick", "keydown", "mousedown", "keyup"].indexOf(e.type) >= 0) {
					this.classList.remove("input-error");
					this.setCustomValidity("");
				}
				this.oldValue = this.value;
			} else if (this.hasOwnProperty("oldValue")) {
				// Rejected value
				this.classList.add("input-error");
				if (/^(\s*|\d+)$/.test(this.value) == false) {
					// must be a number
					errMsg = "Not a Number!";
				} else if (/^-?\d*$/.test(this.value) == false) {
					// must be an integer
					errMsg = "Not an Integer!";
				} else if (/^\d*$/.test(this.value) == false) {
					// must be a non negative integer
					errMsg = "Can't be negative!";
				} else if (this.value > prodQuantity == true) {
					// quantity requested exceeds stock
					errMsg = "Desired Quantity Exceeds Stock!";
				} else {
					errMsg = "";
					this.classList.remove("input-error");
				}
				this.setCustomValidity(errMsg);
				this.reportValidity();
			} else {
				// Rejected value - nothing to restore
				this.value = "";
			}
		});
	});
}

function extendedPriceListener(QuantityClass, CostClass, ExtendedCostClass) {
	Quantity = document.querySelector("." + QuantityClass);
	Cost = document.querySelector("." + CostClass);
	ExtendedCost = document.querySelector("." + ExtendedCostClass);

	Quantity.addEventListener("input", recalculateExtended);

	function recalculateExtended() {
		ExtendedCost.innerText = Number(Quantity.value) * Number(Cost.innerText);
	}
}
