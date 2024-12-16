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

    // Walidacja 'hoursBack'
    if (hoursBack && (isNaN(hoursBack) || hoursBack <= 0 || hoursBack > 24)) {
      return res.status(400).json({
        error: "Parametr 'hoursBack' powinien być liczbą od 1 do 24.",
      });
    }

    // Walidacja 'start' i 'end'
    if ((start && !end) || (end && !start)) {
      return res.status(400).json({
        error: "Oba parametry 'start' i 'end' muszą być obecne.",
      });
    }

    if (
      (start && isNaN(Date.parse(start))) ||
      (end && isNaN(Date.parse(end)))
    ) {
      return res.status(400).json({
        error: "Parametry 'start' i 'end' muszą być w formacie ISO.",
      });
    }

    // Pobieranie danych z bazy
    Temperature.getTemperatures(hoursBack, start, end, (err, results) => {
      if (err) {
        console.error("Błąd podczas pobierania temperatur:", err);
        return res.status(500).json({ error: "Błąd serwera" });
      }

      res.status(200).json(results);
    });
  },
};

module.exports = tempController;
