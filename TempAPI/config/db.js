const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "temperatures",
});

db.connect((err) => {
  if (err) {
    console.error("Błąd połączenia z bazą danych:", err);
    return;
  }
  console.log("Połączono z bazą danych MySQL");
});

module.exports = db;
