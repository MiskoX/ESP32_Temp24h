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
import "./Chart.css";

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
    // Update the elapsed time every second
    const timerInterval = setInterval(() => {
      if (isRunning) {
        setElapsedTime((prevTime) => prevTime + 1);
      }
    }, 1000);

    return () => clearInterval(timerInterval); // Cleanup interval on unmount
  }, [isRunning]);

  const fetchData = async () => {
    if (!startTimestamp) return; // Ensure startTimestamp is set

    try {
      const now = new Date();
      const adjustedNow = new Date(now.getTime() + 3600000); // Dodanie +1h (3600000 ms)
      const adjustedStart = new Date(
        new Date(startTimestamp).getTime() + 3600000
      ); // Dodanie +1h do startTimestamp

      const url = `http://localhost:5000/api/temperature?start=${adjustedStart.toISOString()}&end=${adjustedNow.toISOString()}`;

      console.log("Fetching data from URL:", url); // Log the fetch URL

      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        console.error("Błąd serwera:", error.error);
        alert(`Błąd serwera: ${error.error}`);
        return;
      }

      console.log("Response received successfully"); // Log successful response

      const result = await response.json();

      if (!result || result.length === 0) {
        console.log("Brak danych dla wybranego zakresu czasu.");
        return;
      }

      console.log("Raw data received:", result); // Log raw data

      const formattedData = result.map((entry) => ({
        timestamp: new Date(entry.timestamp).getTime(),
        temperature: entry.temperature,
      }));

      console.log("Formatted data:", formattedData); // Log formatted data

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

        console.log("Merged data:", newData); // Log merged data

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

  const [endTimestamp, setEndTimestamp] = useState(null); // Dodaj endTimestamp

  const startMeasurement = () => {
    if (isRunning) return;

    const startTime = new Date().toISOString(); // Pobierz czas startu
    setStartTimestamp(startTime); // Ustaw stan startTimestamp

    // Oblicz endTimestamp na podstawie startu i duration
    const endTime = new Date(
      new Date(startTime).getTime() + duration * 3600000
    ).toISOString();
    setEndTimestamp(endTime); // Ustaw endTimestamp

    setIsRunning(true);
    setElapsedTime(0); // Reset elapsed time
    setData([]);
    setStats({
      average: null,
      max: null,
      min: null,
    });

    fetchData(); // Wywołaj pierwszy fetch

    const intervalId = setInterval(fetchData, 1000); // Aktualizacja co sekundę
    setFetchIntervalId(intervalId);
  };

  const stopMeasurement = () => {
    clearInterval(fetchIntervalId);
    setFetchIntervalId(null);
    setIsRunning(false);
    setElapsedTime(0); // Clear elapsed time
    setEndTimestamp(null); // Reset endTimestamp
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
          <p>Średnia temperatura: {stats.average.toFixed(2)}°C</p>
        )}
        {stats.max !== null && <p>Max temperatura: {stats.max.toFixed(2)}°C</p>}
        {stats.min !== null && <p>Min temperatura: {stats.min.toFixed(2)}°C</p>}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p>Elapsed time: {formatElapsedTime(elapsedTime)}</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={[
              startTimestamp ? new Date(startTimestamp).getTime() : "auto",
              endTimestamp ? new Date(endTimestamp).getTime() : "auto",
            ]}
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
            stroke="#800080"
            strokeWidth={3}
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
