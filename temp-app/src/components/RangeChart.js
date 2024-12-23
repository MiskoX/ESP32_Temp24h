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
import Modal from "./Modal";
import "./Chart.css";

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
    setStats({ max, min, average });
  };

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
      const timestamps = result.map(
        (entry) => new Date(entry.timestamp) // Convert to Date object for proper time handling
      );

      setData(
        temperatureData.map((temperature, index) => ({
          temperature,
          timestamp: timestamps[index].getTime(), // Use timestamp (milliseconds)
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

  return (
    <div className="chart-container">
      <h2>Wykres wstecz(1/3/6/12/24 godziny)</h2>

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
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]} // Dynamically adjust the X axis domain to fit the data
            padding={{ left: 0, right: 0 }}
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
