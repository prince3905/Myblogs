const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GlobalJob = require('../src/modules/globalJobs/globalJob.model');
const { fetchAngloGovJobs } = require('../src/modules/globalJobs/providers/anglo.provider');

async function seedPhase2() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Fetching Phase 2 Anglo jobs (USA, UK, Canada, Australia)...');
  const jobs = await fetchAngloGovJobs();
  let added = 0;
  
  for (const job of jobs) {
    const exists = await GlobalJob.findOne({
      $or: [
        { officialReferenceId: job.officialReferenceId },
        { title: job.title, countryCode: job.countryCode }
      ]
    });
    if (!exists) {
      await GlobalJob.create(job);
      console.log(`Inserted: [${job.countryFlag} ${job.countryName}] ${job.title.slice(0, 55)}`);
      added++;
    }
  }
  
  console.log(`\nTotal Phase 2 Anglo Jobs added: ${added}`);
  const countsByCountry = await GlobalJob.aggregate([
    { $group: { _id: '$countryName', count: { $sum: 1 }, flag: { $first: '$countryFlag' } } }
  ]);
  console.log('\nCurrent Global Jobs Breakdown in DB:', JSON.stringify(countsByCountry, null, 2));
  process.exit(0);
}

seedPhase2().catch(err => {
  console.error(err);
  process.exit(1);
});
