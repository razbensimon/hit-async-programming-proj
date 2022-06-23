const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const dbHandler = require('./memory-db-util');
const { app, server } = require('../server');
const { User, CostsReports } = require('../database');

async function prepareDbWithData() {
  // create dummy user
  const user = new User({
    firstName: 'mock',
    lastName: 'mock',
    birthDate: new Date(),
    martialStatus: 'mock'
  });
  await user.save();

  return {
    user
  };
}

describe('API Tests', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clearDatabase());
  afterAll(async () => await dbHandler.closeDatabase());
  afterAll(() => server.close());

  describe('User', () => {
    it('should create a new user item', async () => {
      // arrange
      const userItem = {
        firstName: 'Israel',
        lastName: 'Israeli',
        birthDate: '1/1/1970',
        martialStatus: 'Single'
      };

      // act
      const res = await request(app).post('/api/users').send(userItem);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.CREATED);
    });

    it('should not create user on invalid schema', async () => {
      // arrange
      const userItem = {
        firstName: 123,
        lastName: 'Israeli'
      };

      // act
      const res = await request(app).post('/api/users').send(userItem);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });

  describe('Cost', () => {
    it('should not create cost item fo unknown user', async () => {
      // arrange
      const costItem = {
        price: 57,
        category: 'food',
        description: 'Schawarma',
        date: new Date().toISOString(),
        userId: 'no user'
      };

      // act
      const res = await request(app).post('/api/costs').send(costItem);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    it('should create a new cost item', async () => {
      // arrange
      const { user } = await prepareDbWithData();
      const costItem = {
        price: 57,
        category: 'food',
        description: 'Schawarma',
        date: new Date().toISOString(),
        userId: user._id
      };

      // act
      const res = await request(app).post('/api/costs').send(costItem);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.CREATED);
    });

    it('should not create cost item on invalid schema', async () => {
      // arrange
      await prepareDbWithData();
      const costItem = {
        price: '57',
        description: 'Schawarma'
      };

      // act
      const res = await request(app).post('/api/costs').send(costItem);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });

  describe('Report', () => {
    it.each`
      badQuery
      ${{ year: '1970', month: '1' }}
      ${{ userId: 'TempUserID', month: '1' }}
      ${{ userId: 'TempUserID', year: '1970', month: '1', extra: '1' }}
      ${{ userId: 'TempUserID', year: 1970, month: 1 }}
    `('should fail on bad schema query sent ($badQuery)', async ({ badQuery }) => {
      // act
      const res = await request(app).get('/api/report').query(badQuery);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    it('should get empty costs report for user without any items (monthly)', async () => {
      // arrange
      const { user } = await prepareDbWithData();
      const costsReport = new CostsReports({
        userId: user._id.toString(),
        costsAggregation: {}
      });
      await costsReport.save();

      const reportDetailsQuery = {
        userId: user._id.toString(),
        month: '1',
        year: '1970'
      };

      // act
      const res = await request(app).get('/api/report').query(reportDetailsQuery);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toEqual([]);
    });

    it('should get empty costs report for user without any items (yearly)', async () => {
      // arrange
      const { user } = await prepareDbWithData();
      const costsReport = new CostsReports({
        userId: user._id.toString(),
        costsAggregation: {}
      });
      await costsReport.save();

      const reportDetailsQuery = {
        userId: user._id.toString(),
        year: '1970'
      };

      // act
      const res = await request(app).get('/api/report').query(reportDetailsQuery);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toEqual([]);
    });

    it('should get empty costs report for user WITHOUT items, in specific month and year', async () => {
      // arrange
      const { user } = await prepareDbWithData();
      const costsReport = new CostsReports({
        userId: user._id.toString(),
        costsAggregation: { 1970: { 2: { food: 100 } } }
      });
      await costsReport.save();

      const reportDetailsQuery = {
        userId: user._id.toString(),
        month: '1',
        year: '1970'
      };

      // act
      const res = await request(app).get('/api/report').query(reportDetailsQuery);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toEqual([]);
    });

    it('should get costs report for user WITH items, in specific month and year', async () => {
      // arrange
      const { user } = await prepareDbWithData();
      const costItems = [
        {
          userId: user._id.toString(),
          date: new Date('1970-01-01T00:00:00Z'),
          price: 100,
          category: 'clothing',
          description: 'shirt'
        },
        {
          userId: user._id.toString(),
          date: new Date('1970-01-01T00:00:00Z'),
          price: 200,
          category: 'clothing',
          description: 'pants'
        },
        {
          userId: user._id.toString(),
          date: new Date('1970-01-01T00:00:00Z'),
          price: 2000,
          category: 'electronics',
          description: 'tablet'
        }
      ];

      // fill data
      await Promise.all(
        costItems.map(async costItem => {
          await request(app).post('/api/costs').send(costItem);
        })
      );

      const reportDetailsQuery = {
        userId: user._id.toString(),
        month: '1',
        year: '1970'
      };

      // act
      const res = await request(app).get('/api/report').query(reportDetailsQuery);

      // assert
      const expectedResult = [
        {
          totalPrice: 2000,
          category: 'electronics'
        },
        {
          totalPrice: 300,
          category: 'clothing'
        }
      ];
      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body.length).toEqual(expectedResult.length);
      expect(res.body).toEqual(expect.arrayContaining(expectedResult));
    });
  });
});
