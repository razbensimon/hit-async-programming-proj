const request = require('supertest');
const { app } = require('../server');

describe('Post Endpoints', () => {
  it('should create a new post', async () => {
    const res = await request(app).post('/api/costs').send({
      userId: 1,
      title: 'test is cool'
    });
    expect(res.statusCode).toEqual(201);
  });
});
