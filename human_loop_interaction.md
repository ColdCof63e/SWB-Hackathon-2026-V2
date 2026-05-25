# Human-AI Collaboration Patterns (TrustRemote Development)

This document describes the collaboration patterns observed during the development of TrustRemote, detailing the relationship between the Developer (Human) and Antigravity (AI).

---

## 1. Human-in-the-Loop (HITL)

**Definition**: The AI system requires active human intervention, decision-making, or approval before it can proceed with critical tasks. The process halts until human input is received.

### Application in TrustRemote
- **Architectural Selection**: The Developer had to review proposed design options for securing the Recruiter Console (e.g. Option A passcode authorization vs. Option B JWT sessions) and choose the implementation path.
- **Plan Approvals**: Before any code modification or files were created, the AI entered **Planning Mode** to write an `implementation_plan.md`. The workflow was blocked until the Developer actively approved the design document.
- **Layout Redesign Decisions**: The Developer explicitly instructed the AI to relocate `.filter-bar` and `.category-pills` out of `.board-grid` and place them directly above it as a row, reviewing the plan before code modifications took place.
- **Debugging & Layout Feedback**: When the main job list overflowed and cards became squashed, the Developer captured browser screenshots and pointed the AI to the exact CSS selectors (like `.main-list-content` and `overflow`), triggering a targeted diagnostic and correction cycle (`flex-shrink: 0`, `min-height: 0`).

---

## 2. Human-on-the-Loop (HOTL)

**Definition**: The AI system executes tasks autonomously while the human acts in an overseer/supervisor capacity. The human monitors the execution and can intervene, cancel, or course-correct, but does not need to approve every sub-action.

### Application in TrustRemote
- **Code Execution**: Once the implementation plan was approved, the AI wrote code (`scraper.js`), updated routing (`index.js`), modified frontend states (`App.jsx`, `JobScanner.jsx`), and added tests (`trustremote.spec.ts`) autonomously.
- **Asynchronous Test Runs**: E2E verification tests ran in the background. The Developer observed logs, identified why a run failed (e.g. port conflicts or missing files), and intervened when necessary.
- **Task Halting**: When the background build task (`npm run build`) encountered execution policy blocks in the terminal environment, the Developer sent a "halt task" command to immediately stop the background process.
- **Vite Client Hot-Reloading**: The Developer monitored the continuous running process of `npm run dev` and `node server/index.js` in their workspace terminals. While the AI edited frontend/backend files, the Developer watched for console compile issues in real-time.
- **Release Control**: The Developer monitored the final output and initiated Git staging, committing, and pushing (`git push origin main`) once satisfied.

---

## 3. Human-out-of-the-Loop (HOOTL / HOOL)

**Definition**: The AI system acts with complete autonomy, executing tasks and making decisions without human oversight or verification.

### Application in TrustRemote
- **Automated Database Maintenance**: The Mongoose database schema automatically cleans up expired listings. A background TTL index (`expireAfterSeconds`) automatically purges jobs older than 30 days to prevent Atlas storage limits from overflowing, requiring zero recruiter action.
- **Global RSS Sync Cron**: If configured in production via `vercel.json` crons, the sync engine runs hourly, fetches XML RSS items, de-duplicates records using a SHA-256 hash, runs legitimacy algorithms, and commits entries automatically in the background.
- **Client-Side Bookmark Persistence**: Local storage updates (`localStorage.setItem`) save user bookmarked job IDs seamlessly during page navigation without notifying the server or prompting the user.

