var fs = require("fs");

var fname = "user_data.json";

if (fs.existsSync(fname)) {
	var data = fs.readFileSync(fname, "utf-8");

	var status = fs.statSync(fname);
	console.log("The file is " + status.size + " bytes");

	var users_reg_data = JSON.parse(data);
	console.log(users_reg_data);
} else {
	console.log("Sorry file " + fname + " does not exist.");
}
