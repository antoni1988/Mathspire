const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root-password",
  database: "math_course",
});


db.connect((err) => {
  if (err) throw err;
});

module.exports = db;
