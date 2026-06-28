const mongoose = require('mongoose');
const LiveAlert = require('../src/modules/liveAlerts/liveAlert.model');
const env = require('../src/config/env');

async function search() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");

  const alerts = await LiveAlert.find({
    $or: [
      { title: /SBI/i },
      { detailsText: /SBI/i },
      { title: /PO/i },
      { detailsText: /PO/i }
    ]
  }).select('title boardName lastDate postDate sourceUrl officialApplyUrl state status');

  console.log("Found LiveAlert matches count:", alerts.length);
  alerts.forEach(a => {
    console.log(`- Title: "${a.title}"\n  Board: "${a.boardName}"\n  Last Date: "${a.lastDate}"\n  Post Date: "${a.postDate}"\n  Status: "${a.status}"\n  Source URL: "${a.sourceUrl}"\n`);
  });

  await mongoose.disconnect();
}

search().catch(console.error);
