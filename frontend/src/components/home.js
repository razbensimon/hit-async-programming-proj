import React, { useState } from "react";
import axios from "axios";

function Home() {
  const backendAddress = process.env.REACT_APP_BACKEND_ADDRESS || 'localhost:3000';
  const [userResult, setUserResult] = useState();
  const [costResult, setCostResult] = useState();

  const handleUserSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post("http://" + backendAddress + "/api/users", {
        firstName: event.target.firstName.value,
        lastName: event.target.lastName.value,
        martialStatus: event.target.martialStatus.value,
        birthDate: event.target.birthDate.value
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
  };

  const handleCostSubmit = async (event) => {
    event.preventDefault();

    let date = event.target.date.value;
    if (!date) {
      date = new Date();
    }

    try {
      const response = await axios.post("http://" + backendAddress + "/api/costs", {
        usedId: event.target.usedId.value,
        date: date,
        price: event.target.price.value,
        category: event.target.category.value,
        description: event.target.description.value
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
  };

  return (
    <div className="home">
      <div className="container">
        <div className="row align-items-center my-5">
          <div className="col-lg-6">
            <h1 className="font-weight-light">Add User</h1><br />
            <form onSubmit={handleUserSubmit}>
              First name: <input name="firstName" type="text" placeholder="First name" required /><br /><br />
              Last name: <input name="lastName" type="text" placeholder="Last name" required /><br /><br />
              Martial status: <input name="martialStatus" type="text" placeholder="Martial status"
                                     required /><br /><br />
              Birth date: <input name="birthDate" type="date" placeholder="Birth date (YYYY-MM-DD)"
                                 required /><br /><br />
              <input type="submit" value="create user" /><br /><br />
              <p className=".text-success">{userResult}</p>
            </form>
          </div>
          <div id="add-cost-div" className="col-lg-6">
            <h1 className="font-weight-light">Add Cost Item</h1><br />
            <form onSubmit={handleCostSubmit}>
              User ID: <input name="userId" type="text" placeholder="User ID" size="26" required /><br /><br />
              Date: <input name="date" type="datetime-local" placeholder="Date" /><br /><br />
              Price: <input name="price" type="text" placeholder="Price" required /><br /><br />
              Category: <input name="category" type="text" placeholder="Category" required /><br /><br />
              Description: <input name="description" type="text" placeholder="Description" required /><br /><br />
              <input type="submit" value="add cost item" /><br /><br />
              <p className=".text-success">{costResult}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;