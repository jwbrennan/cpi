import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function UKCalculator() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cpiStart, setCpiStart] = useState(null);
  const [cpiEnd, setCpiEnd] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLatestVersion = async () => {
    const url =
      "https://api.beta.ons.gov.uk/v1/datasets/cpih01/editions/time-series/versions";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const latestVersion = data.items[0]?.version;
      if (!latestVersion) {
        throw new Error("No versions found");
      }
      return latestVersion;
    } catch (err) {
      console.error("Version fetch error:", err);
      throw err;
    }
  };

  const fetchCPIForMonth = async (year, month, version) => {
    const monthStr = month
      .toLocaleString("default", { month: "short" })
      .slice(0, 3);
    const timeParam = `${monthStr}-${year.toString().slice(-2)}`;
    const url = `https://api.beta.ons.gov.uk/v1/datasets/cpih01/editions/time-series/versions/${version}/observations?time=${timeParam}&geography=K02000001&aggregate=CP00`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.observations && data.observations[0]?.observation) {
        return parseFloat(data.observations[0].observation);
      }
      throw new Error("CPI data not found for the specified month.");
    } catch (err) {
      console.error("CPI fetch error:", err);
      throw err;
    }
  };

  const calculateRate = async () => {
    if (!startDate || !endDate) {
      setError("Please select both a start date and an end date.");
      setCpiStart(null);
      setCpiEnd(null);
      setResult(null);
      return;
    }
    if (startDate > endDate) {
      setError("Start date must be before end date.");
      setCpiStart(null);
      setCpiEnd(null);
      setResult(null);
      return;
    }
    try {
      setLoading(true);
      const version = await fetchLatestVersion();
      const startYear = startDate.getFullYear();
      const startMonth = startDate.toLocaleString("default", {
        month: "short",
      });
      const endYear = endDate.getFullYear();
      const endMonth = endDate.toLocaleString("default", { month: "short" });
      const cpiStart = await fetchCPIForMonth(startYear, startMonth, version);
      const cpiEnd = await fetchCPIForMonth(endYear, endMonth, version);
      const rate = (cpiEnd / cpiStart - 1) * 100;
      setCpiStart(cpiStart.toFixed(2));
      setCpiEnd(cpiEnd.toFixed(2));
      setResult(rate.toFixed(2));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch CPI data! ${err.message}`);
      setCpiStart(null);
      setCpiEnd(null);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to set date to the first day of the month
  const setToFirstOfMonth = (date) => {
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  return (
    <div className="App">
      <h1>Cumulative CPI Rate Calculator UK</h1>
      <p className="source-info">
        Data is obtained from the Office for National Statistics (ONS) Consumer
        Prices Index including owner occupiers' housing costs (CPIH).
      </p>
      {loading && (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      )}
      {error && <p className="error-message">Error: {error}</p>}
      <label className="date-label">Start Month: </label>
      <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(setToFirstOfMonth(date))}
        dateFormat="d MMMM yyyy"
        showMonthYearPicker
        placeholderText="Select start month"
        className="date-picker"
      />
      <br />
      <br />
      <label className="date-label">End Month: </label>
      <DatePicker
        selected={endDate}
        onChange={(date) => setEndDate(setToFirstOfMonth(date))}
        dateFormat="d MMMM yyyy"
        showMonthYearPicker
        placeholderText="Select end month"
        className="date-picker"
      />
      <br />
      <br />
      <button onClick={calculateRate}>Calculate</button>

      {result !== null && (
        <div className="result-wrapper">
          <table className="result-table">
            <tbody>
              <tr>
                <td>
                  CPI at{" "}
                  {startDate
                    ? `1 ${startDate.toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}`
                    : "—"}
                </td>
                <td>
                  <strong>{cpiStart}</strong>
                </td>
              </tr>
              <tr>
                <td>
                  CPI at{" "}
                  {endDate
                    ? `1 ${endDate.toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}`
                    : "—"}
                </td>
                <td>
                  <strong>{cpiEnd}</strong>
                </td>
              </tr>
              <tr>
                <td>Cumulative Change</td>
                <td>
                  <strong>{result}%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UKCalculator;
