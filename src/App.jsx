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

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formCategory, setFormCategory] = useState('Software Engineering');
  const [formRecruiter, setFormRecruiter] = useState('');
  const [formDesc, setFormDesc] = useState('');

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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: formTitle,
        company: formCompany,
        location: formLocation,
        salary: formSalary,
        category: formCategory,
        recruiterInfo: formRecruiter,
        description: formDesc
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
        setShowPostModal(false);
        setIsSubmitting(false);

        // Reset fields
        setFormTitle('');
        setFormCompany('');
        setFormLocation('');
        setFormSalary('');
        setFormRecruiter('');
        setFormDesc('');

        alert(`AI Scan Complete! Vetted with a trust score of ${newJob.trustScore}% (${newJob.status}).`);
      })
      .catch((err) => {
        console.error('Post job failed:', err);
        alert('Server is offline. To submit live postings, make sure your server is running on port 5000.');
        setIsSubmitting(false);
      });
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
              
              <button className="post-job-trigger" onClick={() => setShowPostModal(true)}>
                <Plus size={16} />
                <span>Post & AI-Vet Job</span>
              </button>
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
        ) : (
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
        )}
      </main>

      {/* Post Job Modal */}
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
      )}

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
      `}</style>
    </div>
  );
}

export default App;
