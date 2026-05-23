# Human-AI Collaboration Patterns (TrustRemote Development)

This document describes the collaboration patterns observed during the development of TrustRemote, detailing the relationship between the Developer (Human) and Antigravity (AI).

---

## 1. Human-in-the-Loop (HITL)

**Definition**: The AI system requires active human intervention, decision-making, or approval before it can proceed with critical tasks. The process halts until human input is received.

### Application in TrustRemote
- **Architectural Selection**: The Developer had to review proposed design options for securing the Recruiter Console (e.g. Option A passcode authorization vs. Option B JWT sessions) and choose the implementation path.
- **Plan Approvals**: Before any code modification or files were created, the AI entered **Planning Mode** to write an `implementation_plan.md`. The workflow was blocked until the Developer actively approved the design document.

---

## 2. Human-on-the-Loop (HOTL)

**Definition**: The AI system executes tasks autonomously while the human acts in an overseer/supervisor capacity. The human monitors the execution and can intervene, cancel, or course-correct, but does not need to approve every sub-action.

### Application in TrustRemote
- **Code Execution**: Once the implementation plan was approved, the AI wrote code (`scraper.js`), updated routing (`index.js`), modified frontend states (`App.jsx`, `JobScanner.jsx`), and added tests (`trustremote.spec.ts`) autonomously.
- **Asynchronous Test Runs**: E2E verification tests ran in the background. The Developer observed logs, identified why a run failed (e.g. port conflicts or missing files), and intervened when necessary.
- **Release Control**: The Developer monitored the final output and initiated Git staging, committing, and pushing (`git push origin main`) once satisfied.

---

## 3. Human-out-of-the-Loop (HOOTL)

**Definition**: The AI system acts with complete autonomy, executing tasks and making decisions without human oversight or verification.

### Application in TrustRemote
- **Not Used**: Due to safety constraints and safety alignment, fully autonomous actions were restricted to sandboxed execution runs (like E2E tests). Crucial codebase changes and deployments remained under Developer supervision.
