import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Job from './models/job.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function clean() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustremote';
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // Find all jobs that have HTML entities in their description
  console.log('Finding jobs with raw HTML entities in description...');
  const jobsToClean = await Job.find({
    description: { $regex: /&lt;|&gt;|&amp;/ }
  });

  console.log(`Found ${jobsToClean.length} jobs with HTML entities.`);
  
  if (jobsToClean.length > 0) {
    const ids = jobsToClean.map(j => j._id);
    const deleteRes = await Job.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${deleteRes.deletedCount} HTML-polluted jobs from database.`);
  } else {
    console.log('No HTML-polluted jobs found.');
  }

  await mongoose.disconnect();
  console.log('Disconnected.');
}

clean().catch(err => {
  console.error('Clean failed:', err);
  process.exit(1);
});
