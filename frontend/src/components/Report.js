import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import Chart from 'chart.js/auto';

function Report() {
    const [reportResult, setReportResult] = useState();
    const [barChartResult, setBarChartResult] = useState({
        labels: [],
        datasets: []
    });

    const handleReportSubmit = async (event) => {
        event.preventDefault();

        let formData = {
            user_id: event.target.user_id.value
        };

        if (event.target.year.value) {
            formData.year = event.target.year.value;
        }

        if (event.target.month.value) {
            formData.month = event.target.month.value;
        }

        try {
            const response = await axios({
                method: "get",
                url: "http://localhost:3000/api/report",
                params: formData,
                headers: {"Content-Type": "application/json"},
            });
            console.log(response);

            const result = {};
            for (let i=0; i < response.data.length; i++) {
                let category = response.data[i].category + " (" + response.data[i].count + ")";
                delete response.data[i].category;
                delete response.data[i].count;
                result[category] = response.data[i];
            }

            const labels = Object.keys(result);
            const totalPrice = labels.map(label => result[label].totalPrice);

            setBarChartResult({
                labels: labels,
                datasets: [{
                    data: totalPrice,
                    label: "Total Price",
                    backgroundColor: "#344440",
                    fill: true
                }]
            });
        } catch (error) {
            if (error.response.status === 400) {
                setReportResult("One of the values is missing or incorrect, please try again");
            } else {  // HTTP 500
                setReportResult("Internal server error, please try again later...");
            }
            console.log(error);
        }
    }

    return (
        <div className="about">
            <div className="container">
                <div className="row align-items-center my-5">
                    <div className="col-lg-6">
                        <h1 className="font-weight-light">Get costs report</h1><br/>
                        <form onSubmit={handleReportSubmit}>
                            User ID: <input name="user_id" type="text" placeholder="User ID" size="26" required /><br/><br/>
                            Year: <input name="year" type="text" placeholder="YYYY" required /><br/><br/>
                            Month (optional): <input name="month" type="text" placeholder="MM" /><br/><br/>
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