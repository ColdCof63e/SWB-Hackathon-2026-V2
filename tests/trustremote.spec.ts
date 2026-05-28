import { test, expect } from '@playwright/test';

// Base URL of the local dev server
const BASE_URL = 'http://localhost:5173';

test.describe('TrustRemote End-to-End Tests', () => {

  // Run before each test to navigate to the app
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  // ==========================================
  // POSITIVE SCENARIOS
  // ==========================================

  test('Positive: Job Feed loads and Inspector displays job details', async ({ page }) => {
    // 1. Navigate to Jobs Board since scanner is now default
    await page.click('button:has-text("Jobs Board")');

    // 2. Verify page title or header
    await expect(page.locator('.page-header h1')).toContainText('Remote Job Legitimacy Feed');

    // 3. Wait for jobs to fetch and render
    const firstJobCard = page.locator('.job-card').first();
    await expect(firstJobCard).toBeVisible();

    // 3. Click the first job card to view it in Inspector
    await firstJobCard.click();

    // 4. Verify Inspector displays details of selected job
    const inspectorTitle = page.locator('.inspector-title');
    await expect(inspectorTitle).toBeVisible();
    await expect(page.locator('.radial-score')).toBeVisible();
  });

  test('Positive: Interactive Scanner processes safe job descriptions', async ({ page }) => {
    // 1. Navigate to AI Job Scanner tab
    await page.click('button:has-text("AI Job Scanner")');
    await expect(page.locator('.page-header h1')).toContainText('Interactive Security Scanner');

    // 2. Fill in legitimate job details
    await page.fill('textarea.scan-textarea', 
      'We are looking for a Senior React Developer. Requirements include 5 years of JS experience, Git collaboration. We provide company-issued MacBooks and offer standard health insurance and 401(k) match. Video interviews are conducted over Google Meet.'
    );
    await page.fill('input[placeholder*="hr@company.com"]', 'careers@legitfirm.com');
    await page.fill('input[placeholder*="company.com"]', 'https://legitfirm.com/jobs/101');

    // 3. Trigger Scan
    await page.click('button:has-text("Analyze Job Legitimacy")');

    // 4. Expect success results
    const report = page.locator('.scan-report');
    await expect(report).toBeVisible();
    await expect(page.locator('.status-badge-small')).toContainText('Verified');
    
    // 5. Ensure trust score is high (e.g. above 80%)
    const scoreText = await page.locator('.score-number-big').innerText();
    const scoreValue = parseInt(scoreText.replace('%', ''), 10);
    expect(scoreValue).toBeGreaterThanOrEqual(80);
  });

  test('Positive: Interactive Scanner can fetch details from a URL and analyze it', async ({ page }) => {
    // Dismiss the success alert dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 1. Navigate to AI Job Scanner tab
    await page.click('button:has-text("AI Job Scanner")');

    // 2. Fill in the job URL
    await page.fill('input[placeholder*="company.com/careers/job-123"]', 
      'https://ats.rippling.com/analyticsmart/jobs/9b968983-2c3e-42eb-aa00-db788cdb0d21?jobSite=LinkedIn'
    );

    // 3. Click "Fetch Details"
    await page.click('button:has-text("Fetch Details")');

    // 4. Verify that description gets autofilled
    const descriptionTextarea = page.locator('textarea.scan-textarea');
    await expect(descriptionTextarea).not.toBeEmpty();
    await expect(descriptionTextarea).toContainText('Full Stack Developer');

    // 5. Trigger Scan
    await page.click('button:has-text("Analyze Job Legitimacy")');

    // 6. Expect results
    const report = page.locator('.scan-report');
    await expect(report).toBeVisible();

    // 7. Verify Cross-Portal Footprint metric is displayed
    const crossPortalMetric = page.locator('.metric-box', { hasText: 'Cross-Portal Footprint' });
    await expect(crossPortalMetric).toBeVisible();
    await expect(crossPortalMetric).toContainText('LinkedIn, Rippling ATS');
  });

  test('Positive: Recruiter Console can submit and index a job', async ({ page }) => {
    // 1. Listen for browser alert popups
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('AI Scan Complete');
      await dialog.accept();
    });

    // 2. Navigate to Recruiter Console and Sign Up
    await page.click('button:has-text("Recruiter Console")');
    await page.click('button:has-text("Sign Up")');
    const uniqueEmail = `recruiter-${Date.now()}@playwright.corp`;
    await page.fill('input[placeholder="Corporate Email (e.g. name@company.com)"]', uniqueEmail);
    await page.fill('input[placeholder="Password"]', 'securepassword123');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('.panel-header h4').first()).toContainText('Post & AI-Vet a New Job');

    // 3. Fill out the posting form
    await page.fill('input[placeholder="e.g. Senior Test Engieer"]', 'Automated QA Engineer');
    await page.fill('input[placeholder="e.g. Acme group"]', 'Playwright Corp');
    await page.fill('input[placeholder*="e.g. Remote"]', 'Remote (US)');
    await page.fill('input[placeholder*="e.g. $90k"]', '$120,000/yr');
    await page.fill('input[placeholder="e.g. recruiting@acme.com"]', 'jobs@playwright.corp');
    await page.fill('input[placeholder*="e.g. https://"]', 'https://playwright.corp/careers');
    await page.fill('textarea[placeholder*="Paste requirements"]', 
      'We are hiring an Automated QA Engineer. Focus will be testing with Playwright. Video calls will be scheduled via Zoom. Equipment is fully shipped to your address directly by the company.'
    );

    // 4. Submit Job
    await page.click('button:has-text("Submit & Analyze Listing")');

    // 5. Verify it appears in the Recruiter feed on the right
    const recruiterCard = page.locator('.recruiter-job-card h4', { hasText: 'Automated QA Engineer' }).first();
    await expect(recruiterCard).toBeVisible();
  });

  test('Positive: Job Board filters and bookmarks function correctly', async ({ page }) => {
    // 1. Navigate to Jobs Board
    await page.click('button:has-text("Jobs Board")');
    
    // 2. Get the title of the first job card
    const firstJobCard = page.locator('.job-card').first();
    await expect(firstJobCard).toBeVisible();
    const jobTitle = await firstJobCard.locator('.job-title').innerText();

    // 3. Click the bookmark (heart) button on the first job card
    const heartBtn = firstJobCard.locator('.bookmark-btn');
    await expect(heartBtn).toBeVisible();
    await heartBtn.click();

    // 4. Toggle the "Saved Jobs" switch in the sidebar
    const savedJobsSwitch = page.locator('aside.filters-sidebar input[type="checkbox"]').nth(1);
    await savedJobsSwitch.check();

    // 5. Verify only bookmarked job is visible
    const visibleCards = page.locator('.job-card');
    const visibleCount = await visibleCards.count();
    expect(visibleCount).toBe(1);
    await expect(visibleCards.first().locator('.job-title')).toContainText(jobTitle);

    // 6. Uncheck Saved Jobs and verify other jobs show up
    await savedJobsSwitch.uncheck();
    const allCount = await visibleCards.count();
    expect(allCount).toBeGreaterThan(1);
  });

  // ==========================================
  // NEGATIVE SCENARIOS
  // ==========================================

  test('Negative: Scanner catches check-fraud and Telegram redirection', async ({ page }) => {
    // 1. Navigate to AI Job Scanner tab
    await page.click('button:has-text("AI Job Scanner")');

    // 2. Fill in scam-like job description details
    await page.fill('textarea.scan-textarea', 
      'URGENT DATA ENTRY CLERK NEEDED! Paying $55/hr. No experience required. We will send you a certified check in the mail to buy your own laptop and printer from our preferred vendor. The interview will be text-only on Telegram app. Add recruiter at @legitjob.'
    );
    await page.fill('input[placeholder*="hr@company.com"]', 'hr.office.2026@gmail.com');

    // 3. Trigger Scan
    await page.click('button:has-text("Analyze Job Legitimacy")');

    // 4. Expect low safety status
    const report = page.locator('.scan-report');
    await expect(report).toBeVisible();
    await expect(page.locator('.status-badge-small')).toContainText('Scam');

    // 5. Expect specific red flag to be listed in UI
    const flagItem = page.locator('.flag-item');
    await expect(flagItem.first()).toBeVisible();
    await expect(page.locator('.flag-item')).toContainText([
      /Telegram/i,
      /check/i
    ]);
  });

  test('Negative: Prevent posting if required fields are missing', async ({ page }) => {
    // 1. Navigate to Recruiter Console and Sign Up
    await page.click('button:has-text("Recruiter Console")');
    await page.click('button:has-text("Sign Up")');
    const uniqueEmail = `recruiter-${Date.now()}@playwright.corp`;
    await page.fill('input[placeholder="Corporate Email (e.g. name@company.com)"]', uniqueEmail);
    await page.fill('input[placeholder="Password"]', 'securepassword123');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('.panel-header h4').first()).toContainText('Post & AI-Vet a New Job');

    // 2. Leave "Job Title" empty but fill Company
    await page.fill('input[placeholder="e.g. Acme group"]', 'Acme Empty Title');
    await page.fill('textarea', 'Some job details here...');

    // 3. Try to click submit
    const submitBtn = page.locator('button:has-text("Submit & Analyze Listing")');
    await submitBtn.click();

    // 4. Verify that the form is not submitted (i.e. we are not in loading/submitting state)
    await expect(submitBtn).not.toContainText('Running AI Safety Vetting');
  });

  test('Negative: Scanner detects non-remote role and displays warning card', async ({ page }) => {
    // 1. Navigate to AI Job Scanner tab
    await page.click('button:has-text("AI Job Scanner")');

    // 2. Fill in hybrid/onsite job details (not remote)
    await page.fill('textarea.scan-textarea', 
      'We are looking for a Senior Software Engineer to work at our HQ in San Francisco. This is a Hybrid role requiring 3 days a week in-office. We offer standard benefits.'
    );

    // 3. Trigger Scan
    await page.click('button:has-text("Analyze Job Legitimacy")');

    // 4. Expect report to be visible
    const report = page.locator('.scan-report');
    await expect(report).toBeVisible();

    // 5. Verify the non-remote warning alert banner is displayed
    const warningBanner = page.locator('.remote-alert-banner');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText('Non-Remote Role Alert');
  });

  test('Negative: Recruiter Console submits a hybrid job and Inspector flags it', async ({ page }) => {
    // 1. Listen for browser alert popups
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 2. Navigate to Recruiter Console and Sign Up
    await page.click('button:has-text("Recruiter Console")');
    await page.click('button:has-text("Sign Up")');
    const uniqueEmail = `recruiter-${Date.now()}@playwright.corp`;
    await page.fill('input[placeholder="Corporate Email (e.g. name@company.com)"]', uniqueEmail);
    await page.fill('input[placeholder="Password"]', 'securepassword123');
    await page.click('button:has-text("Create Account")');
    await expect(page.locator('.panel-header h4').first()).toContainText('Post & AI-Vet a New Job');

    // 3. Fill out the posting form with a hybrid job
    await page.fill('input[placeholder="e.g. Senior Test Engieer"]', 'Hybrid Product Manager');
    await page.fill('input[placeholder="e.g. Acme group"]', 'Hybrid Corp');
    await page.fill('input[placeholder*="e.g. Remote"]', 'San Francisco, CA (Hybrid)');
    await page.fill('input[placeholder*="e.g. $90k"]', '$140,000/yr');
    await page.fill('textarea[placeholder*="Paste requirements"]', 
      'This is a Hybrid role requiring 3 days a week onsite at our San Francisco office. You will manage our analytics products.'
    );

    // 4. Submit Job
    await page.click('button:has-text("Submit & Analyze Listing")');

    // 5. Navigate to Jobs Board to view it
    await page.click('button:has-text("Jobs Board")');

    // 6. Click the newly added job card
    const jobCard = page.locator('.job-card', { hasText: 'Hybrid Product Manager' }).first();
    await expect(jobCard).toBeVisible();
    await jobCard.click();

    // 7. Verify the Inspector shows the non-remote alert banner
    const warningBanner = page.locator('.job-inspector .remote-alert-banner');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText('Non-Remote Role Alert');
  });

});

test.describe('Recruiter Console', () => {
  test.beforeEach(async ({page}) => {
    await page.goto(BASE_URL)
  })

  test("Recruiter Login: Success flow", async ({page}) => {
    await page.click("button:has-text('Recruiter Console')")
    await expect(page.locator("h2:has-text('Recruiter Sign In')")).toBeVisible({timeout: 10000});

    await page.fill("input[type='email']", "test@example.com")
    await page.fill("input[type='password']", "password123")
    await page.click("button[class='recruiter-submit-btn']")
    await expect(page.locator(".panel-header h4")).toContainText('Post & AI-Vet a New Job');
  })

  
})