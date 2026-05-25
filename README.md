# TrustRemote - Remote Job Legitimacy Vetting Portal

## 📖 Documentation

For full architectural details, API design, scraping fallbacks, and security flows, check the design document: 👉 **[design_doc.md](./design_doc.md)**

For Human Loop Interaction details: 👉 **[human_loop_interaction.md](./human_loop_interaction.md)**

---

TrustRemote is an E2E Remote Job Board and Real-Time Legitimacy Scanner designed to protect remote jobseekers from financial, phishing, and data-harvesting scams.

The application utilizes the **Google Gemini API** (with a robust rule-based local heuristics fallback) to analyze job descriptions, recruiter contacts, and external job post URLs.

---

## 💻 Key Features

1. **Remote Job Legitimacy Feed**: Displays vetted opportunities. Users can inspect job details, view detailed legitimacy scores, and see custom red/green flag breakdown audits.
2. **Redesigned Filter Header Row**: Relocated the search bar, legitimacy status tabs, and category pills outside the split-pane columns. They are now placed as a full-width row (`.filter-controls-row`) directly under the stats banner for an open, modern aesthetic.
3. **Dynamic Dashboard Metrics**: Refactored the statistics cards banner to pull live data from MongoDB. It calculates total evaluated positions, verified items, averages the Trust Index, and logs shielded scams dynamically.
4. **Left-Hand Filters Sidebar**:
   - **Remote Only Switch**: Instantly filter out any hybrid or onsite roles.
   - **Saved Jobs Toggle**: View only bookmarked jobs, persisted locally across sessions.
   - **Trust Score Threshold**: Custom range slider to screen out positions below a set safety score.
   - **Job Type Checkboxes**: Filter listings by Full-time, Part-time, Contract, or Internship.
5. **Interactive Security Scanner**: Allows jobseekers to paste raw job descriptions or correspondence, input recruiter contact info, and generate dynamic safety audit reports.
6. **Job URL Scraper & Parser**: Automatically fetches and extracts job titles, descriptions, locations, and salaries from external job boards (like Rippling, Greenhouse, LinkedIn) to autofill forms or run scans.
7. **Secure Recruiter Console**: 
   - **Corporate Domain Registration**: Requires a verified corporate email address (blocks common public domains like Gmail, Yahoo, etc.).
   - **Passwordless Passkeys (WebAuthn)**: One-click passwordless logins using biometric hardware (Windows Hello, FaceID, TouchID) once enrolled.
   - **Live AI Safety Vetting**: Automatic analysis of recruiter listings against scams prior to index inclusion.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide React, CSS
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **AI Integration**: Google Generative AI (`gemini-1.5-flash`)
- **Testing**: Playwright End-to-End Test Suite

---

## 🚀 Getting Started

### 1. Backend Setup

Navigate to the `server` directory and configure environment variables in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trustremote
GEMINI_API_KEY=your_google_ai_studio_api_key
JWT_SECRET=your_jwt_signing_secret_key
RECRUITER_PASSCODE=hackathon2026secret
```

Start the API server:

```bash
cd server
npm install
node index.js
```

### 2. Frontend Setup

Navigate to the root directory and start the Vite dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> [!TIP]
> **Port Issues**: If you run into `EADDRINUSE` port errors, ensure no zombie Node.js tasks are running in the background. You can kill them or let Vite run on its automatic port failover (e.g. 5174).

---

## 🧪 Running E2E Automation Tests

The project includes a comprehensive E2E test suite written in Playwright.

To run tests in headless mode:

```bash
npx playwright test tests/trustremote.spec.ts
```

To run only the Chromium project:

```bash
npx playwright test tests/trustremote.spec.ts --project=chromium
```

To run in UI mode:

```bash
npx playwright test tests/trustremote.spec.ts --ui
```

---

## ☁️ Vercel Serverless Deployment

TrustRemote is optimized to run as a unified monorepo on Vercel:
- **`vercel.json`**: Root configuration maps the client folder to static builds and proxies `/api/*` to serverless function endpoints.
- **Connection Reuse**: Database calls in `server/index.js` use cached connection objects to prevent hitting MongoDB Atlas connection limits during high serverless scale-outs.
