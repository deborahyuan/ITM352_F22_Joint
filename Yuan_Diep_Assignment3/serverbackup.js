for (i in seriesArray) {
	series = seriesArray[i];
	console.log("QUOTES=" + series);
	seriesNQ = seriesArray[i].replaceAll('"', "");
	console.log("NQQUOTES=" + seriesNQ);

	quantities = request.session.cart[series];
	products = products_data[series];

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
  <td align="center"><input type="number" name="cartquantitytextbox[${i}]_${seriesNQ}" id ="cartquantitytextbox[${i}]_${seriesNQ}" min="0" max="${
				Number(products[i].quantity_available) + Number(quantities[i])
			}" step="1" onkeydown="quantityError(this)" onkeyup="quantityError(this)" onmouseup="quantityError(this)"></input><BR><p id="cartquantitytextbox[${i}]_${seriesNQ}_msg"></p></td>)
  <td align="center">$${products[i].price.toFixed(2)}</td>
  <td>$${(quantities[i] * products[i].price).toFixed(2)}</td>
</tr>`);

			response.write(`<script>`);
			for (let i in quantities) {
				if (quantities[i] == 0 || quantities[i] == "") {
					// adding textbox error messages based on inputted value
					continue;
				} else {
					response.write(`
cart_form["cartquantitytextbox[${i}]_${seriesNQ}"].value = ${quantities[i]}
`);
				}
			}
			response.write(`</script>
<script>
setInputFilter(document.getElementById("cartquantitytextbox[${i}]_${seriesNQ}"), 
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
</script>
  `);

			subtotal += extended_price;
			console.log(products[i].price);
		}
	}
}
