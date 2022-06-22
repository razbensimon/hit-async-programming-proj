/*
Team manager:
Raz Ben Simon

Team members:
Raz Ben Simon, 312489008, razbensimon2@gmail.com
Lior Yakobov, 315874610, yakobov.lior@gmail.com
Or Gelkop, 206895336, or.gelkop123@gmail.com

YouTube link - https://www.youtube.com/watch?v=bUg9kmXtZKw
 */


const express = require('express');
const cors = require('cors');
const Ajv = require('ajv');
const { StatusCodes } = require('http-status-codes');
const { User, Cost, CostsReports } = require('./database');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.post('/api/users', async (req, res) => {
  const { firstName, lastName, martialStatus, birthDate } = req.body;
  const user = new User({
    firstName,
    lastName,
    martialStatus,
    birthDate
  });

  try {
    await user.save();
    let userId = user._id.toString();
    console.log('User with ID', userId, 'created');

    await new CostsReports({
      userId: userId,
      costsAggregation: {}
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
  const { userId, date, price, description } = req.body;
  let category = req.body.category.toLowerCase();

  try {
    await User.findById(userId).exec();
  } catch (err) {
    console.log('Failed creating cost item, user with ID', userId, 'does not exist');
    res.status(StatusCodes.NOT_FOUND).send();
    return;
  }

  const cost = new Cost({
    userId,
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
    const conditions = { userId };
    const update = {
      $inc: {
        [`costsAggregation.${year}.${month}.${category}`]: parseInt(price)
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
    userId: { type: 'string' },
    year: { type: 'string' },
    month: { type: 'string' }
  },
  required: ['userId', 'year']
};

const ajv = new Ajv();
const validate = ajv.compile(reportSchema);

app.get('/api/report', async (req, res) => {
  if (!validate(req.query)) {
    console.log(validate.errors);
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  let { userId, year, month } = req.query;

  try {
    // validate user id structure
    userId = mongoose.Types.ObjectId(userId);
  } catch (err) {
    console.error('userId is not valid');
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  try {
    let matchQuery = { userId: userId };
    let userReport = await CostsReports.findOne(matchQuery)
      .select(month ? `costsAggregation.${year}.${month}` : `costsAggregation.${year}`)
      .lean() // as simple json
      .exec();

    // Example of date results 👆🏻:
    // On month exists: { 1: { food: 35 } }
    // On month NOT exists: { 2022: { 1: { food: 35 } } }

    let root;
    if (month) {
      root = { [year]: userReport.costsAggregation[year] };
    } else {
      root = userReport.costsAggregation;
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
