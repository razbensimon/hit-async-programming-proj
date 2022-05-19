import React, {useState} from "react";
import axios from "axios";

function Home() {
    const [userResult, setUserResult] = useState();
    const [costResult, setCostResult] = useState();

    const handleUserSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await axios({
                method: "post",
                url: "http://localhost:3000/api/users",
                data: {
                    first_name: event.target.first_name.value,
                    last_name: event.target.last_name.value,
                    martial_status: event.target.martial_status.value,
                    birth_date: event.target.birth_date.value,
                },
                headers: {"Content-Type": "application/json"},
            });
            console.log(response);
            setUserResult("User successfully created, your ID is " + response.data);
        } catch (error) {
            if (error.response.status === 400) {
                setUserResult("One of the values is missing or incorrect, please try again");
            } else {  // HTTP 500
                setUserResult("Internal server error, please try again later...");
            }
            console.log(error);
        }
    }

    const handleCostSubmit = async (event) => {
        event.preventDefault();

        let date = event.target.date.value;
        if (!date) {
            console.log("No date was given, setting to current");
            date = new Date();
        }

        try {
            const response = await axios({
                method: "post",
                url: "http://localhost:3000/api/costs",
                data: {
                    user_id: event.target.user_id.value,
                    date: date,
                    price: event.target.price.value,
                    category: event.target.category.value,
                    description: event.target.description.value
                },
                headers: {"Content-Type": "application/json"},
            });
            console.log(response);
            setCostResult("Cost item successfully created");
        } catch (error) {
            if (error.response.status === 400) {
                setCostResult("One of the values is missing or incorrect, please try again");
            } else if (error.response.status === 404) {
                setCostResult("User " + event.target.user_id.value + " does not exist");
            } else {  // HTTP 500
                setCostResult("Internal server error, please try again later...");
            }
            console.log(error);
        }
    }

    return (
        <div className="home">
            <div className="container">
                <div className="row align-items-center my-5">
                    <div className="col-lg-6">
                        <h1 className="font-weight-light">Add User</h1><br/>
                        <form onSubmit={handleUserSubmit}>
                            First name: <input name="first_name" type="text" placeholder="First name" /><br/><br/>
                            Last name: <input name="last_name" type="text" placeholder="Last name" /><br/><br/>
                            Martial status: <input name="martial_status" type="text" placeholder="Martial status" /><br/><br/>
                            Birth date: <input name="birth_date" type="date" placeholder="Birth date (YYYY-MM-DD)" /><br/><br/>
                            <input type="submit" value="create user" /><br/><br/>
                            <p className=".text-success">{userResult}</p>
                        </form>
                    </div>
                    <div id="add-cost-div" className="col-lg-6">
                        <h1 className="font-weight-light">Add Cost Item</h1><br/>
                        <form onSubmit={handleCostSubmit}>
                            User ID: <input name="user_id" type="text" placeholder="User ID" size="26" /><br/><br/>
                            Date: <input name="date" type="datetime-local" placeholder="Date" /><br/><br/>
                            Price: <input name="price" type="text" placeholder="Price" /><br/><br/>
                            Category: <input name="category" type="text" placeholder="Category" /><br/><br/>
                            Description: <input name="description" type="text" placeholder="Description" /><br/><br/>
                            <input type="submit" value="add cost item" /><br/><br/>
                            <p className=".text-success">{costResult}</p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;