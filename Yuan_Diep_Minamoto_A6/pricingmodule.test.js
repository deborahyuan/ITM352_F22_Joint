const assert = require("assert");
const server = require('./server.js');
const {
	setDynamicPrice,
	products_data,
	records,
	formatDate,
	calculateTimeDifference,
	getCurrentDate,
	applyDiscountPercentage
} = require('./server.js');
describe("Testing Harness", function () {
	const currentDate = "05/12/23 12:00 AM"

	describe("setDynamicPrice", function () {
		it('should apply dynamic pricing if there have been no sales in the last 24 hours', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0511230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/11/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};

			setDynamicPrice(products_data, series, records, i, currentDate);

			const actualSalePrice = server.products_data[series][i].sale_price;
			const expectedSalePrice = 899.10; // 10% off $999
			assert.equal(actualSalePrice, expectedSalePrice);
		});

		it('should apply dynamic pricing if there have been no sales in the last 48 hours', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0510230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/10/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};

			setDynamicPrice(products_data, series, records, i, currentDate);

			const actualSalePrice = server.products_data[series][i].sale_price;
			const expectedSalePrice = 699.30; // 30% off $999
			assert.equal(actualSalePrice, expectedSalePrice);
		});

		it('should apply dynamic pricing if there have been no sales in the last 72 hours', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0509230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/09/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};

			setDynamicPrice(products_data, series, records, i, currentDate);

			const actualSalePrice = server.products_data[series][i].sale_price;
			const expectedSalePrice = 399.60; // 60% off $999
			assert.equal(actualSalePrice, expectedSalePrice);
		});

		it('should apply dynamic pricing if there have been no sales in the last 96 hours', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0508230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/08/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};

			setDynamicPrice(products_data, series, records, i, currentDate);


			const actualSalePrice = server.products_data[series][i].sale_price;
			const expectedSalePrice = 49.95; // 95% off of $999
			assert.equal(actualSalePrice, expectedSalePrice);
		});

		it('should be undefined when there are no records for the selected product id.', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {};

			setDynamicPrice(products_data, series, records, i, currentDate);


			const actualSalePrice = setDynamicPrice(products_data, series, records, i, currentDate);
			const expectedSalePrice = undefined;
			assert.equal(actualSalePrice, expectedSalePrice);
		});
	});

	describe("applyDiscountPercentage", function () {
		it('should allow for price increases as negative discount', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0508230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/08/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};
			var requestcheckbox = true;
			var discount_percent = -99;

			applyDiscountPercentage(products_data, series, i, discount_percent, requestcheckbox);


			const actualSalePrice = products_data[series][i].sale_price
			const expectedSalePrice = 1988.01; // -99% off 999
			assert.equal(actualSalePrice, expectedSalePrice);
		});

		it('should allow for sales price update using user postive inputted discount', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0508230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/08/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};
			var requestcheckbox = true;
			var discount_percent = 50;

			applyDiscountPercentage(products_data, series, i, discount_percent, requestcheckbox);


			const actualSalePrice = products_data[series][i].sale_price
			const expectedSalePrice = 499.50; // 50% off 999
			assert.equal(actualSalePrice, expectedSalePrice);
		});

		it('should allow for sales price update using user inputted max discount', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0508230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/08/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};
			var requestcheckbox = true;
			var discount_percent = 99;

			applyDiscountPercentage(products_data, series, i, discount_percent, requestcheckbox);

			const actualSalePrice = products_data[series][i].sale_price
			const expectedSalePrice = 9.99; // 99% off 999
			assert.equal(actualSalePrice, expectedSalePrice);
		});

		it('should throw error for non numerical inputted discount', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0508230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/08/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};
			var requestcheckbox = true;
			var discount_percent = "abc";

			applyDiscountPercentage(products_data, series, i, discount_percent, requestcheckbox);

			const actualSalePrice = products_data[series][i].sale_price
			const expectedSalePrice = NaN //
			assert.equal(actualSalePrice, expectedSalePrice);
		});
		it('should throw error for non checkbox', function () {
			var series = 'iPhone';
			var i = 0; // iPhone 14 Pro, $999
			var records = {
				"101": {
					"0508230000": {
						"product_id": 101,
						"quantity": 45,
						"date_sold": "5/08/2023 12:00AM",
						"customer_id": "itm352@hawaii.edu"
					}
				}
			};
			var requestcheckbox = undefined;
			var discount_percent = 50;

			applyDiscountPercentage(products_data, series, i, discount_percent, requestcheckbox);

			const actual_discount_percentage = products_data[series][i].discount_percentage;
			const expected_discount_percentage = products_data[series][i].discount_percentage;
			assert.equal(actual_discount_percentage, expected_discount_percentage);
		});
	});
});