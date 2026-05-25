import crypto from 'crypto';
import Job from './models/job.model.js';

// Decodes XML/HTML entity codes to their string equivalents, handling double/nested encoding
function decodeHTMLEntities(text) {
  if (!text) return '';
  let prev;
  let decoded = text;
  let iterations = 0;
  do {
    prev = decoded;
    decoded = decoded
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    iterations++;
  } while (decoded !== prev && iterations < 4);
  return decoded;
}

// Simple category determination helper
function determineCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('qa') || text.includes('test') || text.includes('quality assurance')) return 'QA & Testing';
  if (text.includes('data') || text.includes('analyst') || text.includes('analytics')) return 'Data & Analytics';
  if (text.includes('product manager') || text.includes('product management')) return 'Product Management';
  if (text.includes('design') || text.includes('ui/') || text.includes('ux') || text.includes('figma')) return 'Design';
  return 'Software Engineering';
}

// Parses XML items using robust RegExp matching to avoid heavy external XML parsing dependencies
export function parseRSSFeed(xmlText) {
  const items = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
    const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/);
    const descriptionMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);

    if (titleMatch && linkMatch) {
      const rawTitle = titleMatch[1].trim();
      const link = linkMatch[1].trim();
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toUTCString();
      const rawDescription = descriptionMatch ? descriptionMatch[1].trim() : '';

      // We Work Remotely titles are formatted as: "Company: Job Title"
      let company = 'Remote Company';
      let title = rawTitle;
      
      if (rawTitle.includes(':')) {
        const parts = rawTitle.split(':');
        company = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }

      // Decode HTML entities on text fields
      const companyClean = decodeHTMLEntities(company);
      const titleClean = decodeHTMLEntities(title);
      const descriptionClean = decodeHTMLEntities(rawDescription);

      items.push({ company: companyClean, title: titleClean, link, pubDate, description: descriptionClean });
    }
  }

  return items;
}

// Global Ingestion & Auto-Vetting Pipeline Controller
export async function syncGlobalJobs(genAI, analyzeWithHeuristics, analyzeWithGemini) {
  const feeds = [
    { name: 'We Work Remotely - Programming', url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss', defaultCategory: 'Software Engineering' },
    { name: 'We Work Remotely - Design', url: 'https://weworkremotely.com/categories/remote-design-jobs.rss', defaultCategory: 'Design' },
    { name: 'We Work Remotely - Product', url: 'https://weworkremotely.com/categories/remote-product-jobs.rss', defaultCategory: 'Product Management' },
    { name: 'We Work Remotely - DevOps', url: 'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss', defaultCategory: 'Software Engineering' }
  ];

  let processedCount = 0;
  let addedCount = 0;
  let skippedCount = 0;
  const errors = [];
  let totalFound = 0;

  // Cap processing to 5 new jobs per execution to protect Google Gemini API quotas
  const maxNewJobsToProcess = 5;

  for (const feed of feeds) {
    if (addedCount >= maxNewJobsToProcess) {
      console.log(`Reached sync cap limit of ${maxNewJobsToProcess} new jobs. Stopping sync queue.`);
      break;
    }

    console.log(`Starting global remote sync from ${feed.name}...`);

    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        throw new Error(`Feed fetch returned status: ${res.status}`);
      }

      const xmlText = await res.text();
      const feedItems = parseRSSFeed(xmlText);
      totalFound += feedItems.length;

      console.log(`Found ${feedItems.length} jobs in ${feed.name} feed.`);

      for (const item of feedItems) {
        processedCount++;

        // Check if job is already indexed in MongoDB (De-duplication)
        const existing = await Job.findOne({ title: item.title, company: item.company });
        if (existing) {
          skippedCount++;
          continue;
        }

        console.log(`Ingesting new listing: "${item.title}" at "${item.company}"...`);

        try {
          // Strip HTML tags from feed-provided description
          const cleanedDescription = item.description
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (!cleanedDescription) {
            throw new Error('Description body was empty.');
          }

          // 1. Perform AI / Heuristics Safety Vetting directly on RSS description
          let analysis;
          if (genAI) {
            try {
              analysis = await analyzeWithGemini(cleanedDescription, '', item.link, 'Remote');
            } catch (geminiErr) {
              console.error('Gemini vetting failed, falling back to heuristics:', geminiErr.message);
              analysis = analyzeWithHeuristics(cleanedDescription, '', item.link, 'Remote');
            }
          } else {
            analysis = analyzeWithHeuristics(cleanedDescription, '', item.link, 'Remote');
          }

          // 2. Reject outright scams (score < 50) and hybrid/onsite roles
          if (analysis.trustScore < 50) {
            console.log(`Rejected listing: Trust score ${analysis.trustScore}% is too low (Scam threat).`);
            errors.push({ title: item.title, company: item.company, link: item.link, reason: `Rejected (Trust score ${analysis.trustScore}% is Scam)` });
            continue;
          }

          if (!analysis.isRemote) {
            console.log(`Rejected listing: On-site/Hybrid indicator detected.`);
            errors.push({ title: item.title, company: item.company, link: item.link, reason: 'Rejected (Non-Remote/Hybrid role detected)' });
            continue;
          }

          // 3. Index job into MongoDB
          const companyInitials = item.company
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 3);

          let category = determineCategory(item.title, cleanedDescription);
          if (category === 'Software Engineering' && feed.defaultCategory !== 'Software Engineering') {
            // Use the feed's default category if our detector didn't find specific keywords
            category = feed.defaultCategory;
          }

          const newJob = new Job({
            id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: item.title,
            company: item.company,
            companyInitials,
            location: 'Remote',
            salary: 'Unspecified',
            postedDate: 'Just now',
            trustScore: analysis.trustScore,
            status: analysis.status,
            category,
            description: cleanedDescription,
            jdUrl: item.link,
            aiDetails: analysis
          });

          await newJob.save();
          addedCount++;

          if (addedCount >= maxNewJobsToProcess) {
            console.log(`Reached sync cap limit of ${maxNewJobsToProcess} new jobs. Stopping run.`);
            break;
          }
        } catch (err) {
          console.error(`Failed to ingest job from link: ${item.link}:`, err.message);
          errors.push({ title: item.title, company: item.company, link: item.link, reason: `Scrape/Vetting Error: ${err.message}` });
        }
      }
    } catch (feedErr) {
      console.error(`Failed to sync from feed ${feed.name}:`, feedErr.message);
      errors.push({ feed: feed.name, reason: feedErr.message });
    }
  }

  return {
    totalFound,
    processed: processedCount,
    added: addedCount,
    skipped: skippedCount,
    errors
  };
}
