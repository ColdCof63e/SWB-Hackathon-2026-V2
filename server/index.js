import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import Job from './models/job.model.js';
import { scrapeAndParseJob } from './scraper.js';

// Resolve Paths (ES Modules helper)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'jobs.json');

// Configure Environment
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Gemini API Client
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  console.log('Initializing Google Gemini API Client...');
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not defined. Server will use rule-based fallback heuristics.');
}

// ----------------------------------------------------
// Core Heuristic Fallback Analysis Engine
// ----------------------------------------------------
function analyzeWithHeuristics(description, recruiterInfo = '', jdUrl = '') {
  const descLower = description.toLowerCase();
  const contactLower = recruiterInfo.toLowerCase();

  let score = 100;
  const redFlags = [];
  const greenFlags = [];
  let domainAge = 'Unknown (No URL provided)';
  let recruiterEmailStatus = 'Not provided';
  let interviewChannel = 'Not specified';
  let equipmentPolicy = 'Not specified';
  let marketMatch = 'Aligned';
  let jdDomain = '';
  let detectedATS = '';
  let detectedPortal = '';
  // 1. Recruiter Email check
  if (recruiterInfo) {
    if (contactLower.includes('gmail.com') || contactLower.includes('yahoo.com') || contactLower.includes('outlook.com') || contactLower.includes('hotmail.com')) {
      score -= 15;
      redFlags.push('Recruiter uses a free public email address (Gmail/Yahoo/Outlook) rather than an official company domain.');
      recruiterEmailStatus = 'Flagged (Public email)';
    } else {
      greenFlags.push('Recruiter contact domain matches potential enterprise email structures.');
      recruiterEmailStatus = 'Enterprise domain detected';
    }
  }

  // 2. Chat App redirection checks
  if (descLower.includes('telegram') || descLower.includes('signal app') || descLower.includes('@telegram') || descLower.includes('telegram app')) {
    score -= 35;
    redFlags.push('Interview process requests using Telegram, a highly anonymous, encrypted messaging app frequently used by recruiters spoofing positions.');
    interviewChannel = 'High Risk (Telegram Text Interview)';
  } else if (descLower.includes('whatsapp') || descLower.includes('whatsapp app')) {
    score -= 20;
    redFlags.push('Recruiter requests using WhatsApp, which bypasses formal corporate applicant tracking networks.');
    interviewChannel = 'Suspicious (WhatsApp Chat)';
  } else if (descLower.includes('zoom') || descLower.includes('google meet') || descLower.includes('teams') || descLower.includes('webex')) {
    greenFlags.push('Specifies standard video interview platforms (Zoom, Google Meet, or Microsoft Teams).');
    interviewChannel = 'Standard Video Interview';
  } else {
    score -= 10;
    redFlags.push('No formal video conference interviews or live systems are mentioned.');
    interviewChannel = 'Unspecified';
  }

  // 3. Equipment/Check Fraud checks
  if (descLower.includes('send check') || descLower.includes('send you a check') || descLower.includes('certified check') || descLower.includes('buy equipment') || descLower.includes('purchase equipment') || descLower.includes('laptop and printer') || descLower.includes('buy laptop')) {
    score -= 40;
    redFlags.push('Classic check-cashing scheme detected: requests depositing a check from the company to buy equipment from a "trusted vendor".');
    equipmentPolicy = 'High Risk (Certified Check Equipment Policy)';
  } else if (descLower.includes('provide') || descLower.includes('ship') || descLower.includes('equipment is provided')) {
    greenFlags.push('Mentions direct company provision/shipping of hardware gear.');
    equipmentPolicy = 'Standard direct provision';
  }

  // 4. Compensation Calibration
  if ((descLower.includes('$40') || descLower.includes('$45') || descLower.includes('$48') || descLower.includes('$50') || descLower.includes('$60')) && 
      (descLower.includes('data entry') || descLower.includes('assistant') || descLower.includes('clerk') || descLower.includes('no experience'))) {
    score -= 20;
    redFlags.push('Unrealistic salary: Entry-level clerical or administrative work offering $40-$60/hour is highly anomalous and indicates a bait-and-switch.');
    marketMatch = 'Highly anomalous (Unreasonably high pay for role requirements)';
  }

  // 5. Benefits indicators
  if (descLower.includes('401k') || descLower.includes('medical') || descLower.includes('matching') || descLower.includes('benefits') || descLower.includes('insurance')) {
    greenFlags.push('Mentions standard corporate employee benefits (401k, health coverage).');
  }
  if (descLower.includes('github') || descLower.includes('typescript') || descLower.includes('figma')) {
    greenFlags.push('Mentions specific professional collaboration suites and technical stack parameters.');
  }

  // 6. Parse JD URL Hostname
  if (jdUrl) {
    try {
      const urlObj = new URL(jdUrl);
      jdDomain = urlObj.hostname.toLowerCase().replace('www.', '');
      const trustedDomains = {'rippling.com': 'Rippling ATS', 
                              'greenhouse.io': 'Greenhouse', 
                              'lever.co': 'Lever ATS', 
                              'workday.com': 'Workday ATS'};

      for(const[host, displayName] of Object.entries(trustedDomains)) {
        if(jdDomain === host || jdDomain.endsWith('.'+host)) {
          detectedATS = displayName;
          break;
        }
      }
      if (detectedATS) {
        score += 10;
        greenFlags.push(`Job Description hosted on a verified ${detectedATS} domain.`);
      }
    } catch (e) {
      redFlags.push('Invalid Job Posting URL format provided');
    }
  }

  // 7. Cross-reference Recruiter Email domain with JD URL Domain
  if (recruiterInfo && jdDomain) {
    const emailDomain = contactLower.split('@')[1];
    const isPublicEmail = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].some(d => emailDomain.includes(d));

    if (emailDomain && !isPublicEmail) {
      if (emailDomain !== jdDomain && !jdDomain.endsWith('.' + emailDomain) && !emailDomain.endsWith('.' + jdDomain)) {
        score -= 25;
        redFlags.push(`Identity Spoofing Risk: Recruiter email domain (@${emailDomain}) does not match the Job Posting website domain (${jdDomain})`);
      } else {
        greenFlags.push(`Recruiter email domain aligns with official job posting domain (${jdDomain}).`);
      }
    }
  }

  // 8. Cross-portal consistency
  if (jdUrl) {
    try {
      const urlObj = new URL(jdUrl);
      const queryPortals = {'linkedin': 'LinkedIn', 
                          'indeed': 'Indeed', 
                          'glassdoor': 'Glassdoor'};
      const jobSiteVal = urlObj.searchParams.get('jobSite');
      const utmSourceVal = urlObj.searchParams.get('utm_source');

      if(jobSiteVal && queryPortals[jobSiteVal.toLowerCase()]) {
        detectedPortal = queryPortals[jobSiteVal.toLowerCase()];
      } else if (utmSourceVal && queryPortals[utmSourceVal.toLowerCase()]) {
        detectedPortal = queryPortals[utmSourceVal.toLowerCase()]
      }
      if (detectedPortal) {
        score += 10;
        greenFlags.push(`The job posting URL contains
          verification tracking from a trusted portal ${detectedPortal}.`);
      }
    } catch (e) {
      redFlags.push('Invalid Job Posting URL format provided');
    }
  }

  // Bound Score
  score = Math.max(10, Math.min(100, score));

  let status = 'Verified';
  let overallVerdict = 'This job description shows standard professional qualities and lacks common remote job fraud indicators.';
  if (score < 50) {
    status = 'Scam';
    overallVerdict = 'Dangerous. Multiple scam patterns identified, including check-deposit fraud and anonymous chat redirection. DO NOT apply or share personal documentation.';
  } else if (score < 85) {
    status = 'Suspicious';
    overallVerdict = 'Caution advised. Some unverified credentials or generic communication methods are flagged. Validate the company\'s official website independently.';
  }

  if (recruiterInfo && !recruiterEmailStatus.includes('Flagged')) {
    domainAge = '3 years (Verified Resolve)';
  }

  const crossPortalParts = [];
  if (detectedPortal)
    crossPortalParts.push(detectedPortal);
  if (detectedATS)
    crossPortalParts.push(detectedATS);
  const crossPortalIndex = crossPortalParts.length > 0 ? crossPortalParts.join(', ') : 'None Detected';

  return {
    trustScore: score,
    status,
    overallVerdict,
    redFlags,
    greenFlags,
    metrics: {
      domainAge,
      recruiterEmailStatus,
      interviewChannel,
      equipmentPolicy,
      marketMatch,
      crossPortalIndex
    }
  };
}

