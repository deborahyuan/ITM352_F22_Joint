setprice();
function set_price(
	item_id,
	products,
	sales_record,
	discount,
	dynamic,
	date_now
) {
	var discount = ""; // Taken from discount input (number textbox)
	// Find the product(s) in the products array
	let selected_products = [];
	if (item_id === "*") {
		// If we select all (aka Item_ID === *)
		selected_products = products;
	} else {
		selected_products = products.filter(
			(product) => product.item_id === item_id
		); // Add the selected products to the selected_products array
	}
	// Apply the discount to the selected products
	selected_products.forEach((product) => {
		if (dynamic === false) {
			product.price = product.price * (1 - discount / 100); // Apply a static discount %
		} else {
			// If dynamic == true

			// Find the sales_record for the product
			//const product_sales = 		// Filters sales_record and matches items seleceted to equivalent in sales_record

			const latest_sale = product_sales[product_sales.length - 1]; // returns the last/most recent sale record for the current product
			const sale_time_diff =
				date_now - new Date(latest_sale.date_sold).getTime(); // 24hrs
			const hours_since_sale = sale_time_diff / (1000 * 60 * 60); // Converts sale_time_diff to hours
			// Apply the appropriate discount based on the time since the last sale
			if (hours_since_sale <= 24) {
				// If 0-24hrs
				product.price = product.price * (1 - 10 / 100); // apply 10% Discount
			} else if (hours_since_sale <= 48) {
				// If 24 - 48hrs
				product.price = product.price * (1 - 30 / 100); // apply 10% Discount
			} else if (hours_since_sale <= 72) {
				// If 48 - 72hrs
				product.price = product.price * (1 - 60 / 100); // apply 60% Discount
			} else if (hours_since_sale <= 96) {
				// If 72 - 96hrs
				product.price = product.price * (1 - 95 / 100); // apply 95% Discount
			}
		}
	});
}

// Whenever loggedin customer makes purchase -> sales_record.json date_sold
//iterates over the products in the products_data and writes it to sales_record.json
var shopping_cart = request.session.cart;
var sales_data = sales_record.sales_data;
var subtotal = 0;
var series = request.body["series"];
var active_user = request.cookies["activeuser"];

for (series in products_data) {
	for (i = 0; i < products_data[series].length; i++) {
		if (typeof shopping_cart[series] == "undefined") continue;
		qty = shopping_cart[series][i];
		if (qty > 0) {
			records = {} // makes empty object
			records.item_id = products_data[series][i].product_id;
			records.quantity = products_data[series][i].quantity_available;
			records.date_sold = getCurrentDate();
			records.customer_id = active_user;
			
			var dynamic_pricing = products_data[series][i].dynamic_pricing;
			var discount_percentage = products_data[series][i].discount_percentage;
			var price = products_data[series][i].price.toFixed(2);
			if (dynamic_pricing == true) {
				price = sale_price;
			} else if (dynamic_pricing == false && discount_percentage != 0) {
				price = sale_price;
			} else {
				price = price;
			};
			// dynamic_pricing == true --> sale_price else
			// dynamic_pricing == false && discount_percentage !=0 --> sale_price
			// else use price
		}
	}
};

let recorddata = JSON.stringify(salesrecord_data);
fs.writeFileSync(recordname, recorddata, "utf-8");





// make sure it takes seris into account
// blahblah = products_data[series][i]
// function ()


