# Recruiter Passcode Authorization Guide

This guide walks you through implementing a lightweight passcode-based authorization system (**Option A**) to secure the Recruiter Console so that only authorized users can submit new jobs.

---

## 1. Backend Configuration

### A. Add the Passcode to Environment Variables
In `server/.env`, append the passcode you want to use:

```env
RECRUITER_PASSCODE=hackathon2026secret
```

### B. Protect the Posting Route
In `server/index.js`, update the `POST /api/jobs` route to look for and validate the `Authorization` header.

Replace lines 275-276 in `server/index.js`:

```javascript
// 2. POST /api/jobs - Submit a new job to the board (auto-vets with AI)
app.post('/api/jobs', async (req, res) => {
  // Validate Recruiter Passcode
  const authHeader = req.headers.authorization;
  const passcode = authHeader && authHeader.split(' ')[1]; // Extracts passcode from 'Bearer <passcode>'

  if (!passcode || passcode !== process.env.RECRUITER_PASSCODE) {
    return res.status(401).json({ error: 'Unauthorized: Invalid recruiter passcode.' });
  }

  const { title, company, location, salary, category, description, recruiterInfo, jdUrl } = req.body;
  // ... rest of the posting code ...
```

---

## 2. Frontend React Configuration

In `src/App.jsx`:

### A. Define Auth States
Add states for managing the passcode, login input, and authorization status. Add these near the top of the `App` component (around line 16):

```javascript
  // Auth State
  const [passcode, setPasscode] = useState(localStorage.getItem('recruiterPasscode') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('recruiterPasscode'));
  const [loginInput, setLoginInput] = useState('');
```

### B. Add Authorization Header to API Request
In your `handlePostJob` function in `src/App.jsx` (around line 54), append the passcode as a `Bearer` token inside the `headers` option:

```javascript
    fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${passcode}` // <-- Send passcode header
      },
      body: JSON.stringify({
        title: formTitle,
        company: formCompany,
        // ... rest of request payload
```

### C. Create Handle Log In / Log Out Functions
Add helper functions to verify the passcode locally (or let it fail gracefully on posting, or build a simple validation check) and store it in `localStorage`:

```javascript
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginInput.trim() === '') {
      alert('Please enter a passcode.');
      return;
    }
    // Set locally. The backend will perform the ultimate validation on submit.
    setPasscode(loginInput);
    setIsAuthenticated(true);
    localStorage.setItem('recruiterPasscode', loginInput);
  };

  const handleLogout = () => {
    setPasscode('');
    setIsAuthenticated(false);
    localStorage.removeItem('recruiterPasscode');
    setLoginInput('');
  };
```

### D. Render Passcode Screen in Recruiter Tab
Locate the Recruiter Console section inside `App.jsx` (currently around line 159). Wrap it to display a passcode login form if the user is not authenticated:

```javascript
        ) : (
          // Recruiter Console
          <div className="recruiter-view animate-fade-in">
            {!isAuthenticated ? (
              <div className="login-panel glass text-center animate-fade-in">
                <Shield className="panel-icon logo-large" size={48} />
                <h2>Recruiter Console Access</h2>
                <p>Please enter the authorization passcode to manage and post vetted jobs.</p>
                <form onSubmit={handleLogin} className="login-form">
                  <input
                    type="password"
                    placeholder="Enter recruiter passcode..."
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="recruiter-submit-btn">
                    Unlock Console
                  </button>
                </form>
              </div>
            ) : (
              <>
                <header className="page-header">
                  <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h1>Recruiter Console</h1>
                      <p>Post new vacancies and analyze their legitimacy profiles.</p>
                    </div>
                    <button onClick={handleLogout} className="modal-cancel-btn" style={{ height: 'fit-content' }}>
                      Lock Console
                    </button>
                  </div>
                </header>

                <div className="recruiter-grid">
                  {/* Left Pane: Posting & Vetting form */}
                  {/* ... existing form layout ... */}
                </div>
              </>
            )}
          </div>
        )}
```

### E. Add Styling Support
Append these layout and form styles into the `<style>` tag of `src/App.jsx` (around line 1056):

```css
        .login-panel {
          max-width: 420px;
          margin: 4rem auto;
          padding: 2.5rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .login-form input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: white;
          text-align: center;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .login-form input:focus {
          border-color: var(--primary-bright);
        }

        .logo-large {
          color: var(--primary-bright);
          margin-bottom: 0.5rem;
        }
```
