import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function EUCalculator() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cpiStart, setCpiStart] = useState(null);
  const [cpiEnd, setCpiEnd] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCPIForMonth = async (year, month) => {
    const period = `${year}-${month}`;
    const url = `https://data-api.ecb.europa.eu/service/data/ICP/M.U2.N.000000.4.INX?startPeriod=${period}&endPeriod=${period}&format=jsondata`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const series = Object.values(data.dataSets[0].series)[0];
      if (series && series.observations && series.observations["0"]) {
        return parseFloat(series.observations["0"][0]);
      }
      throw new Error("CPI data not found for the specified month.");
    } catch (err) {
      console.error("CPI fetch error:", err);
      if (err.message.includes("Unexpected end of JSON input")) {
        throw new Error(
          "CPI data not available for the selected month. It may be too far in the future."
        );
      }
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
      const startYear = startDate.getFullYear();
      const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
      const cpiStart = await fetchCPIForMonth(startYear, startMonth);
      const cpiEnd = await fetchCPIForMonth(endYear, endMonth);
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
      <h1>Cumulative CPI Rate Calculator EU</h1>
      <p className="source-info">
        Data is obtained from the European Central Bank (ECB) using the
        Harmonised Index of Consumer Prices (HICP).
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
                  CPI in{" "}
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
                  CPI in{" "}
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

export default EUCalculator;
