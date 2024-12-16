import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import "./Chart.css"; // Importujemy wspólne style CSS

const CustomRangeChart = () => {
  const [data, setData] = useState([]);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [stats, setStats] = useState({
    max: null,
    min: null,
    average: null,
  });

  // Funkcja do obliczania statystyk
  const calculateStats = (data) => {
    if (!data || data.length === 0) return;
    const temperatures = data.map((entry) => entry.temperature);
    const max = Math.max(...temperatures);
    const min = Math.min(...temperatures);
    const average =
      temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    setStats({ max, min, average });
  };

  // Funkcja do pobierania danych
  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/temperature?start=${customStart}&end=${customEnd}`
      );
      const result = await response.json();

      const formattedData = result.map((entry) => ({
        timestamp: new Date(entry.timestamp).getTime(),
        temperature: entry.temperature,
      }));

      setData(formattedData);
      calculateStats(formattedData);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
      alert("Błąd podczas pobierania danych.");
    }
  };

  // Funkcja do obsługi formularza
  const handleSubmit = () => {
    if (!customStart || !customEnd) {
      setErrorMessage("Proszę wprowadzić oba zakresy dat.");
      setShowErrorModal(true);
      return;
    }

    const start = new Date(customStart).getTime();
    const end = new Date(customEnd).getTime();

    // Walidacja formatów dat
    if (isNaN(start) || isNaN(end)) {
      setErrorMessage("Podano nieprawidłowy format daty.");
      setShowErrorModal(true);
      return;
    }

    // Sprawdzamy, czy data początkowa nie jest po końcowej
    if (start >= end) {
      setErrorMessage(
        "Data początkowa musi być wcześniejsza niż data końcowa."
      );
      setShowErrorModal(true);
      return;
    }

    // Sprawdzamy, czy zakres czasowy nie przekracza 24 godzin
    const timeDifference = (end - start) / (1000 * 3600); // Różnica w godzinach

    if (timeDifference > 24) {
      setErrorMessage("Zakres czasowy nie może przekroczyć 24 godzin.");
      setShowErrorModal(true);
      return;
    }

    fetchData();
  };

  // Funkcja do formatowania daty
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 ponieważ miesiące w JS zaczynają się od 0
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Funkcja do zamknięcia modalnego okna
  const closeModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  return (
    <div className="chart-container">
      <h2>Wykres z niestandardowym zakresem czasowym</h2>
      <div className="date-range">
        <label>
          Początek zakresu:
          <input
            type="datetime-local"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
        </label>
        <label>
          Koniec zakresu:
          <input
            type="datetime-local"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </label>
        <button onClick={handleSubmit}>Pobierz dane</button>
      </div>

      {/* Modal do wyświetlania błędów */}
      {showErrorModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["auto", "auto"]}
            scale="time"
            tickFormatter={formatDate} // Używamy funkcji formatDate, by wyświetlić datę i godzinę
          />
          <YAxis domain={[0, 50]} />
          <Tooltip
            labelFormatter={formatDate} // Używamy funkcji formatDate, by sformatować datę w tooltipie
            formatter={(value) => `${value.toFixed(2)} °C`} // Temperatura do dwóch miejsc po przecinku
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#800080" // Kolor fioletowy
            strokeWidth={3} // Pogrubienie linii
          />
          {stats.max !== null && (
            <ReferenceLine
              y={stats.max}
              stroke="#FF0000"
              strokeDasharray="3 3"
            />
          )}
          {stats.min !== null && (
            <ReferenceLine
              y={stats.min}
              stroke="#0000FF"
              strokeDasharray="3 3"
            />
          )}
          {stats.average !== null && (
            <ReferenceLine
              y={stats.average}
              stroke="#00FF00"
              strokeDasharray="3 3"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomRangeChart;
