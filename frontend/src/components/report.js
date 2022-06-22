import React, { useState } from "react";
import axios from "axios";
import "chart.js/auto";
import { Bar } from "react-chartjs-2";

function Report() {
  const backendAddress = process.env.REACT_APP_BACKEND_ADDRESS || 'localhost:3000';
  const [reportResult, setReportResult] = useState();
  const [barChartResult, setBarChartResult] = useState({
    labels: [],
    datasets: [],
  });

  const handleReportSubmit = async (event) => {
    event.preventDefault();

    let formData = {
      usedId: event.target.usedId.value,
    };

    if (event.target.year.value) {
      formData.year = event.target.year.value;
    }

    if (event.target.month.value) {
      formData.month = event.target.month.value;
    }

    try {
      const response = await axios.get("http://" + backendAddress + "/api/report", {
        params: formData,
      });

      console.log(response.data);

      const barChartData = response.data.map((item) => {
        return {
          display: `${item.category}`,
          totalPrice: item.totalPrice,
        };
      });

      const labels = barChartData.map((item) => item.display);
      const totalPrice = barChartData.map((item) => item.totalPrice);

      setBarChartResult({
        labels: labels,
        datasets: [
          {
            data: totalPrice,
            label: "Total Price",
            backgroundColor: "#344440",
            fill: true,
          },
        ],
      });
    } catch (error) {
      if (error.response.status === 400) {
        setReportResult(
          "One of the values is missing or incorrect, please try again"
        );
      } else {
        // HTTP 500
        setReportResult("Internal server error, please try again later...");
      }
      console.log(error);
    }
  };

  return (
    <div className="about">
      <div className="container">
        <div className="row align-items-center my-5">
          <div className="col-lg-6">
            <h1 className="font-weight-light">Get costs report</h1>
            <br />
            <form onSubmit={handleReportSubmit}>
              User ID:{" "}
              <input name="userId" type="text" placeholder="User ID" size="26" required />
              <br />
              <br />
              Year:{" "}
              <input name="year" type="text" placeholder="YYYY" required />
              <br />
              <br />
              Month (optional):{" "}
              <input name="month" type="text" placeholder="MM" />
              <br />
              <br />
              <input type="submit" value="Get report" />
            </form>
          </div>
          <div id="add-cost-div" className="col-lg-6">
            <p className=".text-success">{reportResult}</p>
            <Bar data={barChartResult} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;
