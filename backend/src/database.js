const mongoose = require('mongoose');

if (process.env.NODE_ENV !== 'test') {
  // Immediate start a connection with the DB, in case we are in production mode. (Not in unit tests environment)
  const mongoUser = process.env.MONGO_USER;
  const mongoPassword = process.env.MONGO_PASSWORD;
  const connectionString = `mongodb+srv://${mongoUser}:${mongoPassword}@async-prog-mongodb.nqvs2.mongodb.net/cost_manager?retryWrites=true&w=majority`;
  mongoose.connect(connectionString);
}

// Collections definitions
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

module.exports = { User, Cost, CostsReports };

// Example json of costsAggregation:
// {
//   2022: {
//     1: {
//       food: 35
//     },
//     2: {},
//     4: {
//       electric: 404
//     }
//   }
// }
//
