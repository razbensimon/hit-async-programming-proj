const request = require('supertest');
const { app, server } = require('../server');
const { StatusCodes } = require('http-status-codes');

describe('Cost', () => {
  it('should create a new cost item', async () => {
    // arrange
    const costItem = {
      sum: 57,
      category: 'food',
      description: 'Schawarma'
    };

    // act
    const res = await request(app).post('/api/costs').send(costItem);

    // assert
    expect(res.statusCode).toEqual(StatusCodes.CREATED);
  });
});

afterAll(() => {
  server.close();
});
