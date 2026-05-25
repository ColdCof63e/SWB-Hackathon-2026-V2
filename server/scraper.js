import { GoogleGenerativeAI } from '@google/generative-ai';

function cleanHtml(html) {
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '');

  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.substring(0, 40000);
}

function determineCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('qa') || text.includes('test') || text.includes('automation engineer') || text.includes('quality assurance')) {
    return 'QA & Testing';
  }
  if (text.includes('developer') || text.includes('engineer') || text.includes('programmer') || text.includes('full stack') || text.includes('backend') || text.includes('frontend') || text.includes('software')) {
    return 'Software Engineering';
  }
  if (text.includes('data') || text.includes('analyst') || text.includes('analytics') || text.includes('business intelligence')) {
    return 'Data & Analytics';
  }
  if (text.includes('product manager') || text.includes('product management') || text.includes('project manager')) {
    return 'Product Management';
  }
  if (text.includes('design') || text.includes('ui/') || text.includes('ux') || text.includes('illustrator') || text.includes('figma')) {
    return 'Design';
  }
  if (text.includes('sales') || text.includes('marketing') || text.includes('growth') || text.includes('account executive')) {
    return 'Marketing & Sales';
  }
  if (text.includes('support') || text.includes('customer success') || text.includes('help desk') || text.includes('representative')) {
    return 'Customer Support';
  }
  return 'General Remote';
}

export async function scrapeAndParseJob(url, genAI = null) {
  if (!url) {
    throw new Error('URL is required for scraping.');
  }

  console.log('Fetching job posting webpage:', url);

  // Intercept Ashby HQ jobs to use their API directly because their site is an SPA
  if (url.includes('jobs.ashbyhq.com')) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const org = parts[0];
        const postingId = parts[parts.length - 1];
        const apiUrl = 'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting';
        console.log(`Ashby URL detected. Fetching from API: ${apiUrl}`);
        
        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            operationName: 'ApiJobPosting',
            variables: {
              organizationHostedJobsPageName: org,
              postingId: postingId
            },
            query: 'query ApiJobPosting($organizationHostedJobsPageName: String!, $postingId: String!) { posting(id: $postingId) { title locationName descriptionHtml } }'
          })
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          const job = apiData.data?.posting;
          if (job) {
            const title = job.title || '';
            const company = org;
            const location = job.locationName || 'Remote';
            let description = job.descriptionHtml || '';
            description = description.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n+/g, '\n\n').trim();
            const category = determineCategory(title, description);

            return {
              title,
              company,
              location,
              salary: 'Unspecified',
              category,
              description,
              recruiterInfo: ''
            };
          }
        }
      }
    } catch (err) {
      console.warn('Ashby API extraction failed. Falling back to normal scrape.', err);
    }
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job URL. Server returned status: ${response.status}`);
  }

  const html = await response.text();

  // Mode 1: AI-Powered Parsing via Google Gemini (if active)
  if (genAI) {
    try {
      console.log('Attempting AI-powered extraction with Google Gemini...');
      const cleanedText = cleanHtml(html);
      
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `You are an expert web scraping and parser assistant. I will provide you with the cleaned text content of a job posting webpage.
      Your goal is to parse this content and extract structured job information.

      Webpage URL: ${url}
      Cleaned Text:
      """
      ${cleanedText}
      """

      Respond with a JSON object containing these exact fields:
      {
        "title": string (extracted Job Title, e.g. "Software Engineer"),
        "company": string (extracted Company Name, e.g. "Google"),
        "location": string (extracted Location, e.g. "Remote (US)" or "New York, NY", fallback "Remote" if not found),
        "salary": string (extracted Salary details, e.g. "$120,000 - $140,000" or "Unspecified"),
        "category": string (one of: "Software Engineering", "QA & Testing", "Data & Analytics", "Product Management", "Design", "Marketing & Sales", "Customer Support", "General Remote"),
        "description": string (the complete job description, requirements, benefits, and instructions extracted from the webpage. Keep it formatted nicely with newlines),
        "recruiterInfo": string (extracted recruiter email, contact name, or contact details if any, else empty string)
      }`;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      // Strip markdown code blocks if present
      responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(responseText);
      if (parsed.title && parsed.description) {
        console.log('Successfully extracted structured details via Gemini.');
        return parsed;
      }
    } catch (geminiError) {
      console.error('Gemini AI extraction failed, falling back to heuristics:', geminiError.message);
    }
  }

  // Mode 2: Heuristics Parser (Local Fallback)
  console.log('Executing local heuristics extraction fallback...');

  // 1. NextJS Hydrated Props check (Specific to modern platforms like Rippling)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const jobPost = nextData.props?.pageProps?.apiData?.jobPost;
      if (jobPost) {
        console.log('Detected Next.js hydrated props. Extracting Rippling job details...');
        const title = jobPost.name || '';
        const company = jobPost.companyName || '';
        const location = Array.isArray(jobPost.workLocations) ? jobPost.workLocations.join(', ') : 'Remote';
        
        let description = '';
        if (jobPost.description && typeof jobPost.description === 'object') {
          const parts = [];
          if (jobPost.description.company) parts.push(jobPost.description.company);
          if (jobPost.description.role) parts.push(jobPost.description.role);
          description = parts.join('\n\n');
        } else if (typeof jobPost.description === 'string') {
          description = jobPost.description;
        }

        // Clean HTML tags from parsed description
        description = description
          .replace(/<[^>]*>/g, '\n')
          .replace(/\n\s*\n+/g, '\n\n')
          .trim();

        const category = determineCategory(title, description);

        return {
          title,
          company,
          location,
          salary: 'Unspecified',
          category,
          description,
          recruiterInfo: ''
        };
      }
    } catch (e) {
      console.error('Failed to parse __NEXT_DATA__ block:', e.message);
    }
  }

  // 2. Standard Meta-Tag parsing
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let rawTitle = titleMatch ? titleMatch[1].trim() : 'Unknown Position';
  // Strip common suffixes from titles
  rawTitle = rawTitle.split(/\s+[|\-•]\s+/)[0];

  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
  
  let company = 'Unknown Company';
  let title = rawTitle;

  if (ogTitleMatch) {
    const ogTitle = ogTitleMatch[1];
    if (ogTitle.includes(' at ')) {
      const parts = ogTitle.split(' at ');
      title = parts[0].trim();
      company = parts[1].trim();
    } else if (ogTitle.includes(' | ')) {
      const parts = ogTitle.split(' | ');
      title = parts[0].trim();
      company = parts[1].trim().replace(/Careers|Jobs/gi, '').trim();
    } else {
      title = ogTitle;
    }
  }

  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i) ||
                      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  
  let description = ogDescMatch ? ogDescMatch[1].trim() : '';

  if (description.length < 200) {
    let bodyClean = cleanHtml(html);
    const idx = bodyClean.toLowerCase().indexOf(title.toLowerCase());
    if (idx !== -1) {
      bodyClean = bodyClean.substring(idx);
    }
    description = bodyClean.substring(0, 3000);
  }

  // Recruiter email matching
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = description.match(emailRegex) || html.match(emailRegex) || [];
  const recruiterInfo = emails.length > 0 ? emails[0] : '';

  const category = determineCategory(title, description);

  return {
    title,
    company,
    location: 'Remote',
    salary: 'Unspecified',
    category,
    description,
    recruiterInfo
  };
}