// ----------------------------------------------------
// Gemini AI-Powered Analysis Engine
// ----------------------------------------------------
async function analyzeWithGemini(description, recruiterInfo = '', jdUrl = '') {
  if (!genAI) {
    throw new Error('Gemini client not initialized');
  }

  // Use the flash model for speedy execution
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `Analyze this remote job description and recruiter contact info for authenticity and legitimacy. Identify if this is a legitimate remote job, a suspicious/unverified posting, or an outright scam.
  
  Job Description:
  """
  ${description}
  """
  
  Recruiter Contact Info:
  """
  ${recruiterInfo || 'None provided'}
  """

  Job Posting URL:
  """
  ${jdUrl || 'None provided'}
  """
  
  Respond with a JSON object containing these exact fields:
  {
    "trustScore": number (integer between 0 and 100),
    "status": "Verified" | "Suspicious" | "Scam",
    "overallVerdict": string (2-3 sentences explaining the assessment details),
    "redFlags": [array of strings describing identified red flags, empty if none],
    "greenFlags": [array of strings describing identified legitimacy signals],
    "metrics": {
      "domainAge": string (e.g. "5 years" or "Unknown"),
      "recruiterEmailStatus": string (e.g. "Official company email" or "Generic Gmail account"),
      "interviewChannel": string (e.g. "Video call via Zoom" or "Telegram chat"),
      "equipmentPolicy": string (e.g. "Directly provided by company" or "Must deposit check to purchase"),
      "marketMatch": string (e.g. "Within normal industry rates" or "Highly anomalous high pay")
    }
  }`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return JSON.parse(responseText);
}

