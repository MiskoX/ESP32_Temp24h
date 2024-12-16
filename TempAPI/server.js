const express = require("express");
const cors = require("./middleware/cors");
const tempRoutes = require("./routes/tempRoutes");
const db = require("./config/db");

const app = express();

// Middleware
app.use(cors);
app.use(express.json());

// Routes
app.use("/api/temperature", tempRoutes);

const insertRandomTemperature = () => {
  const randomTemperature = (Math.random() * 50).toFixed(2);
  const query =
    "INSERT INTO temperature_logs (temperature, timestamp) VALUES (?, NOW())";

  db.query(query, [randomTemperature], (err) => {
    if (err) {
      console.error("Błąd podczas dodawania losowej temperatury:", err);
      return;
    }
    console.log(
      `Dodano losową temperaturę: ${randomTemperature}°C o ${new Date().toISOString()}`
    );
  });
};

// //Harmonogram: co 5 minut
// const INTERVAL = 0.1 * 60 * 1000; // 5 minut w milisekundach
// setInterval(insertRandomTemperature, INTERVAL);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
