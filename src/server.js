const express = require('express');
const Ajv = require('ajv');
const { StatusCodes } = require('http-status-codes');
const { User, Cost } = require('./database');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, martial_status, birthday } = req.body;
  const user = new User({
    first_name,
    last_name,
    birthday,
    martial_status
  });

  try {
    await user.save();
    console.log('User with ID', user._id.toString(), 'created');
    res.status(StatusCodes.CREATED).send();
  } catch (err) {
    console.error(err);
    if (err?.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).send();
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  }
});

app.post('/api/costs', async (req, res) => {
  const { user_id, sum, date, category, description } = req.body;

  try {
    await User.findById(user_id).exec();
  } catch (err) {
    console.log('Failed creating cost item, user with ID', user_id, 'does not exist');
    res.status(StatusCodes.NOT_FOUND).send();
    return;
  }

  const cost = new Cost({
    user_id,
    sum,
    date,
    category,
    description
  });

  try {
    await cost.save();
    console.log('Cost item with ID', cost._id.toString(), 'created');
    res.status(StatusCodes.CREATED).send();
  } catch (err) {
    console.error(err);
    if (err?.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).send();
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  }
});

const reportSchema = {
  type: 'object',
  properties: {
    user_id: { type: 'string' },
    year: { type: 'string' },
    month: { type: 'string' }
  },
  required: ['user_id', 'year']
};

const ajv = new Ajv();
const validate = ajv.compile(reportSchema);

app.get('/api/report', async (req, res) => {
  console.log(req.body);
  console.log(req.query);
  if (!validate(req.query)) {
    console.log(validate.errors);
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  const { user_id, year, month } = req.query;
  console.log(user_id, year, month);

  let results;
  if (month) {
    results = await Cost.find({
      $expr: {
        $and: [
          {
            $eq: [
              {
                $month: '$date'
              },
              month
            ]
          },
          {
            $eq: [
              {
                $year: '$date'
              },
              year
            ]
          }
        ]
      }
    });
  } else {
    results = await Cost.find({
      $expr: {
        $eq: [
          {
            $year: '$date'
          },
          year
        ]
      }
    });
  }

  console.log(results.length);
  res.status(StatusCodes.OK).send();
});

const server = app.listen(port, () => {
  console.log(`HTTP Server is running on port ${port}`);
});

['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(signal + ' signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server };
