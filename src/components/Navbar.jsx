import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="navbar glass animate-fade-in">
      <div className="nav-brand">
        <div className="logo-icon-container">
          <ShieldCheck className="logo-icon" size={28} />
        </div>
        <div className="brand-text">
          <span className="brand-name">Aegis</span>
          <span className="brand-tagline">AI Job Legitimacy Filter</span>
        </div>
      </div>

      <div className="nav-links">
        <button 
          className={`nav-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          AI Job Scanner
        </button>
        <button 
          className={`nav-btn ${activeTab === 'board' ? 'active' : ''}`}
          onClick={() => setActiveTab('board')}
        >
          Jobs Board
        </button>
        <button className={`nav-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
        onClick={() => setActiveTab('recruiter')}>
          Recruiter Console
        </button>
      </div>

      <div className="nav-status">
        <div className="status-dot"></div>
        {/* <span className="status-text">Engine Online</span>
        <Cpu className="status-icon" size={16} /> */}
      </div>

      <style>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          margin-top: 1.5rem;
          margin-bottom: 2rem;
          border-radius: var(--radius-md);
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon-container {
          background: linear-gradient(135deg, var(--primary), var(--score-high));
          color: white;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.5px;
          background: linear-gradient(to right, #ffffff, #d1d5db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.35rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .nav-btn {
          padding: 0.5rem 1.25rem;
          border-radius: calc(var(--radius-sm) - 2px);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
          color: var(--text-muted);
        }

        .nav-btn:hover {
          color: var(--text-main);
        }

        .nav-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .nav-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.4rem 0.8rem;
          border-radius: 50px;
          color: var(--score-high);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: var(--score-high);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--score-high);
          animation: pulse-glow 2s infinite ease-in-out;
        }

        .status-icon {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .navbar {
            flex-direction: column;
            gap: 1rem;
            padding: 1.25rem;
          }
          
          .nav-status {
            display: none; /* Hide on small screens for cleaner UI */
          }
        }
      `}</style>
    </nav>
  );
}
