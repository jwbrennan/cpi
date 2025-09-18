import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";

function USCalculator() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cpiStart, setCpiStart] = useState(null);
  const [cpiEnd, setCpiEnd] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCPIForPeriod = async (startYear, endYear) => {
    const url = "https://api.bls.gov/publicAPI/v2/timeseries/data/"; // Relative URL for proxy
    const seriesId = "CUSR0000SA0";
    const payload = {
      seriesid: [seriesId],
      startyear: startYear.toString(),
      endyear: endYear.toString(),
      registrationkey: "e5fa419cc40a46dd87a476f08930e9d9",
    };

    try {
      console.log("Sending request with payload:", payload); // Debug log
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("Response status:", response.status); // Debug log

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data); // Debug log
      if (
        !data.Results ||
        !data.Results.series ||
        !data.Results.series[0].data ||
        data.Results.series[0].data.length === 0
      ) {
        throw new Error("No CPI data found for the specified period.");
      }

      return data.Results.series[0].data;
    } catch (err) {
      console.error("CPI fetch error:", err);
      throw err;
    }
  };

  const findCPIForMonth = (data, year, month) => {
    const monthMap = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const monthStr = month; // Already "Jan", "Mar", etc.
    const targetPeriod = `M${monthMap[monthStr] || "01"}`; // Fallback to "01" if month is invalid
    console.log("Step 1: findCPIForMonth inputs:", {
      year,
      month,
      monthStr,
      targetPeriod,
    });
    const cpiData = data.find(
      (entry) => entry.year === year.toString() && entry.period === targetPeriod
    );
    console.log(
      "Step 1: findCPIForMonth result:",
      cpiData || "No matching data"
    );
    return cpiData ? parseFloat(cpiData.value) : null;
  };

  const calculateRate = async () => {
    console.log(
      "Step 1: calculateRate called with startDate:",
      startDate,
      "endDate:",
      endDate
    );
    if (!startDate || !endDate) {
      setError("Please select both a start date and an end date.");
      setCpiStart(null);
      setCpiEnd(null);
      setResult(null);
      console.log("Step 1: Error - Missing dates");
      return;
    }
    if (startDate > endDate) {
      setError("Start date must be before end date.");
      setCpiStart(null);
      setCpiEnd(null);
      setResult(null);
      console.log("Step 1: Error - Invalid date range");
      return;
    }

    try {
      setLoading(true);
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const startMonth = startDate.toLocaleString("default", {
        month: "short",
      });
      const endMonth = endDate.toLocaleString("default", { month: "short" });
      console.log("Step 1: Preparing to fetch CPI with:", {
        startYear,
        endYear,
        startMonth,
        endMonth,
      });

      console.log("Step 1: Calling fetchCPIForPeriod");
      const cpiData = await fetchCPIForPeriod(startYear, endYear);
      console.log("Step 1: CPI Data received:", cpiData);

      const cpiStartValue = findCPIForMonth(cpiData, startYear, startMonth);
      const cpiEndValue = findCPIForMonth(cpiData, endYear, endMonth);
      console.log("Step 1: CPI Values:", { cpiStartValue, cpiEndValue });

      if (!cpiStartValue || !cpiEndValue) {
        throw new Error("CPI data not found for the selected months.");
      }

      const rate = ((cpiEndValue / cpiStartValue - 1) * 100).toFixed(2);
      setCpiStart(cpiStartValue.toFixed(2));
      setCpiEnd(cpiEndValue.toFixed(2));
      setResult(rate);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch CPI data: ${err.message}`);
      setCpiStart(null);
      setCpiEnd(null);
      setResult(null);
      console.error("Step 1: CalculateRate error:", err.message);
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
      <h1>Cumulative CPI Rate Calculator US</h1>
      <p className="source-info">
        Data sourced from the Bureau of Labor Statistics (BLS) Consumer Price
        Index (CPI-U, CUSR0000SA0).
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

export default USCalculator;
