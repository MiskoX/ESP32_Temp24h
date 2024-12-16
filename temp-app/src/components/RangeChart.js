import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Modal from "./Modal"; // Importujemy modal do wyświetlania błędów
import "./Chart.css"; // Importujemy wspólne style CSS

const RangeChart = () => {
  const [data, setData] = useState([]);
  const [xRange, setXRange] = useState(6);
  const [customRange, setCustomRange] = useState(6);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/temperature?hoursBack=${xRange}`
      );
      const result = await response.json();

      const temperatureData = result.map((entry) => entry.temperature);
      const timestamps = result.map((entry) =>
        new Date(entry.timestamp).toLocaleString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      setData(
        temperatureData.map((temperature, index) => ({
          temperature,
          timestamp: timestamps[index],
        }))
      );
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
      setErrorMessage("Błąd pobierania danych.");
      setIsModalOpen(true);
    }
  };

  const handleFetch = () => {
    if (xRange <= 0 || xRange > 24) {
      setErrorMessage("Zakres czasu musi być liczbą między 1 a 24 godzin.");
      setIsModalOpen(true);
      return;
    }
    fetchData();
  };

  useEffect(() => {
    if (xRange <= 24) {
      fetchData();
    }
  }, [xRange]);

  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="chart-container">
      <h2>Wykres (Zakres 6/12/24 godziny)</h2>

      <div className="range-selector">
        <label>
          Zakres:
          <select
            value={xRange}
            onChange={(e) => setXRange(Number(e.target.value))}
          >
            <option value={6}>6 godzin</option>
            <option value={12}>12 godzin</option>
            <option value={24}>24 godziny</option>
          </select>
        </label>

        <div className="custom-range">
          <label>
            Niestandardowy zakres:
            <input
              type="number"
              value={customRange}
              onChange={(e) => setCustomRange(Number(e.target.value))}
              min="1"
              max="24"
            />
            godzin
          </label>
          <button onClick={() => setXRange(customRange)}>Zatwierdź</button>
        </div>

        <button onClick={handleFetch}>Pobierz dane</button>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={[0, 50]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#9a66ff"
            fillOpacity={0.2}
            fill="#9a66ff"
          />
          <ReferenceLine y={50} stroke="red" label="Max: 50°C" />
        </LineChart>
      </ResponsiveContainer>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default RangeChart;
