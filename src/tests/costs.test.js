const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const dbHandler = require('./memory-db-util');
const { app, server } = require('../server');
const { User, Cost } = require('../database');

async function prepareDbWithData(costItems) {
  const user = new User({
    first_name: 'mock',
    last_name: 'mock',
    birthday: new Date(),
    martial_status: 'mock'
  });
  await user.save();

  if (costItems) {
    const costPromises = costItems.map(item => {
      const dbItem = new Cost({
        ...item,
        user_id: user._id
      });
      return dbItem.save();
    });

    await Promise.all(costPromises);
  }

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
        first_name: 'Israel',
        last_name: 'Israeli',
        birthday: '1/1/1970',
        martial_status: 'Single'
      };

      // act
      const res = await request(app).post('/api/users').send(userItem);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.CREATED);
    });

    it('should not create user on invalid schema', async () => {
      // arrange
      const userItem = {
        first_name: 123,
        last_name: 'Israeli'
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
        user_id: 'no user'
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
        user_id: user._id
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
      ${{ user_id: 'TempUserID', month: '1' }}
      ${{ user_id: 'TempUserID', year: '1970', month: '1', extra: '1' }}
      ${{ user_id: 'TempUserID', year: 1970, month: 1 }}
    `('should fail on bad schema query sent ($badQuery)', async ({ badQuery }) => {
      // act
      const res = await request(app).get('/api/report').query(badQuery);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });

    it('should get empty costs report for user without items, in specific month and year', async () => {
      // arrange
      const { user } = await prepareDbWithData();
      const reportDetailsQuery = {
        user_id: user._id.toString(),
        month: '1',
        year: '1970'
      };

      // act
      const res = await request(app).get('/api/report').query(reportDetailsQuery);

      // assert
      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toEqual([]);
    });

    it('should get costs report for user with items, in specific month and year', async () => {
      // arrange
      const costItems = [
        {
          date: new Date('1970-01-01T00:00:00Z'),
          price: 100,
          category: 'clothing',
          description: 'shirt'
        },
        {
          date: new Date('1970-01-01T00:00:00Z'),
          price: 200,
          category: 'clothing',
          description: 'pants'
        },
        {
          date: new Date('1970-01-01T00:00:00Z'),
          price: 2000,
          category: 'electronics',
          description: 'tablet'
        }
      ];
      const { user } = await prepareDbWithData(costItems);
      const reportDetailsQuery = {
        user_id: user._id.toString(),
        month: '1',
        year: '1970'
      };

      // act
      const res = await request(app).get('/api/report').query(reportDetailsQuery);

      // assert
      const expectedResult = [
        {
          count: 1,
          totalPrice: 2000,
          category: 'electronics'
        },
        {
          count: 2,
          totalPrice: 300,
          category: 'clothing'
        }
      ];
      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toEqual(expectedResult);
    });
  });
});
