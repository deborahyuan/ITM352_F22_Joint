var fs = require("fs");

var fname = "user_data.json";

var data = fs.readFileSync(fname, "utf-8");
var users_reg_data = JSON.parse(data);
console.log(data);
console.log(users_reg_data);
