const mongoose = require('mongoose');
const LiveAlert = require('./src/modules/liveAlerts/liveAlert.model');
const env = require('./src/config/env');

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log("DB connected");

  // Get total count
  const total = await LiveAlert.countDocuments();
  console.log("Total LiveAlerts:", total);

  // Group by date
  const agg = await LiveAlert.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  console.log("Creation dates grouping:");
  console.log(agg);

  // Group by parsedPostDate
  const agg2 = await LiveAlert.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$parsedPostDate" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  console.log("Parsed post dates grouping:");
  console.log(agg2.slice(0, 20));

  await mongoose.disconnect();
}

run().catch(console.error);
