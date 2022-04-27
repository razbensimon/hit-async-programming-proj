const request = require('supertest');
const { app, server } = require('../server');
const { StatusCodes } = require('http-status-codes');

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
});

describe('Cost', () => {
  it('Should create a new cost item', async () => {
    // arrange
    const costItem = {
      price: 57,
      category: 'food',
      description: 'Schawarma'
    };

    // act
    const res = await request(app).post('/api/costs').send(costItem);

    // assert
    expect(res.statusCode).toEqual(StatusCodes.CREATED);
  });
});

describe('Report', () => {
  it('Should get costs report for user in specific month and year', async () => {
    // arrange
    const reportDetails = {
      user_id: 'TempUserID',
      month: '1',
      year: '1970'
    };

    // act
    const res = await request(app).get('/api/report').send(reportDetails);

    // assert
    expect(res.statusCode).toEqual(StatusCodes.OK);
  });
});

afterAll(() => {
  server.close();
});
