# Collaborative Authorization Implementation Roadmap

This roadmap divides the tasks required to implement the passcode-based recruiter authorization (**Option A**) across different human-AI collaboration styles.

---

## 🛠️ Step-by-Step Task Division

### Phase 1: Backend Security

- **Pattern**: 🔒 **Developer Coding (You)**
- **Tasks**:
  1. Add the secret passcode `RECRUITER_PASSCODE=hackathon2026secret` to your [server/.env](file:///e:/SWB Hackathon V2/server/.env) file.
  2. Protect the `POST /api/jobs` endpoint inside [server/index.js](file:///e:/SWB Hackathon V2/server/index.js) (around line 275). Extract the passcode from the `Authorization` header (`Bearer <passcode>`) and verify it against `process.env.RECRUITER_PASSCODE`. Return `401 Unauthorized` if invalid or missing.
- **Guiding Context**: See **Section 1** of [recruiter_auth_guide.md](file:///e:/SWB Hackathon V2/recruiter_auth_guide.md) for inspiration!

---

### Phase 2: Joint Verification & Designing [COMPLETED]

- **Pattern**: 👥 **Human-in-the-Loop (HITL)**
- **Tasks**:
  1. [x] Start the server and run a quick test (using curl, thunderclient, or browser request) to verify that job postings without the passcode are blocked.
  2. [x] We will align on how you want the login screen to look in the UI (colors, buttons, layout) before writing React code.

---

### Phase 3: Frontend Integration & E2E Testing [COMPLETED]

- **Pattern**: 🤖 **Human-on-the-Loop (HOTL)**
- **Tasks**:
  1. [x] **AI (Antigravity)** will write the frontend state logic, login form UI, lock/unlock console functionality, and CSS styling in [src/App.jsx](file:///e:/SWB Hackathon V2/src/App.jsx).
  2. [x] **AI (Antigravity)** will update the E2E tests in [tests/trustremote.spec.ts](file:///e:/SWB Hackathon V2/tests/trustremote.spec.ts) to input the passcode before submitting the recruiter console jobs.
  3. [x] **Human (You)** will monitor, review the changes, run the E2E tests (`npx playwright test`), and verify that all tests pass.

---

### Phase 4: Final Polish & Documentation [COMPLETED]

- **Pattern**: ⚡ **Human-out-of-the-Loop (HOOTL / Autopilot)**
- **Tasks**:
  1. [x] **AI (Antigravity)** has updated the [design_doc.md](file:///e:/SWB Hackathon V2/design_doc.md) and [README.md](file:///e:/SWB Hackathon V2/README.md) to record the passcode mechanism and API header requirement.

