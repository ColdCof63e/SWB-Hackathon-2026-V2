import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsBanner from './components/StatsBanner';
import JobList from './components/JobList';
import JobInspector from './components/JobInspector';
import JobScanner from './components/JobScanner';
import { mockJobs } from './data/mockJobs';
import { Shield, CheckCircle, Zap, Plus, X, Loader } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'scanner'
  const [jobs, setJobs] = useState(mockJobs); // initialize with static mock data
  const [selectedJob, setSelectedJob] = useState(mockJobs[0]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStep, setScrapingStep] = useState('');

  // Auth State
  const [passcode, setPasscode] = useState(localStorage.getItem('recruiterPasscode') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('recruiterPasscode'));
  const [loginInput, setLoginInput] = useState('');

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formCategory, setFormCategory] = useState('Software Engineering');
  const [formRecruiter, setFormRecruiter] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formJdUrl, setFormJdUrl] = useState('')

  // Fetch Jobs from backend on Mount
  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => {
        if (!res.ok) throw new Error('API server down');
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          setJobs(data);
          setSelectedJob(data[0]);
        }
      })
      .catch((err) => {
        console.warn('Backend server offline. Running in sandbox mode with static mock data:', err.message);
      });
  }, []);

  const handlePostJob = (e) => {
    e.preventDefault();
    if (!formTitle || !formCompany || !formDesc) {
      alert('Job Title, Company Name, and Description are required.');
      return;
    }

    setIsSubmitting(true);

    fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${passcode}`
      },
      body: JSON.stringify({
        title: formTitle,
        company: formCompany,
        location: formLocation,
        salary: formSalary,
        category: formCategory,
        recruiterInfo: formRecruiter,
        description: formDesc,
        jdUrl: formJdUrl
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to post job');
        return res.json();
      })
      .then((newJob) => {
        // Prepend new job to the list
        const updatedJobs = [newJob, ...jobs];
        setJobs(updatedJobs);
        setSelectedJob(newJob); // Select immediately
        // setShowPostModal(false);
        setIsSubmitting(false);

        // Reset fields
        setFormTitle('');
        setFormCompany('');
        setFormLocation('');
        setFormSalary('');
        setFormRecruiter('');
        setFormDesc('');
        setFormJdUrl('');

        alert(`AI Scan Complete! Vetted with a trust score of ${newJob.trustScore}% (${newJob.status}).`);
      })
      .catch((err) => {
        console.error('Post job failed:', err);
        alert('Server is offline. To submit live postings, make sure your server is running on port 5000.');
        setIsSubmitting(false);
      });
  };

  const handleAutofillFromUrl = () => {
    if (!formJdUrl.trim()) {
      alert('Please enter a Job Description URL (JD Link) first.');
      return;
    }
    setIsScraping(true);
    setScrapingStep('Connecting...');

    const steps = ['Connecting...', 'Fetching...', 'Parsing...', 'Extracting...'];
    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setScrapingStep(steps[stepIndex]);
      } else {
        clearInterval(interval);
      }
    }, 200);

    fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: formJdUrl })
    })
      .then(res => {
        if (!res.ok) throw new Error('Scrape request failed');
        return res.json();
      })
      .then(data => {
        setTimeout(() => {
          clearInterval(interval);
          if (data.title) setFormTitle(data.title);
          if (data.company) setFormCompany(data.company);
          if (data.location) setFormLocation(data.location);
          if (data.salary) setFormSalary(data.salary);
          if (data.category) setFormCategory(data.category);
          if (data.description) setFormDesc(data.description);
          if (data.recruiterInfo) setFormRecruiter(data.recruiterInfo);
          alert('Job details successfully retrieved and autofilled!');
          setIsScraping(false);
        }, 800);
      })
      .catch(err => {
        clearInterval(interval);
        console.error(err);
        alert('Failed to autofill job details. Please check the URL or fill in details manually.');
        setIsScraping(false);
      });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginInput.trim() === '') {
      alert('Please enter a passcode.');
      return;
    }
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


  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Content */}
      <main className="main-content">
        {activeTab === 'board' ? (
          <div className="board-view animate-fade-in">
            {/* Header Description */}
            <header className="page-header">
              <h1>Remote Job Legitimacy Feed</h1>
              <p>
                Browse verified remote opportunities vetted by our automated fraud intelligence. 
                Filter by score or keywords to avoid hiring scams and low-quality listings.
              </p>
              
              {/* <button className="post-job-trigger" onClick={() => setShowPostModal(true)}>
                <Plus size={16} />
                <span>Post & AI-Vet Job</span>
              </button> */}
            </header>

            {/* Statistics Dashboard */}
            <StatsBanner />

            {/* Main Interactive Grid */}
            <div className="board-grid">
              <div className="list-column">
                <JobList 
                  jobs={jobs} 
                  selectedJob={selectedJob} 
                  onSelectJob={setSelectedJob} 
                />
              </div>
              <div className="inspector-column">
                <JobInspector 
                  job={selectedJob} 
                  onClose={() => setSelectedJob(null)} 
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'scanner' ? (
          <div className="scanner-view animate-fade-in">
            {/* Header Description */}
            <header className="page-header">
              <h1>Interactive Security Scanner</h1>
              <p>
                Paste raw remote job descriptions or recruiter correspondence below. 
                The AI parser checks for payment scam signals, spoofed email domain signatures, and communication anomalies in real time.
              </p>
            </header>

            {/* Scanner Tool */}
            <JobScanner />
          </div>
        ) : (
          // Recruiter Console
          <div className="recruiter-view animate-fade-in">
            {!isAuthenticated ? (
              <div className="login-panel glass text-center animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '4rem auto', padding: '2.5rem', borderRadius: 'var(--radius-md)', maxWidth: '420px', gap: '1.25rem', width: '100%' }}>
                <Shield className="panel-icon logo-large" size={48} style={{ color: 'var(--primary-bright)', marginBottom: '0.5rem' }} />
                <h2>Recruiter Console Access</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Please enter the authorization passcode to manage and post vetted jobs.</p>
                <form onSubmit={handleLogin} className="login-form" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input
                    type="password"
                    placeholder="Enter recruiter passcode..."
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    required
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 1rem',
                      fontSize: '0.95rem',
                      color: 'white',
                      textAlign: 'center',
                      outline: 'none'
                    }}
                  />
                  <button type="submit" className="recruiter-submit-btn" style={{ margin: 0 }}>
                    Unlock Console
                  </button>
                </form>
              </div>
            ) : (
              <>
                <header className='page-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <h1>Recruiter Console</h1>
                    <p>Post new vacancies and analyze their legitimacy profiles. All listings undergo a security assessment against scam indicators prior to indexing.</p>
                  </div>
                  <button onClick={handleLogout} className="modal-cancel-btn" style={{ height: 'fit-content', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Lock Console
                  </button>
                </header>

                <div className="recruiter-grid">
            {/* Left Pane: Posting & Vetting form */}
            <div className="recruiter-form-panel glass">
              <div className="panel-header">
                <Shield className="panel-icon" size={18} />
                <h4> Post & AI-Vet a New Job</h4>
              </div>

              <form onSubmit={handlePostJob} className='recruiter-form'>
                <div className="recruiter-form-grid">
                  <div className="form-group">
                    <label> Job Title*</label>
                    <input
                    type='text'
                    required
                    placeholder="e.g. Senior Test Engieer"
                    value={formTitle}
                    onChange={(e)=> setFormTitle(e.target.value)
                    }/>
                  </div>

                  <div className="form-group">
                    <label> Company Name *</label>
                    <input
                    type="text"
                    required
                    placeholder='e.g. Acme group'
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)} />
                  </div>

                  <div className="form-group">
                      <label>Category</label>
                      <select 
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                      >
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Administrative">Administrative</option>
                        <option value="Data Entry">Data Entry</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Remote (US/Canada)"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Salary (Range or Hourly)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. $90k - $110k or $25/hr"
                        value={formSalary}
                        onChange={(e) => setFormSalary(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Recruiter Contact Email</label>
                      <input 
                        type="email" 
                        placeholder="e.g. recruiting@acme.com"
                        value={formRecruiter}
                        onChange={(e) => setFormRecruiter(e.target.value)}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Job Description URL (JD Link)</label>
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input 
                          type="url" 
                          style={{ flexGrow: 1 }}
                          placeholder="e.g. https://company.com/careers/job-123"
                          value={formJdUrl}
                          onChange={(e) => setFormJdUrl(e.target.value)}
                        />
                        <button
                          type="button"
                          className="preset-btn"
                          style={{
                            padding: '0 1rem',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            background: isScraping ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'var(--primary-bright)',
                            cursor: isScraping ? 'not-allowed' : 'pointer',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                          onClick={handleAutofillFromUrl}
                          disabled={isScraping}
                        >
                          {isScraping ? (scrapingStep || 'Fetching...') : 'Autofill from URL'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-group full-width">
                      <label>Job Description * (Paste full details to assess flags)</label>
                      <textarea 
                        required
                        rows={6}
                        placeholder="Paste requirements, description, interview channels, and equipment claims..."
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                      />
                    </div>
                </div>

                <button
                type='submit'
                className='recruiter-submit-btn'
                disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                    <Loader className='spinner-icon' size={14}/>

                    <span>Running AI Safety Vetting...</span>
                    </>
                  ) : (
                    <>
                    <Zap size={14} />
                    <span> Submit & Analyze Listing</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Pane: Active Vettings feed */}
            <div className='recruiter-feed-panel glass'>
              <div className='panel-header'>
                <Shield className="panel-icon text-green" size={18}/>
                <h4>Active Vetted Listings</h4>
              </div>

              <div className='recruiter-job-list'>
                {jobs.length === 0 ? (
                  <p className='no-jobs-text'>No active job listings found.</p>
                ) : (
                  jobs.map((job) => (
                    <div
                    key={job._id || job.id}
                    className={`recruiter-job-card ${selectedJob?._id === job._id ? 'active' : ''} `}
                    onClick={()=>setSelectedJob(job)}>
                      <div className='card-top'>
                        <h4>{job.title}</h4>
                        <span className={`status-badge-small 
                                          ${job.status==='Verified' ? 'status-high' : 
                                          job.status === 'Suspicious' ? 'status-mid' : 
                                          'status-low'}`}> {job.status} 
                        </span>
                      </div>
                      
                      <p className='company-text'>{job.company}</p>
                      <div className='card-bottom'>
                        <span className='score-badge'>Score: {job.trustScore}%</span>
                        <span className='date-badge'>{new Date(job.postedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )) 
                )}

              </div>

            </div>

          </div>
          </>
          )}
         </div> 
        )}
      </main>

      {/* Post Job Modal
      {showPostModal && (
        <div className="modal-backdrop">
          <div className="post-modal glass animate-fade-in">
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <Shield className="shield-modal" size={18} />
                <h3>Post Job & Run AI Vetting</h3>
              </div>
              <button className="modal-close" onClick={() => setShowPostModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePostJob} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Job Title *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Senior React Developer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Acme Corp"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Data Entry">Data Entry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Remote (US/Canada)"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Salary (Range or hourly rate)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. $90k - $110k or $25/hr"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Recruiter Contact Email</label>
                  <input 
                    type="text" 
                    placeholder="e.g. recruiting@acme.com"
                    value={formRecruiter}
                    onChange={(e) => setFormRecruiter(e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Job Description * (Paste full details to assess flags)</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Paste requirements, description, interview channels, and equipment claims..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-cancel-btn"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="spinner-icon" size={14} />
                      <span>Scanning Posting...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>Post and Analyze Listing</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {/* Footer Vibe */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-credits">
            <span>Built for the Future of Work Hackathon</span>
            <span className="dot">•</span>
            <span>May 2026</span>
          </div>
          <div className="footer-badges">
            <span className="footer-badge"><Shield size={12} /> SECURE PIPELINE</span>
            <span className="footer-badge"><CheckCircle size={12} /> VERIFIED ROLES</span>
            <span className="footer-badge"><Zap size={12} /> AI POWERED</span>
          </div>
        </div>
      </footer>

      <style>{`
        .main-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .page-header {
          text-align: center;
          margin-bottom: 2.5rem;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -1.2px;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-header p {
          font-size: 1.05rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }

        .post-job-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: var(--primary-bright);
          padding: 0.6rem 1.25rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .post-job-trigger:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
        }

        .board-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.95fr;
          gap: 2rem;
          align-items: start;
        }

        .list-column {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .inspector-column {
          position: sticky;
          top: 1.5rem;
        }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(4, 6, 12, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }

        .post-modal {
          max-width: 640px;
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #0d1222;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
        }

        .shield-modal {
          color: var(--primary-bright);
        }

        .modal-title-wrapper h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .modal-close {
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
        }

        .modal-close:hover {
          color: white;
        }

        .modal-form {
          padding: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          text-align: left;
        }

        .form-group.full-width {
          grid-column: span 2;
        }

        .form-group label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .form-group input, .form-group select, .form-group textarea {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.6rem 0.75rem;
          font-size: 0.85rem;
          color: white;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: var(--primary-bright);
        }

        .form-group select {
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
        }

        .modal-cancel-btn {
          padding: 0.6rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          transition: background var(--transition-fast);
        }

        .modal-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .modal-submit-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          padding: 0.6rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background var(--transition-fast);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .modal-submit-btn:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        .modal-submit-btn:disabled {
          background: var(--text-dark);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .app-footer {
          margin-top: 4rem;
          border-top: 1px solid var(--border-color);
          padding-top: 2rem;
        }

        .footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-dark);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .footer-credits {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer-credits .dot {
          color: var(--border-color-hover);
        }

        .footer-badges {
          display: flex;
          gap: 0.75rem;
        }

        .footer-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 0.3rem 0.65rem;
          border-radius: 4px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        @media (max-width: 968px) {
          .board-grid {
            grid-template-columns: 1fr;
          }
          .inspector-column {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .page-header h1 {
            font-size: 2rem;
          }
          .footer-inner {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .form-group.full-width {
            grid-column: span 1;
          }
        }

        /* Recruiter View Styles */
        .recruiter-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .recruiter-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2rem;
          align-items: start;
        }

        .recruiter-form-panel, .recruiter-feed-panel {
          padding: 1.5rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .panel-icon {
          color: var(--primary-bright);
        }

        .panel-icon.text-green {
          color: var(--score-high);
        }

        .panel-header h3, .panel-header h4 {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .recruiter-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .recruiter-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          width: 100%;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background var(--transition-fast);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .recruiter-submit-btn:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        .recruiter-submit-btn:disabled {
          background: var(--text-dark);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }

        .recruiter-job-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 580px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .recruiter-job-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          text-align: left;
        }

        .recruiter-job-card:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: var(--border-color-hover);
          transform: translateY(-1px);
        }

        .recruiter-job-card.active {
          border-color: var(--primary-bright);
          background: rgba(99, 102, 241, 0.05);
        }

        .recruiter-job-card h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .company-text {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-dark);
          margin-top: 0.25rem;
        }

        .score-badge {
          font-weight: 600;
          color: var(--text-muted);
        }

        .no-jobs-text {
          color: var(--text-muted);
          font-size: 0.85rem;
          text-align: center;
          padding: 2rem 0;
        }

        .recruiter-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .recruiter-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 2rem;
          align-items: start;
        }
        .recruiter-form-panel, .recruiter-feed-panel {
          padding: 1.5rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }
        .panel-icon {
          color: var(--primary-bright);
        }
        .panel-icon.text-green {
          color: var(--score-high);
        }
        .panel-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .recruiter-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .recruiter-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          width: 100%;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background var(--transition-fast);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }
        .recruiter-submit-btn:hover:not(:disabled) {
          background: var(--primary-hover);
        }
        .recruiter-submit-btn:disabled {
          background: var(--text-dark);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }
        .recruiter-jobs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 580px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .recruiter-job-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          text-align: left;
        }
        .recruiter-job-card:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: var(--border-color-hover);
          transform: translateY(-1px);
        }
        .recruiter-job-card.active {
          border-color: var(--primary-bright);
          background: rgba(99, 102, 241, 0.05);
        }
        .recruiter-job-card h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: white;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .company-text {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-dark);
          margin-top: 0.25rem;
        }
        .score-badge {
          font-weight: 600;
          color: var(--text-muted);
        }
        .no-jobs-text {
          color: var(--text-muted);
          font-size: 0.85rem;
          text-align: center;
          padding: 2rem 0;
        }

        @media (max-width: 968px) {
          .recruiter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
