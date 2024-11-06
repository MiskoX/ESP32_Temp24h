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
import "./TemperatureChart.css"; // Importowanie pliku CSS

// Rejestracja komponentów wykresu
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

  // Funkcja pobierająca dane z API
  const fetchTemperatureData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/temperature"); // Użyj portu 5000
      if (!response.ok) throw new Error("Błąd sieci");

      const result = await response.json();
      const temperatureData = result.map((entry) => entry.temperature);
      const timestamps = result.map((entry) =>
        new Date(entry.timestamp).toLocaleTimeString()
      );

      // Aktualizacja danych i etykiet
      setData(temperatureData);
      setLabels(timestamps);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
    }
  };

  useEffect(() => {
    // Pobieranie danych co 5 sekund
    fetchTemperatureData();
    const interval = setInterval(fetchTemperatureData, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Temperatura (°C)",
        data,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        pointRadius: 5, // Zwiększony rozmiar punktów
        pointHoverRadius: 7, // Większy rozmiar przy najechaniu
        pointBorderColor: "rgba(0, 123, 255, 1)", // Kolor obramowania punktów
        pointBackgroundColor: "rgba(0, 123, 255, 0.6)", // Wypełnienie punktów
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true, // Ustawienie na true dla zachowania proporcji
    aspectRatio: 16 / 9, // Proporcje 16:9
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Temperatura (°C)",
          font: {
            size: 16, // Rozmiar czcionki dla tytułu osi Y
          },
        },
        ticks: {
          font: {
            size: 14, // Rozmiar czcionki dla ticków osi Y
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Czas",
          font: {
            size: 16, // Rozmiar czcionki dla tytułu osi X
          },
        },
        ticks: {
          font: {
            size: 14, // Rozmiar czcionki dla ticków osi X
          },
        },
      },
    },
    interaction: {
      mode: "nearest", // Lepsze przyciąganie do najbliższego punktu
      axis: "x", // Interakcja działa tylko w osi X
      intersect: false, // Podpowiedź pojawia się, gdy jest najbliżej
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 14, // Rozmiar czcionki dla legendy
          },
        },
      },
      tooltip: {
        titleFont: {
          size: 14, // Rozmiar czcionki dla tytułu podpowiedzi
        },
        bodyFont: {
          size: 12, // Rozmiar czcionki dla treści podpowiedzi
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
