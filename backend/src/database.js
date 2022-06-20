const mongoose = require('mongoose');

if (process.env.NODE_ENV !== 'test') {
  const mongo_user = process.env.MONGO_USER;
  const mongo_password = process.env.MONGO_PASSWORD;
  const connection_string = `mongodb+srv://${mongo_user}:${mongo_password}@async-prog-mongodb.nqvs2.mongodb.net/cost_manager?retryWrites=true&w=majority`;
  mongoose.connect(connection_string);
}

const User = mongoose.model('User', {
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  birth_date: { type: Date, required: true },
  martial_status: { type: String, required: true }
});

const Cost = mongoose.model('Cost', {
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: false, default: Date.now },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true }
});

const CostsReports = mongoose.model('CostsReports', {
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  costs_aggregation: { type: mongoose.Schema.Types.Mixed, default: {}, required: true }
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
