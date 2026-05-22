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
    // 1. Verify page title or header
    await expect(page.locator('.page-header h1')).toContainText('Remote Job Legitimacy Feed');

    // 2. Wait for jobs to fetch and render
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

  test('Positive: Recruiter Console can submit and index a job', async ({ page }) => {
    // 1. Listen for browser alert popups
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('AI Scan Complete');
      await dialog.accept();
    });

    // 2. Navigate to Recruiter Console
    await page.click('button:has-text("Recruiter Console")');
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
    // 1. Navigate to Recruiter Console
    await page.click('button:has-text("Recruiter Console")');

    // 2. Leave "Job Title" empty but fill Company
    await page.fill('input[placeholder="e.g. Acme group"]', 'Acme Empty Title');
    await page.fill('textarea', 'Some job details here...');

    // 3. Try to click submit
    const submitBtn = page.locator('button:has-text("Submit & Analyze Listing")');
    await submitBtn.click();

    // 4. Verify that the form is not submitted (i.e. we are not in loading/submitting state)
    await expect(submitBtn).not.toContainText('Running AI Safety Vetting');
  });

});
