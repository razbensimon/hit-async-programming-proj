const request = require('supertest');
const { app, server } = require('../server');

describe('Cost', () => {
  it('should create a new post', async () => {
    // arrange

    // act
    const res = await request(app).post('/api/costs').send({
      userId: 1,
      title: 'test is cool'
    });

    // assert
    expect(res.statusCode).toEqual(201);
  });
});

afterAll(() => {
  server.close();
});
