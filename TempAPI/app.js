const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Konfiguracja połączenia z bazą MySQL
const db = mysql.createConnection({
  host: "localhost", // host bazy danych
  user: "root", // użytkownik bazy danych
  password: "", // hasło użytkownika bazy
  database: "temperatures", // nazwa bazy danych
});

// Połączenie z bazą
db.connect((err) => {
  if (err) {
    console.error("Błąd połączenia z bazą danych:", err);
    return;
  }
  console.log("Połączono z bazą danych MySQL");
});

// Endpoint do zapisu temperatury
app.post("/api/temperature", (req, res) => {
  const { temperature } = req.body;
  const query =
    "INSERT INTO temperature_logs (temperature, timestamp) VALUES (?, NOW())";
  db.query(query, [temperature], (err) => {
    if (err) {
      console.error("Błąd podczas zapisywania temperatury:", err);
      res.status(500).json({ error: "Błąd serwera" });
      return;
    }
    res.status(200).json({ message: "Temperatura zapisana pomyślnie" });
  });
});

// Endpoint do pobierania temperatury (wszystkie rekordy)
app.get("/api/temperature", (req, res) => {
  const query =
    "SELECT * FROM temperature_logs WHERE timestamp >= NOW() - INTERVAL 24 HOUR ORDER BY timestamp ASC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Błąd podczas pobierania temperatur:", err);
      res.status(500).json({ error: "Błąd serwera" });
      return;
    }
    res.status(200).json(results);
  });
});

// Uruchomienie serwera
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
