# TrustRemote - Remote Job Legitimacy Vetting Portal

TrustRemote is an E2E Remote Job Board and Real-Time Legitimacy Scanner designed to protect remote jobseekers from financial, phishing, and data-harvesting scams. 

The application utilizes the **Google Gemini API** (with a robust rule-based local heuristics fallback) to analyze job descriptions, recruiter contacts, and external job post URLs.

---

## 💻 Key Features

1. **Remote Job Legitimacy Feed**: Displays vetted opportunities. Users can inspect job details, view detailed legitimacy scores, and see custom red/green flag breakdown audits.
2. **Interactive Security Scanner**: Allows jobseekers to paste raw job descriptions or correspondence, input recruiter contact info, and generate dynamic safety audit reports.
3. **Job URL Scraper & Parser**: Automatically fetches and extracts job titles, descriptions, locations, and salaries from external job boards (like Rippling, Greenhouse, LinkedIn) to autofill forms or run scans.
4. **Recruiter Console**: Restricted zone for recruiters to submit and vet new jobs before indexing. Protected with passcode authorization.

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
RECRUITER_PASSCODE=your_secret_passcode
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

## 📖 Documentation
- 👉 **[Design Document](file:///e:/SWB%20Hackathon%20V2/design_doc.md)**: Details the architectural components, URL scraping engine, safety vetting fallback algorithms, and API specifications.
- 👉 **[Human-AI Interaction Guide](file:///e:/SWB%20Hackathon%20V2/human_loop_interaction.md)**: Documents the Human-in-the-Loop (HITL) and Human-on-the-Loop (HOTL) collaboration patterns utilized throughout this project's development.
