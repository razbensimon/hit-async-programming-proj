/*
Team manager:
Raz Ben Simon

Team members:
Raz Ben Simon, 312489008, razbensimon2@gmail.com
Lior Yakobov,  315874610, yakobov.lior@gmail.com
Or Gelkop,     206895336, or.gelkop123@gmail.com

YouTube link - https://www.youtube.com/watch?v=bUg9kmXtZKw
 */

const express = require('express');
const cors = require('cors');
const Ajv = require('ajv');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger_output.json');
const { StatusCodes } = require('http-status-codes');
const { User, Cost, CostsReports } = require('./database');

const app = express();
const port = 3000;

// enable CORS
app.use(cors());

// Support json body format
app.use(express.json());

// support Swagger's API UI at /docs route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// GENERAL NOTE:
// In all three APIs, we validated mongoose's schema ValidationError.
// So we return BAD_REQUEST in case of bad user request
// In case of unknown error, we return INTERNAL_SERVER_ERROR as expected from good api.

/**
 * POST '/api/users'
 * Create new user record
 * @param {string} firstName - first name of the user
 * @param {string} lastName- last name of the user
 * @param {string} martialStatus - of the user
 * @param {Date} birthDate - birthdate of the user
 * @return {string} user's ID
 */
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

/**
 * POST '/api/costs'
 * Create new cost item record
 * @param {string} userId - attached user to this item
 * @param {Date} [date] - time signature of the purchase
 * @param {number} price - money amount
 * @param {string} description - name of the item
 * @param {string} category - related category of the item
 */
app.post('/api/costs', async (req, res) => {
  const { userId, date, price, description } = req.body;
  const category = req.body.category?.toLowerCase();

  // 1. Validate existence of user before attach cost item to him.
  try {
    await User.findById(userId).exec();
  } catch (err) {
    console.log('Failed creating cost item, user with ID', userId, 'does not exist');
    res.status(StatusCodes.NOT_FOUND).send();
    return;
  }

  try {
    // 2. create and save new cost item
    const cost = new Cost({
      userId,
      date,
      price,
      category,
      description
    });
    await cost.save();
    console.log('Cost item with ID', cost._id.toString(), 'created');

    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    // 3. Use 'Computed' pattern.
    // Do another simple Write, for saving complex Read queries later.
    // Increment user's report record for synced aggregation.
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

// static schema of the URL params allowed in `report` API handler
const reportSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string' },
    year: { type: 'string' },
    month: { type: 'string' }
  },
  required: ['userId', 'year']
};

// using Ajv library to enforce the schema validation
const ajv = new Ajv();
const validate = ajv.compile(reportSchema);

/**
 * GET '/api/report'
 * Get monthly/yearly aggregated costs report for a specific user.
 * @param {string} userId - requested user to calculate the report for
 * @param {number} year - filter data by year
 * @param {number} [month] - Optional filter by month
 * @return {Array<{ category: string, totalPrice: number }>} array of results aggregated by category
 */
app.get('/api/report', async (req, res) => {
  // 1. Validate url query params schema structure
  if (!validate(req.query)) {
    console.log(validate.errors);
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  let { userId, year, month } = req.query;

  try {
    // 2. validate userId is of type 'ObjectId'
    userId = mongoose.Types.ObjectId(userId);
  } catch (err) {
    console.error('userId is not valid');
    res.status(StatusCodes.BAD_REQUEST).send();
    return;
  }

  try {
    // 3. Fetch the pre-computed report record from db
    const filter = { userId: userId };
    const userReport = await CostsReports.findOne(filter)
      .select(month ? `costsAggregation.${year}.${month}` : `costsAggregation.${year}`) // projection
      .lean() // as simple json
      .exec();

    // 👆🏻 Example of `userReport` structure:
    // On month exists:     { 1: { food: 35 } }
    // On month NOT exists: { 2022: { 1: { food: 35 } } }

    // 4. Validate report existence
    if (!userReport) {
      console.log('User', userId, 'report does not exist');
      res.status(StatusCodes.NOT_FOUND).send();
      return;
    }

    // 5. Normalize 'monthly' report to be in 'yearly' report structure, for easier logic
    let yearReport;
    if (month) {
      yearReport = { [year]: userReport?.costsAggregation?.[year] ?? {} }; // wrapping in case on month
    } else {
      yearReport = userReport.costsAggregation ?? {};
    }
    const monthsReports = Object.entries(yearReport[year] ?? {});

    // 6. Sum up the results in temp dictionary. So in case of yearly report we sum 12 months.
    const tempDic = {};
    for (const [monthNumber, monthReport] of monthsReports) {
      for (const [category, monthlyAggregatedPrice] of Object.entries(monthReport)) {
        if (tempDic[category]) {
          tempDic[category] += monthlyAggregatedPrice;
        } else {
          tempDic[category] = monthlyAggregatedPrice;
        }
      }
    }

    // 7. Transformation to Array for pretty API results:
    const results = Object.entries(tempDic).map(kvp => {
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

// Start the api server
const server = app.listen(port, () => {
  console.log(`HTTP Server is running on port ${port}`);
});

// Listen and log on process signals, gracefully shutdown the server
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
