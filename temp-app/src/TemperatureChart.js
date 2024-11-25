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
  const [xRange, setXRange] = useState(10); // Początkowy zakres osi X

  const fetchTemperatureData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/temperature");
      if (!response.ok) throw new Error("Błąd sieci");

      const result = await response.json();
      const temperatureData = result.map((entry) => entry.temperature);
      const timestamps = result.map((entry) =>
        new Date(entry.timestamp).toLocaleTimeString()
      );

      setData(temperatureData);
      setLabels(timestamps);

      // Ustawiamy zakres osi X na najbliższą wielokrotność 10
      const newXRange = Math.ceil(temperatureData.length / 10) * 10;
      setXRange(newXRange);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
    }
  };

  useEffect(() => {
    fetchTemperatureData();
    const interval = setInterval(fetchTemperatureData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Przygotowanie danych do wykresu
  const chartData = {
    labels: [...labels, ...Array(xRange - labels.length).fill("")], // Puste miejsca na osi X
    datasets: [
      {
        label: "Temperatura (°C)",
        data: [...data, ...Array(xRange - data.length).fill(null)], // Uzupełnij brakujące miejsca
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

  // Konfiguracja wykresu
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      y: {
        beginAtZero: false,
        min: Math.min(...data) - 2,
        max: Math.max(...data) + 2,
        title: {
          display: true,
          text: "Temperatura (°C)",
          font: {
            size: 16,
          },
        },
        ticks: {
          font: {
            size: 14,
          },
          stepSize: 0.5,
        },
      },
      x: {
        title: {
          display: true,
          text: "Czas",
          font: {
            size: 16,
          },
        },
        ticks: {
          font: {
            size: 14,
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <h2>Wykres temperatury</h2>
      <div className="chart-wrapper">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TemperatureChart;
