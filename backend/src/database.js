const mongoose = require('mongoose');

if (process.env.NODE_ENV !== 'test') {
  const mongoUser = process.env.MONGO_USER;
  const mongoPassword = process.env.MONGO_PASSWORD;
  const connectionString = `mongodb+srv://${mongoUser}:${mongoPassword}@async-prog-mongodb.nqvs2.mongodb.net/cost_manager?retryWrites=true&w=majority`;
  mongoose.connect(connectionString);
}

const User = mongoose.model('User', {
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  martialStatus: { type: String, required: true }
});

const Cost = mongoose.model('Cost', {
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: false, default: Date.now },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true }
});

const CostsReports = mongoose.model('CostsReports', {
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  costsAggregation: { type: mongoose.Schema.Types.Mixed, default: {}, required: true }
});

// const costsAggregationExample = {
//   2022: {
//     1: {
//       food: 35
//     },
//     2: {},
//     4: {
//       electric: 404
//     }
//   }
// };
//

module.exports = { User, Cost, CostsReports };
