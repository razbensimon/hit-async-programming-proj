const express = require('express');
const Ajv = require('ajv');
const { StatusCodes } = require('http-status-codes');
const { User, Cost } = require('./database');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');
const app = express();
const port = 3000;

const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(allowCrossDomain);
app.use(express.json());

app.post('/api/users', async (req, res) => {
  const { first_name, last_name, martial_status, birth_date } = req.body;
  const user = new User({
    first_name,
    last_name,
    birth_date,
    martial_status
  });

  try {
    await user.save();
    console.log('User with ID', user._id.toString(), 'created');
    res.status(StatusCodes.CREATED).send(user._id.toString());
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
  const { user_id, date, price, category, description } = req.body;

  try {
    await User.findById(user_id).exec();
  } catch (err) {
    console.log('Failed creating cost item, user with ID', user_id, 'does not exist');
    res.status(StatusCodes.NOT_FOUND).send();
    return;
  }

  const cost = new Cost({
    user_id,
    date,
    price,
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
  if (!validate(req.query)) {
    console.log(validate.errors);
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  let { user_id, year, month } = req.query;

  try {
    user_id = mongoose.Types.ObjectId(user_id);
  } catch (err) {
    console.error('user_id is not valid');
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  let matchQuery = {
    user_id: user_id,
    year: Number(year)
  };

  if (month) {
    matchQuery.month = Number(month);
  }

  try {
    let results = await Cost.aggregate([
      {
        $addFields: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        }
      },
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalPrice: { $sum: '$price' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          totalPrice: 1
        }
      },
      {
        $sort: {
          totalPrice: -1
        }
      }
    ]);
    res.status(StatusCodes.OK).json(results);
  } catch (err) {
    console.error(err);
    if (err?.name === 'ValidationError') {
      res.status(StatusCodes.BAD_REQUEST).send();
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  }
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
