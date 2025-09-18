import React, { useState } from "react";
import "./App.css";
import UKCalculator from "./UKCalculator";
import EUCalculator from "./EUCalculator";
import USCalculator from "./USCalculator";

function App() {
  const [selectedCountry, setSelectedCountry] = useState(null);

  const renderContent = () => {
    if (!selectedCountry) {
      return (
        <p className="message">
          Select a button to view the corresponding CPI calculator.
        </p>
      );
    }
    if (selectedCountry === "uk") {
      return <UKCalculator />;
    }
    if (selectedCountry === "eu") {
      return <EUCalculator />;
    }
    if (selectedCountry === "us") {
      return <USCalculator />;
    }
    return (
      <p className="message">
        {selectedCountry.toUpperCase()} CPI Calculator will appear here.
      </p>
    );
  };

  return (
    <div className="container">
      <div className="flag-buttons">
        <button
          onClick={() => setSelectedCountry("eu")}
          className={`flag-button ${
            selectedCountry === "eu" ? "selected" : ""
          }`}
        >
          <img src="/eu-flag.png" alt="EU Flag" />
        </button>
        <button
          onClick={() => setSelectedCountry("uk")}
          className={`flag-button ${
            selectedCountry === "uk" ? "selected" : ""
          }`}
        >
          <img src="/uk-flag.png" alt="UK Flag" />
        </button>
        <button
          onClick={() => setSelectedCountry("us")}
          className={`flag-button ${
            selectedCountry === "us" ? "selected" : ""
          }`}
        >
          <img src="/us-flag.png" alt="US Flag" />
        </button>
      </div>
      {renderContent()}
    </div>
  );
}

export default App;
