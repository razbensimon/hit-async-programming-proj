const express = require('express');
const app = express();
const port = 3000;

app.post('/api/costs', (req, res) => {
  res.status(201).send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

class UserModel {
  id;
  first_name;
  last_name;
  birthday;
  marital_status;
}

class CostItemModel {
  id;
  sum;
  category;
  description;
}

module.exports = { app };
