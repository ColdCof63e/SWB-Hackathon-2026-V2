import React, { useState } from 'react';
import Navbar from './components/Navbar';
import StatsBanner from './components/StatsBanner';
import JobList from './components/JobList';
import JobInspector from './components/JobInspector';
import JobScanner from './components/JobScanner';
import { mockJobs } from './data/mockJobs';
import { Shield, CheckCircle, Zap } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'scanner'
  const [selectedJob, setSelectedJob] = useState(mockJobs[0]); // default to first job

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
            </header>

            {/* Statistics Dashboard */}
            <StatsBanner />

            {/* Main Interactive Grid */}
            <div className="board-grid">
              <div className="list-column">
                <JobList 
                  jobs={mockJobs} 
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
          min-width: 0; /* Prevents overflow issues */
        }

        .inspector-column {
          position: sticky;
          top: 1.5rem;
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
        }
      `}</style>
    </div>
  );
}

export default App;
