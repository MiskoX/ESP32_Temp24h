const db = require("../config/db");

const Temperature = {
  // Zapis temperatury
  saveTemperature: (temperature, callback) => {
    const query =
      "INSERT INTO temperature_logs (temperature, timestamp) VALUES (?, NOW())";
    db.query(query, [temperature], callback);
  },

  // Pobierz temperatury w określonym zakresie
  getTemperatures: (hoursBack, start, end, callback) => {
    let query = "SELECT * FROM temperature_logs WHERE 1=1";
    const params = [];

    // Filtruj na podstawie 'hoursBack'
    if (hoursBack) {
      query += " AND timestamp >= NOW() - INTERVAL ? HOUR";
      params.push(parseInt(hoursBack, 10));
    }

    // Filtruj na podstawie daty początkowej i końcowej
    if (start && end) {
      query += " AND timestamp BETWEEN ? AND ?";
      params.push(start, end);
    } else if (start || end) {
      return callback("Obydwa parametry 'start' i 'end' są wymagane", null);
    }

    query += " ORDER BY timestamp ASC";

    db.query(query, params, callback);
  },
};

module.exports = Temperature;
