import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import "./Chart.css"; // Importujemy plik CSS

const MeasurementChart = () => {
  const [data, setData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(24); // Measurement duration in hours
  const [stats, setStats] = useState({
    average: null,
    max: null,
    min: null,
  });

  const [fetchIntervalId, setFetchIntervalId] = useState(null);
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0); // State for elapsed time

  useEffect(() => {
    // Cleanup interval when component unmounts
    return () => {
      clearInterval(fetchIntervalId);
    };
  }, [fetchIntervalId]);

  useEffect(() => {
    // If the measurement is running, update the elapsed time every second
    let timerInterval;
    if (isRunning) {
      timerInterval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000); // Update every second
    } else {
      clearInterval(timerInterval); // Clear timer when not running
    }

    return () => clearInterval(timerInterval); // Cleanup interval on unmount
  }, [isRunning]);

  const fetchData = async (startTime) => {
    try {
      const now = new Date().toISOString();

      // Używamy przekazanego startTime zamiast stanu
      const url = `http://localhost:5000/api/temperature?start=${startTime}&end=${now}`;

      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        console.error("Błąd serwera:", error.error);
        alert(`Błąd serwera: ${error.error}`);
        return;
      }

      const result = await response.json();

      if (!result || result.length === 0) {
        console.log("Brak danych dla wybranego zakresu czasu.");
        return;
      }

      const formattedData = result.map((entry) => ({
        timestamp: new Date(entry.timestamp).getTime(),
        temperature: entry.temperature,
      }));

      setData((prevData) => {
        const newData = [...prevData, ...formattedData].filter(
          (value, index, self) =>
            index ===
            self.findIndex(
              (t) =>
                t.timestamp === value.timestamp &&
                t.temperature === value.temperature
            )
        );

        updateTemperatureStats(newData.map((d) => d.temperature));
        return newData;
      });
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
      alert("Błąd podczas pobierania danych.");
    }
  };

  const updateTemperatureStats = (temperatures) => {
    if (temperatures.length === 0) return;
    const sum = temperatures.reduce((acc, temp) => acc + temp, 0);
    setStats({
      average: sum / temperatures.length,
      max: Math.max(...temperatures),
      min: Math.min(...temperatures),
    });
  };

  const startMeasurement = () => {
    if (isRunning) return;

    setIsRunning(true);
    setData([]);
    setStats({
      average: null,
      max: null,
      min: null,
    });

    const startTime = new Date().toISOString(); // Pobierz czas startu
    setStartTimestamp(startTime); // Ustaw stan startTimestamp

    fetchData(startTime); // Przekazujemy startTime do fetchData
    const intervalId = setInterval(() => fetchData(startTime), 30000); // Wywołanie co 30 sekund
    setFetchIntervalId(intervalId);
  };

  const stopMeasurement = () => {
    clearInterval(fetchIntervalId);
    setIsRunning(false);
  };

  const handleDurationChange = (e) => {
    const newDuration = Number(e.target.value);
    if (!isRunning) setDuration(newDuration);
    else alert("Cannot change duration while measurement is running.");
  };

  // Function to format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="chart-container">
      <h2>Temperature Measurement</h2>
      <div style={{ marginBottom: "20px" }}>
        <label>
          Select measurement duration:
          <select
            value={duration}
            onChange={handleDurationChange}
            disabled={isRunning}
            style={{ marginLeft: "10px" }}
          >
            <option value={1}>1 hour</option>
            <option value={3}>3 hours</option>
            <option value={6}>6 hours</option>
            <option value={12}>12 hours</option>
            <option value={24}>24 hours</option>
          </select>
        </label>
        <button
          onClick={startMeasurement}
          disabled={isRunning}
          style={{ marginLeft: "20px" }}
        >
          Start Measurement
        </button>
        <button
          onClick={stopMeasurement}
          disabled={!isRunning}
          style={{ marginLeft: "10px" }}
        >
          Stop Measurement
        </button>
      </div>

      <div className="statistics">
        {stats.average !== null && (
          <p>Average temperature: {stats.average.toFixed(2)}°C</p>
        )}
        {stats.max !== null && (
          <p>Maximum temperature: {stats.max.toFixed(2)}°C</p>
        )}
        {stats.min !== null && (
          <p>Minimum temperature: {stats.min.toFixed(2)}°C</p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p>Elapsed time: {formatElapsedTime(elapsedTime)}</p>{" "}
        {/* Display elapsed time */}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["auto", "auto"]}
            tickFormatter={(unixTime) => {
              const date = new Date(unixTime);
              return `${date.getHours()}:${String(date.getMinutes()).padStart(
                2,
                "0"
              )}`;
            }}
            scale="time"
          />
          <YAxis
            domain={[0, 50]}
            label={{
              value: "Temperature (°C)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleString();
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#4BC0C0"
            activeDot={{ r: 8 }}
            isAnimationActive={false}
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

export default MeasurementChart;