// ----------------------------------------------------
// Database Helpers (Local File Fallback Reader for Seeding)
// ----------------------------------------------------
function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed reading database file:', error);
    return [];
  }
}

// ----------------------------------------------------
// Database Seeding Logic
// ----------------------------------------------------
async function seedDatabase() {
  try {
    const count = await Job.countDocuments();
    if (count === 0) {
      console.log('MongoDB is empty. Seeding database with initial listings from jobs.json...');
      const initialJobs = readDatabase();
      if (initialJobs && initialJobs.length > 0) {
        await Job.insertMany(initialJobs);
        console.log(`Successfully seeded ${initialJobs.length} jobs into MongoDB.`);
      } else {
        console.log('No local jobs.json data found or file is empty.');
      }
    } else {
      console.log(`Database already has ${count} records. Skipping seeding.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// ----------------------------------------------------
// Express API Endpoints
// ----------------------------------------------------

// 1. GET /api/jobs - Fetch all listings
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Failed to retrieve jobs:', error);
    res.status(500).json({ error: 'Failed to retrieve job listings from database.' });
  }
});

// 2. POST /api/jobs - Submit a new job to the board (auto-vets with AI)
app.post('/api/jobs', async (req, res) => {

  // Authorization check
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({error: 'Unauthorized: Missing or malformed authorization header.'})
  }

  // Extracting passcode here
  const passcode = authHeader.split(' ')[1]

  // Validating agains server side .env variables
  if (passcode !== process.env.RECRUITER_PASSCODE) {
    return res.status(401).json({error: 'Unauthorized: Invalid recruiter authentication passcode.'})
  }

  const { title, company, location, salary, category, description, recruiterInfo, jdUrl } = req.body;

  if (!title || !company || !description) {
    return res.status(400).json({ error: 'Title, company, and description are required.' });
  }

  try {
    console.log(`Starting AI vetting for new posting at company "${company}"...`);
    let analysis;
    if (genAI) {
      try {
        analysis = await analyzeWithGemini(description, recruiterInfo, jdUrl);
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to heuristics:', geminiError.message);
        analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl);
      }
    } else {
      analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl);
    }

    // Get initials for the company
    const companyInitials = company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);

    const newJob = new Job({
      id: `job-${Date.now()}`,
      title,
      company,
      companyInitials,
      location: location || 'Remote',
      salary: salary || 'Unspecified',
      postedDate: 'Just now',
      trustScore: analysis.trustScore,
      status: analysis.status,
      category: category || 'General Remote',
      description,
      jdUrl,
      aiDetails: analysis
    });

    await newJob.save();

    console.log(`Successfully added job: ${title} (${analysis.status} - Score: ${analysis.trustScore}%)`);
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error adding job to database:', error);
    res.status(500).json({ error: 'Internal server error while processing listing.' });
  }
});

// 3. POST /api/scan - Dynamic parser for description text
app.post('/api/scan', async (req, res) => {
  let { description, recruiterInfo, jdUrl } = req.body;

  if (!description && jdUrl) {
    try {
      console.log(`Auto-scraping description from URL: ${jdUrl}`);
      const scraped = await scrapeAndParseJob(jdUrl, genAI);
      description = scraped.description;
      if (!recruiterInfo && scraped.recruiterInfo) {
        recruiterInfo = scraped.recruiterInfo;
      }
    } catch (scrapeErr) {
      console.error('Auto-scraping failed:', scrapeErr.message);
    }
  }

  if (!description) {
    return res.status(400).json({ error: 'Description text is required.' });
  }

  try {
    let analysis;
    if (genAI) {
      try {
        console.log('Running analysis with Google Gemini API...');
        analysis = await analyzeWithGemini(description, recruiterInfo, jdUrl);
      } catch (geminiError) {
        console.error('Gemini analysis failed, running heuristics fallback:', geminiError.message);
        analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl);
      }
    } else {
      console.log('Running analysis with heuristic fallback filters...');
      analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl);
    }

    res.json(analysis);
  } catch (error) {
    console.error('General scanner execution error:', error);
    res.status(500).json({ error: 'Failed to complete job safety scan.' });
  }
});

// 4. POST /api/scrape - Fetch and parse job details from a URL
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  try {
    const jobData = await scrapeAndParseJob(url, genAI);
    res.json(jobData);
  } catch (error) {
    console.error('Failed to scrape job URL:', error.message);
    res.status(500).json({ error: `Scraping failed: ${error.message}` });
  }
});

// ----------------------------------------------------
// Database Connection & Server Startup Sequence
// ----------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustremote';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB!');
    
    // Seed initial mock jobs if DB is empty
    await seedDatabase();
    
    // Start Express Listener after DB is ready
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`TrustRemote Express Server running on port ${PORT}`);
      console.log(`Local endpoints available:`);
      console.log(` - GET  http://localhost:${PORT}/api/jobs`);
      console.log(` - POST http://localhost:${PORT}/api/jobs`);
      console.log(` - POST http://localhost:${PORT}/api/scan`);
      console.log(`==================================================`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL ERROR: Failed to connect to MongoDB:', err.message);
    console.error('Please ensure MongoDB is running locally or check MONGODB_URI.');
    process.exit(1);
  });

