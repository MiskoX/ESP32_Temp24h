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
  const [xRange, setXRange] = useState(6); // Initial range set to 6 hours
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    max: null,
    min: null,
    average: null,
  });

  // Function to calculate stats
  const calculateStats = (data) => {
    if (!data || data.length === 0) return;
    const temperatures = data.map((entry) => entry.temperature);
    const max = Math.max(...temperatures);
    const min = Math.min(...temperatures);
    const average =
      temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    // Update the stats state after calculating
    setStats({ max, min, average });
  };

  // Call calculateStats to update the stats when the data changes
  useEffect(() => {
    calculateStats(data);
  }, [data]);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/temperature?hoursBack=${xRange}`
      );
      const result = await response.json();

      const temperatureData = result.map((entry) => entry.temperature);
      const timestamps = result.map((entry) =>
        new Date(entry.timestamp).toLocaleString("pl-PL", {
          weekday: "short", // Show weekday (e.g., Monday)
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
      <h2>Wykres (Zakres 1/3/6/12/24 godziny)</h2>

      <div className="range-selector">
        <label>
          Zakres:
          <select
            value={xRange}
            onChange={(e) => setXRange(Number(e.target.value))}
          >
            <option value={1}>1 godzina</option>
            <option value={3}>3 godziny</option>
            <option value={6}>6 godzin</option>
            <option value={12}>12 godzin</option>
            <option value={24}>24 godziny</option>
          </select>
        </label>

        <button onClick={handleFetch}>Pobierz dane</button>
      </div>

      {/* Displaying min, max, average values above the chart */}
      <div className="statistics">
        {stats.average !== null && (
          <p>Średnia temperatura: {stats.average.toFixed(2)}°C</p>
        )}
        {stats.max !== null && <p>Max temperatura: {stats.max.toFixed(2)}°C</p>}
        {stats.min !== null && <p>Min temperatura: {stats.min.toFixed(2)}°C</p>}
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
            stroke="#800080" // Purple color
            strokeWidth={3} // Line thickness
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

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default RangeChart;
