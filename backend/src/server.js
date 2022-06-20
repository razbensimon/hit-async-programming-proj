const express = require('express');
const Ajv = require('ajv');
const { StatusCodes } = require('http-status-codes');
const { User, Cost, CostsReports } = require('./database');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');
const app = express();
const port = 3000;

const allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

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
    let userId = user._id.toString();
    console.log('User with ID', userId, 'created');

    await new CostsReports({
      user_id: userId,
      costs_aggregation: {}
    }).save();

    res.status(StatusCodes.CREATED).send(userId);
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
  const { user_id, date, price, description } = req.body;
  let category = req.body.category.toLowerCase();

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

    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    const options = { upsert: true };
    const conditions = { user_id };
    const update = {
      $inc: {
        [`costs_aggregation.${year}.${month}.${category}`]: parseInt(price)
      }
    };
    await CostsReports.update(conditions, update, options).exec();

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
    // validate user id structure
    user_id = mongoose.Types.ObjectId(user_id);
  } catch (err) {
    console.error('user_id is not valid');
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  try {
    let matchQuery = { user_id: user_id };
    let userReport = await CostsReports.findOne(matchQuery)
      .select(month ? `costs_aggregation.${year}.${month}` : `costs_aggregation.${year}`)
      .lean() // as simple json
      .exec();

    // { 1: { food: 35 } }

    let root;
    if (month) {
      root = { [year]: userReport.costs_aggregation[year] };
    } else {
      root = userReport.costs_aggregation;
    }
    const rootEntries = Object.entries(root[year]);
    console.log(root[year]);
    console.log(rootEntries);

    const resultDic = {};
    for (const [month, report] of rootEntries) {
      for (const [category, monthlyPrice] of Object.entries(report)) {
        if (resultDic[category]) {
          resultDic[category] += monthlyPrice;
        } else {
          resultDic[category] = monthlyPrice;
        }
      }
    }

    // ui api:
    const results = Object.entries(resultDic).map(kvp => {
      return { category: kvp[0], totalPrice: kvp[1] };
    });

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
