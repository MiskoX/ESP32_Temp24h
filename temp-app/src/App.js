import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import RangeChart from "./components/RangeChart";
import CustomRangeChart from "./components/CustomRangeChart";
import MeasurementChart from "./components/MeasurementChart";

const App = () => {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/range">Zakres wstecz</Link>
            </li>
            <li>
              <Link to="/custom">Zakres niestandardowy</Link>
            </li>
            <li>
              <Link to="/forward">Pomiar od teraz</Link>
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/range" element={<RangeChart />} />
          <Route path="/custom" element={<CustomRangeChart />} />
          <Route path="/forward" element={<MeasurementChart />} />
          <Route
            path="/"
            element={<h2>Wybierz typ wykresu z menu powyżej</h2>}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
