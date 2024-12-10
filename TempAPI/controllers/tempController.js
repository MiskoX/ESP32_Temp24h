const Temperature = require("../models/Temperature");

const tempController = {
  // Zapis temperatury
  saveTemperature: (req, res) => {
    const { temperature } = req.body;

    if (typeof temperature !== "number") {
      return res
        .status(400)
        .json({ error: "Nieprawidłowy format temperatury" });
    }

    Temperature.saveTemperature(temperature, (err) => {
      if (err) {
        console.error("Błąd podczas zapisywania temperatury:", err);
        res.status(500).json({ error: "Błąd serwera" });
        return;
      }
      res.status(200).json({ message: "Temperatura zapisana pomyślnie" });
    });
  },

  // Pobieranie temperatury na podstawie filtrów
  getTemperatures: (req, res) => {
    const { hoursBack, start, end } = req.query;

    // Parametry walidacji
    if (hoursBack && !["6", "12", "24"].includes(hoursBack)) {
      return res
        .status(400)
        .json({ error: "Nieprawidłowy parametr 'hoursBack'" });
    }

    // Walidacja start i end
    if ((start && !end) || (end && !start)) {
      return res
        .status(400)
        .json({ error: "Obydwa parametry 'start' i 'end' są wymagane" });
    }

    // Pobieranie danych z bazy
    Temperature.getTemperatures(hoursBack, start, end, (err, results) => {
      if (err) {
        console.error("Błąd podczas pobierania temperatur:", err);
        res.status(500).json({ error: "Błąd serwera" });
        return;
      }
      res.status(200).json(results);
    });
  },
};

module.exports = tempController;
