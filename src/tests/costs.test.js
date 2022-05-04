const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const dbHandler = require('./memory-db-util');
const { app, server } = require('../server');
const { User } = require('../database');

async function prepareDbWithData() {
  const user = new User({
    first_name: 'mock',
    last_name: 'mock',
    birthday: new Date(),
    martial_status: 'mock'
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
    it('Should create a new user item', async () => {
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
    it('Should not create cost item fo unknown user', async () => {
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

    it('Should create a new cost item', async () => {
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

    it('Should not create cost item on invalid schema', async () => {
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

    it('should get costs report for user in specific month and year', async () => {
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
  });
});
