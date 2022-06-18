const swaggerAutogen = require('swagger-autogen')();
const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/server.js'];

const doc = {
  info: {
    version: "1.0.0",
    title: "Costs manager API",
    description: "RESTful API service for costs management"
  },
  host: "http://ec2-54-221-33-134.compute-1.amazonaws.com:3000"
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./src/server.js')
});