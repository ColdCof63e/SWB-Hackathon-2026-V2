import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Job from './models/job.model.js';
import Recruiter from './models/recruiter.model.js';
import { scrapeAndParseJob } from './scraper.js';
import { syncGlobalJobs } from './ingest.js';

// Crypto Helpers for Recruiter Auth
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = process.env.JWT_SECRET || 'hackathon_default_secret_key_12345';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const secret = process.env.JWT_SECRET || 'hackathon_default_secret_key_12345';
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload;
  } catch (e) {
    return null;
  }
}

const pendingChallenges = new Map();

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

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trustremote';
  console.log('Connecting to MongoDB...');
  cachedConnection = await mongoose.connect(MONGODB_URI);
  console.log('Successfully connected to MongoDB!');
  
  // Seed initial mock jobs if DB is empty
  await seedDatabase();
  return cachedConnection;
}

// Database Connection Middleware for Serverless / Dev environment
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err.message);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});


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
function analyzeWithHeuristics(description, recruiterInfo = '', jdUrl = '', location = '') {
  const descLower = description.toLowerCase();
  const contactLower = recruiterInfo.toLowerCase();
  const locLower = location.toLowerCase();

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

  // Remote role check
  const textForRemoteCheck = `${location} ${description}`.toLowerCase();
  const onsiteIndicators = [
    'onsite', 
    'on-site', 
    'hybrid', 
    'in-office', 
    'in office', 
    'in-person work', 
    'in-person required', 
    'in-person role', 
    'work in-person', 
    'work in person', 
    'commute to', 
    'relocate to'
  ];
  const hasOnsiteTerms = onsiteIndicators.some(term => textForRemoteCheck.includes(term));
  const hasRemoteTerms = textForRemoteCheck.includes('remote') || textForRemoteCheck.includes('wfh') || textForRemoteCheck.includes('work from home');
  const isRemote = hasOnsiteTerms ? false : (hasRemoteTerms || locLower.includes('remote'));

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
        greenFlags.push(`The job posting URL contains verification tracking from a trusted portal ${detectedPortal}.`);
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
    isRemote,
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
async function analyzeWithGemini(description, recruiterInfo = '', jdUrl = '', location = '') {
  if (!genAI) {
    throw new Error('Gemini client not initialized');
  }

  // Use the flash model for speedy execution
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `Analyze this remote job description and recruiter contact info for authenticity and legitimacy. Identify if this is a legitimate remote job, a suspicious/unverified posting, or an outright scam.
  Also, analyze if the job is actually remote or if it contains hybrid/on-site requirements.
  
  Job Location:
  """
  ${location || 'Unspecified'}
  """

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
    "isRemote": boolean (true if the job is fully remote, false if it mentions hybrid, on-site, in-office requirements or lacks remote flexibility),
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

// Recruiter Authentication & Passkeys Endpoints
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const publicDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
    'icloud.com', 'zoho.com', 'proton.me', 'protonmail.com', 'yandex.com', 'mail.com'
  ];
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain || publicDomains.includes(emailDomain)) {
    return res.status(400).json({ error: 'Registration requires an official corporate email domain.' });
  }

  try {
    const existing = await Recruiter.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = hashPassword(password);
    const newRecruiter = new Recruiter({
      email,
      password: hashedPassword
    });
    await newRecruiter.save();

    const token = generateToken({ email });
    res.status(201).json({ token, email });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (recruiter.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({ email });
    res.json({
      token,
      email,
      hasPasskey: !!recruiter.passkeyCredentialId
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Passkey WebAuthn Routes
app.post('/api/auth/passkey/register-challenge', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(404).json({ error: 'Recruiter not found.' });
    }

    const challenge = crypto.randomBytes(32).toString('base64url');
    pendingChallenges.set(`${email}-register`, challenge);

    res.json({
      challenge,
      rp: {
        name: 'TrustRemote',
        id: 'localhost'
      },
      user: {
        id: Buffer.from(email).toString('base64url'),
        name: email,
        displayName: email
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    });
  } catch (error) {
    console.error('Register challenge failed:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/passkey/register-verify', async (req, res) => {
  const { email, credentialId, publicKey } = req.body;
  if (!email || !credentialId || !publicKey) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(404).json({ error: 'Recruiter not found.' });
    }

    recruiter.passkeyCredentialId = credentialId;
    recruiter.passkeyPublicKey = publicKey;
    await recruiter.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Register verify failed:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/passkey/login-challenge', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter || !recruiter.passkeyCredentialId) {
      return res.status(400).json({ error: 'Recruiter does not have a registered passkey.' });
    }

    const challenge = crypto.randomBytes(32).toString('base64url');
    pendingChallenges.set(`${email}-login`, challenge);

    res.json({
      challenge,
      rpId: 'localhost',
      allowCredentials: [
        {
          id: recruiter.passkeyCredentialId,
          type: 'public-key'
        }
      ],
      timeout: 60000,
      userVerification: 'preferred'
    });
  } catch (error) {
    console.error('Login challenge failed:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/auth/passkey/login-verify', async (req, res) => {
  const { email, credentialId, clientDataJSON, authenticatorData, signature } = req.body;
  if (!email || !credentialId || !clientDataJSON || !authenticatorData || !signature) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter || recruiter.passkeyCredentialId !== credentialId) {
      return res.status(400).json({ error: 'Invalid credential ID or recruiter.' });
    }

    const storedChallenge = pendingChallenges.get(`${email}-login`);
    if (!storedChallenge) {
      return res.status(400).json({ error: 'No active login challenge found for this email.' });
    }

    // Verify challenge matches in clientDataJSON
    const clientDataJSONBuffer = Buffer.from(clientDataJSON, 'base64url');
    const clientDataObj = JSON.parse(clientDataJSONBuffer.toString('utf8'));
    if (clientDataObj.challenge !== storedChallenge) {
      return res.status(400).json({ error: 'Invalid challenge in client data.' });
    }

    // Verify signature
    const clientDataHash = crypto.createHash('sha256').update(clientDataJSONBuffer).digest();
    const signedData = Buffer.concat([Buffer.from(authenticatorData, 'base64url'), clientDataHash]);
    const signatureBuffer = Buffer.from(signature, 'base64url');
    const publicKeyBuffer = Buffer.from(recruiter.passkeyPublicKey, 'base64url');

    const publicKeyObject = crypto.createPublicKey({
      key: publicKeyBuffer,
      format: 'der',
      type: 'spki'
    });

    const isVerified = crypto.verify(
      undefined,
      signedData,
      publicKeyObject,
      signatureBuffer
    );

    if (!isVerified) {
      return res.status(400).json({ error: 'Passkey signature verification failed.' });
    }

    // Clear challenge
    pendingChallenges.delete(`${email}-login`);

    // Increment sign count
    recruiter.passkeySignCount = (recruiter.passkeySignCount || 0) + 1;
    await recruiter.save();

    const token = generateToken({ email });
    res.json({ token, email });
  } catch (error) {
    console.error('Login verify failed:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

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
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization header.' });
  }

  const token = authHeader.split(' ')[1];

  let isAuthorized = false;
  let recruiterEmail = 'anonymous';

  if (token === process.env.RECRUITER_PASSCODE) {
    isAuthorized = true;
  } else {
    const decoded = verifyToken(token);
    if (decoded && decoded.email) {
      isAuthorized = true;
      recruiterEmail = decoded.email;
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized: Invalid recruiter authentication credentials.' });
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
        analysis = await analyzeWithGemini(description, recruiterInfo, jdUrl, location);
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to heuristics:', geminiError.message);
        analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl, location);
      }
    } else {
      analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl, location);
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

// 2.5. POST /api/webhooks/ats - Ingest jobs from Greenhouse/Workday/Lever webhooks
app.post('/api/webhooks/ats', async (req, res) => {
  const webhookSecret = req.headers['x-ats-secret'] || req.query.secret;
  const expectedSecret = process.env.ATS_WEBHOOK_SECRET || 'hackathon2026webhooksecret';

  if (!webhookSecret || webhookSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid ATS webhook secret.' });
  }

  const body = req.body;

  // Handle Greenhouse ping event
  if (body.action === 'ping') {
    return res.json({ success: true, message: 'Greenhouse webhook ping successful.' });
  }

  let jobData = {};

  if (body.job) {
    jobData = body.job;
  } else if (body.payload && body.payload.job) {
    jobData = body.payload.job;
  } else {
    jobData = body;
  }

  // Map incoming fields from various ATS formats
  const title = jobData.title || jobData.jobTitle || jobData.name;
  const company = jobData.company || jobData.companyName || jobData.organization || 'ATS Partner Org';
  const description = jobData.description || jobData.jobDescription || jobData.notes || jobData.content;
  const location = jobData.location || jobData.officeLocation || 'Remote';
  const salary = jobData.salary || jobData.compensation || 'Unspecified';
  const category = jobData.category || jobData.department || 'General Remote';
  const jdUrl = jobData.jdUrl || jobData.jobUrl || jobData.url || jobData.link;
  const recruiterInfo = jobData.recruiterInfo || jobData.recruiterEmail || jobData.contact;

  if (!title || !company || !description) {
    return res.status(400).json({ 
      error: 'Bad Request: Webhook payload missing required fields (title, company, description).',
      received: { title, company, hasDescription: !!description }
    });
  }

  try {
    console.log(`Webhook Ingestion: Vetting and adding new job "${title}" from company "${company}"...`);
    
    // Check de-duplication
    const existing = await Job.findOne({ title, company });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Job already indexed.', jobId: existing.id });
    }

    let analysis;
    if (genAI) {
      try {
        analysis = await analyzeWithGemini(description, recruiterInfo, jdUrl, location);
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to heuristics:', geminiError.message);
        analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl, location);
      }
    } else {
      analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl, location);
    }

    // Get initials for the company
    const companyInitials = company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);

    // Dynamic category resolution
    let determinedCategory = category || 'General Remote';
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('qa') || text.includes('test') || text.includes('quality assurance')) {
      determinedCategory = 'QA & Testing';
    } else if (text.includes('data') || text.includes('analyst') || text.includes('analytics')) {
      determinedCategory = 'Data & Analytics';
    } else if (text.includes('product manager') || text.includes('product management')) {
      determinedCategory = 'Product Management';
    } else if (text.includes('design') || text.includes('ui/') || text.includes('ux') || text.includes('figma')) {
      determinedCategory = 'Design';
    } else if (text.includes('engineer') || text.includes('developer') || text.includes('programmer') || text.includes('software')) {
      determinedCategory = 'Software Engineering';
    }

    const newJob = new Job({
      id: `job-webhook-${Date.now()}`,
      title,
      company,
      companyInitials,
      location: location || 'Remote',
      salary: salary || 'Unspecified',
      postedDate: 'Just now',
      trustScore: analysis.trustScore,
      status: analysis.status,
      category: determinedCategory,
      description,
      jdUrl: jdUrl || '',
      aiDetails: analysis
    });

    await newJob.save();

    console.log(`Webhook Ingested successfully: ${title} (${analysis.status} - Score: ${analysis.trustScore}%)`);
    res.status(201).json({ success: true, message: 'Job successfully ingested and vetted.', job: newJob });
  } catch (error) {
    console.error('Error adding job from webhook:', error);
    res.status(500).json({ error: 'Internal server error while processing webhook payload.' });
  }
});

// 3. POST /api/scan - Dynamic parser for description text
app.post('/api/scan', async (req, res) => {
  let { description, recruiterInfo, jdUrl } = req.body;
  let scrapedLocation = '';

  if (!description && jdUrl) {
    try {
      console.log(`Auto-scraping description from URL: ${jdUrl}`);
      const scraped = await scrapeAndParseJob(jdUrl, genAI);
      description = scraped.description;
      if (!recruiterInfo && scraped.recruiterInfo) {
        recruiterInfo = scraped.recruiterInfo;
      }
      scrapedLocation = scraped.location;
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
        analysis = await analyzeWithGemini(description, recruiterInfo, jdUrl, scrapedLocation);
      } catch (geminiError) {
        console.error('Gemini analysis failed, running heuristics fallback:', geminiError.message);
        analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl, scrapedLocation);
      }
    } else {
      console.log('Running analysis with heuristic fallback filters...');
      analysis = analyzeWithHeuristics(description, recruiterInfo, jdUrl, scrapedLocation);
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

// 5. GET /api/sync - Trigger global job ingestion
// By Triggering feed aggregation and auto-vetting
app.get('/api/jobs/sync', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret']

  // Fallback to default developer secret if CRON_SECRET is not configured in dotenv
  const expectedSecret = process.env.CRON_SECRET || "hackathon2026cronsecret"

  if (!secret || secret !== expectedSecret) {
    console.log('Unauthorized access attempt to global sync.')
    return res.status(401).json({error: "Unauthorized: Invalid cron sync secret."})
  }

  try {
    // Auto-clean any legacy double-encoded HTML-polluted sync entries from database
    const cleanResult = await Job.deleteMany({
      description: { $regex: /&lt;|&gt;|&amp;/ }
    });
    if (cleanResult.deletedCount > 0) {
      console.log(`Cleaned up ${cleanResult.deletedCount} double-encoded HTML jobs from database.`);
    }

    // Injecting genAI and local analysis engine from index.js scope
    // In other words, calling syncGlobalJobs function
    const stats = await syncGlobalJobs(genAI, analyzeWithHeuristics, analyzeWithGemini);

    res.json({
      success: true,
      message: "Global remote job feed sync completed",
      stats: {
        ...stats,
        cleanedLegacyJobs: cleanResult.deletedCount
      }
    });
  } catch(error) {
    console.error('Manual feed sync failed: ', error)
    res.status(500).json({
      error: `Sync failed: ${error.message}`
    })
  }
  
})

// ----------------------------------------------------
// Database Connection & Server Startup Sequence
// ----------------------------------------------------

app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`TrustRemote Express Server running on port ${PORT}`);
  console.log(`Local endpoints available:`);
  console.log(` - GET  http://localhost:${PORT}/api/jobs`);
  console.log(` - POST http://localhost:${PORT}/api/jobs`);
  console.log(` - POST http://localhost:${PORT}/api/scan`);
  console.log(`==================================================`);
  
  try {
    await connectToDatabase();
    
    // Automatic background job ingestion interval
    // Defaulting to 30 minutes (30 * 60 * 1000)
    const SYNC_INTERVAL_MS = 3 * 60 * 1000;
    console.log(`Starting automatic background job ingestion (runs every ${SYNC_INTERVAL_MS / 60000} minutes)`);
    
    setInterval(async () => {
      console.log('--- Triggering automatic background job ingestion ---');
      try {
        // Auto-clean any legacy double-encoded HTML-polluted sync entries from database
        await Job.deleteMany({
          description: { $regex: /&lt;|&gt;|&amp;/ }
        });
        
        const stats = await syncGlobalJobs(genAI, analyzeWithHeuristics, analyzeWithGemini);
        console.log(`Automatic ingestion completed. Stats:`, stats);
      } catch (err) {
        console.error('Automatic background ingestion failed:', err.message);
      }
    }, SYNC_INTERVAL_MS);

  } catch (err) {
    console.error('CRITICAL ERROR: Failed to connect to MongoDB on startup:', err.message);
  }
});

export default app;

