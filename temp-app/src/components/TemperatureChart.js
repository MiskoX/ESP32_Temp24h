import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./TemperatureChart.css";
import Modal from "./Modal";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TemperatureChart = () => {
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);

  const [nowMode, setNowMode] = useState(true);
  const [rangeMode, setRangeMode] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  const [xRange, setXRange] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [tempCustomStart, setTempCustomStart] = useState("");
  const [tempCustomEnd, setTempCustomEnd] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomRangeModalOpen, setIsCustomRangeModalOpen] = useState(false);

  const fetchTemperatureData = async () => {
    try {
      let url = "http://localhost:5000/api/temperature";

      if (rangeMode) {
        const hoursBack = xRange / 2;
        url += `?hoursBack=${hoursBack}`;
      } else if (customMode && customStart && customEnd) {
        url += `?start=${customStart}&end=${customEnd}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        throw new Error("Błąd podczas pobierania danych z API.");
      }

      const result = await response.json();
      if (!Array.isArray(result)) {
        throw new Error("Otrzymane dane nie są w poprawnym formacie.");
      }

      const temperatureData = result.map((entry) => entry.temperature);
      const timestamps = result.map((entry) =>
        new Date(entry.timestamp).toLocaleString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      setData(temperatureData);
      setLabels(timestamps);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
      alert(`Błąd pobierania danych: ${error.message}`);
    }
  };

  const updateChartData = () => {
    fetchTemperatureData();
  };

  useEffect(() => {
    updateChartData();
    const interval = setInterval(updateChartData, 30000);
    return () => clearInterval(interval);
  }, [nowMode, rangeMode, customMode, xRange, customStart, customEnd]);

  const resetModes = () => {
    setNowMode(false);
    setRangeMode(false);
    setCustomMode(false);
    setXRange("");
    setCustomStart("");
    setCustomEnd("");
  };

  const handleNowMode = () => {
    resetModes();
    setNowMode(true);
  };

  const handleRangeMode = (newRange) => {
    resetModes();
    setRangeMode(true);
    setXRange(newRange);
    setIsModalOpen(false);
    updateChartData();
  };

  const openCustomRangeModal = () => {
    setTempCustomStart(customStart);
    setTempCustomEnd(customEnd);
    setCustomMode(true);
    setIsCustomRangeModalOpen(true);
  };

  const handleApplyCustomRange = () => {
    const start = new Date(tempCustomStart);
    const end = new Date(tempCustomEnd);
    const diff = (end - start) / (1000 * 60 * 60);

    if (diff > 24) {
      alert("Zakres nie może być większy niż 24 godziny.");
      return;
    }

    if (start > end) {
      alert("Data początkowa nie może być późniejsza niż data końcowa.");
      return;
    }
    resetModes();
    setCustomStart(tempCustomStart);
    setCustomEnd(tempCustomEnd);
    setCustomMode(true);
    setIsCustomRangeModalOpen(false);
    updateChartData();
  };

  const chartData = {
    labels: [...labels],
    datasets: [
      {
        label: "Temperatura (°C)",
        data: [...data],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBorderColor: "rgba(0, 123, 255, 1)",
        pointBackgroundColor: "rgba(0, 123, 255, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 50,
        title: { display: true, text: "Temperatura (°C)", font: { size: 16 } },
      },
      x: {
        title: { display: true, text: "Czas", font: { size: 16 } },
        ticks: { font: { size: 14 } },
      },
    },
    plugins: {
      legend: { labels: { font: { size: 14 } } },
    },
  };

  return (
    <div className="chart-container">
      <h2>Wykres temperatury</h2>
      <div className="chart-controls">
        <button onClick={handleNowMode}>Od teraz (24h max)</button>
        <button onClick={() => setIsModalOpen(true)}>Zakres 6/12/24h</button>
        <button onClick={openCustomRangeModal}>Zakres Custom</button>
      </div>

      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div>
          <label>
            Wybierz zakres:
            <select
              value={xRange}
              onChange={(e) => handleRangeMode(parseInt(e.target.value))}
            >
              <option value="" disabled>
                Wybierz zakres
              </option>
              <option value={48}>24 godziny</option>
              <option value={24}>12 godzin</option>
              <option value={12}>6 godzin</option>
            </select>
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={isCustomRangeModalOpen}
        onClose={() => setIsCustomRangeModalOpen(false)}
      >
        <div>
          <label>
            Od:
            <input
              type="datetime-local"
              value={tempCustomStart}
              onChange={(e) => setTempCustomStart(e.target.value)}
            />
          </label>
          <label>
            Do:
            <input
              type="datetime-local"
              value={tempCustomEnd}
              onChange={(e) => setTempCustomEnd(e.target.value)}
            />
          </label>
          <button onClick={handleApplyCustomRange}>Zastosuj</button>
        </div>
      </Modal>
    </div>
  );
};

export default TemperatureChart;
