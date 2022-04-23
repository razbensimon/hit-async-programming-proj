const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/api/costs', (req, res) => {
  res.status(201).send();
});

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(signal + ' signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
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

module.exports = { app, server };
