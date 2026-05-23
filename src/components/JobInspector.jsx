import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Info, Building, Mail, Calendar, Compass, ShieldAlert as AlertIcon, ExternalLink } from 'lucide-react';

export default function JobInspector({ job, onClose }) {
  if (!job) {
    return (
      <div className="inspector-placeholder glass animate-fade-in">
        <ShieldCheck className="placeholder-icon" size={48} />
        <h4>Legitimacy Audit Inspector</h4>
        <p>Select any remote job listing from the board to run the AI security audit. The inspector will analyze the hiring team's credentials, recruitment communication channels, and flag risk indicators.</p>
      </div>
    );
  }

  const { title, company, trustScore, status, category, description, aiDetails } = job;

  let statusClass = 'status-neutral';
  let bannerClass = 'banner-blue';
  if (status === 'Verified') {
    statusClass = 'status-high';
    bannerClass = 'banner-green';
  } else if (status === 'Suspicious') {
    statusClass = 'status-mid';
    bannerClass = 'banner-gold';
  } else if (status === 'Scam') {
    statusClass = 'status-low';
    bannerClass = 'banner-red';
  }

  return (
    <div className="job-inspector glass animate-fade-in">
      {/* Inspector Header */}
      <div className={`inspector-header ${bannerClass}`}>
        <div className="header-meta">
          <span className="category-tag">{category}</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <h2 className="inspector-title">{title}</h2>
        <span className="inspector-company">{company}</span>
      </div>

      <div className="inspector-content">
        {/* Trust Score Radial Card */}
        <div className="trust-score-card">
          <div className="radial-score-container">
            <div className={`radial-score ${statusClass}`}>
              <span className="score-num">{trustScore}%</span>
              <span className="score-lbl">Trust Index</span>
            </div>
          </div>
          <div className="verdict-text-block">
            <h4>Safety Assessment</h4>
            <p>{aiDetails.overallVerdict}</p>
          </div>
        </div>

        {/* Audit Details */}
        <div className="audit-section">
          <h3 className="section-title"><Compass size={16} /> Technical Footprint Audit</h3>
          <div className="audit-grid">
            <div className="audit-item">
              <div className="audit-item-label">
                <Building size={14} className="audit-icon" />
                <span>Domain Registration Age</span>
              </div>
              <div className="audit-item-value">{aiDetails.domainAge}</div>
            </div>

            <div className="audit-item">
              <div className="audit-item-label">
                <Mail size={14} className="audit-icon" />
                <span>Recruiter Credentials</span>
              </div>
              <div className="audit-item-value">{aiDetails.recruiterEmail}</div>
            </div>

            <div className="audit-item">
              <div className="audit-item-label">
                <Calendar size={14} className="audit-icon" />
                <span>Interview Verification</span>
              </div>
              <div className="audit-item-value">{aiDetails.interviewChannel}</div>
            </div>

            <div className="audit-item">
              <div className="audit-item-label">
                <Info size={14} className="audit-icon" />
                <span>Equipment Policy</span>
              </div>
              <div className="audit-item-value">{aiDetails.equipmentClaim}</div>
            </div>

            <div className="audit-item text-long">
              <div className="audit-item-label">
                <DollarSignMock size={14} className="audit-icon" />
                <span>Salary Calibration</span>
              </div>
              <div className="audit-item-value">{aiDetails.marketMatch}</div>
            </div>

            <div className="audit-item text-long">
              <div className="audit-item-label">
                <Compass size={14} className="audit-icon" />
                <span>Cross-Portal Footprint</span>
              </div>
              <div className="audit-item-value">
                {aiDetails.metrics?.crossPortalIndex || aiDetails.crossPortalIndex || 'None Detected'}
              </div>
            </div>
          </div>
        </div>

        {/* Security Signals */}
        {(aiDetails.redFlags.length > 0 || aiDetails.greenFlags.length > 0) && (
          <div className="signals-section">
            {aiDetails.redFlags.length > 0 && (
              <div className="signal-block red">
                <h4 className="signal-title">
                  <ShieldAlert className="signal-icon" size={16} />
                  <span>AI Flagged Red Flags ({aiDetails.redFlags.length})</span>
                </h4>
                <ul className="signal-list">
                  {aiDetails.redFlags.map((flag, idx) => (
                    <li key={idx} className="signal-item">
                      <AlertTriangle className="bullet-icon-red" size={14} />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiDetails.greenFlags.length > 0 && (
              <div className="signal-block green">
                <h4 className="signal-title">
                  <ShieldCheck className="signal-icon" size={16} />
                  <span>Legitimacy Signals ({aiDetails.greenFlags.length})</span>
                </h4>
                <ul className="signal-list">
                  {aiDetails.greenFlags.map((flag, idx) => (
                    <li key={idx} className="signal-item">
                      <CheckCircle2 className="bullet-icon-green" size={14} />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="desc-section">
          <h3 className="section-title">Job Summary</h3>
          <p className="desc-text">{description}</p>
        </div>

        {/* Apply CTA */}
        <div className="cta-wrapper">
          <button 
            className={`apply-cta-btn ${status === 'Scam' ? 'disabled' : ''}`}
            disabled={status === 'Scam'}
            onClick={() => alert(status === 'Suspicious' ? 'Warning: You are visiting an unverified source. Please use caution when submitting private info.' : 'Redirecting securely to official application portal...')}
          >
            <span>{status === 'Scam' ? 'Flagged: Applying Disabled' : 'Apply Through Secure Pipeline'}</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .job-inspector {
          position: sticky;
          top: 1.5rem;
          display: flex;
          flex-direction: column;
          border-radius: var(--radius-md);
          overflow: hidden;
          max-height: calc(100vh - 12rem);
          height: 100%;
        }

        .inspector-placeholder {
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1rem;
          height: 380px;
          border-radius: var(--radius-md);
        }

        .placeholder-icon {
          color: var(--text-dark);
          animation: pulse-glow 3s infinite ease-in-out;
        }

        .inspector-placeholder h4 {
          font-size: 1.15rem;
          font-weight: 700;
          color: white;
        }

        .inspector-placeholder p {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 320px;
        }

        .inspector-header {
          padding: 1.5rem;
          text-align: left;
          position: relative;
        }

        .inspector-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, var(--border-color), transparent);
        }

        .banner-green {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
        }
        .banner-gold {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%);
        }
        .banner-red {
          background: linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, transparent 100%);
        }
        .banner-blue {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
        }

        .header-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .category-tag {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary-bright);
        }

        .close-btn {
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--text-muted);
          cursor: pointer;
          line-height: 1;
        }

        .close-btn:hover {
          color: white;
        }

        .inspector-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          line-height: 1.3;
          margin-bottom: 0.25rem;
        }

        .inspector-company {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .inspector-content {
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
        }

        .trust-score-card {
          display: flex;
          gap: 1.25rem;
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-color);
          padding: 1rem;
          border-radius: var(--radius-sm);
          align-items: center;
        }

        .radial-score-container {
          flex-shrink: 0;
        }

        .radial-score {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
        }

        .radial-score.status-high { box-shadow: 0 0 15px var(--score-high-glow), inset 0 0 8px var(--score-high-border); }
        .radial-score.status-mid { box-shadow: 0 0 15px var(--score-mid-glow), inset 0 0 8px var(--score-mid-border); }
        .radial-score.status-low { box-shadow: 0 0 15px var(--score-low-glow), inset 0 0 8px var(--score-low-border); }

        .score-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          line-height: 1.1;
        }

        .score-lbl {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .verdict-text-block {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .verdict-text-block h4 {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .verdict-text-block p {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .section-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        .audit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .audit-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          padding: 0.65rem;
          border-radius: var(--radius-sm);
        }

        .audit-item.text-long {
          grid-column: span 2;
        }

        .audit-item-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .audit-icon {
          color: var(--primary-bright);
        }

        .audit-item-value {
          font-size: 0.8rem;
          font-weight: 500;
          color: white;
        }

        .signal-block {
          border-radius: var(--radius-sm);
          padding: 1rem;
          margin-bottom: 0.75rem;
        }

        .signal-block.red {
          background: rgba(244, 63, 94, 0.04);
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .signal-block.green {
          background: rgba(16, 185, 129, 0.04);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .signal-title {
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.65rem;
        }

        .signal-block.red .signal-title { color: var(--score-low); }
        .signal-block.green .signal-title { color: var(--score-high); }

        .signal-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .signal-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .bullet-icon-red {
          color: var(--score-low);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .bullet-icon-green {
          color: var(--score-high);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .desc-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .cta-wrapper {
          margin-top: 0.5rem;
        }

        .apply-cta-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          padding: 0.85rem;
          font-weight: 600;
          font-size: 0.9rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background var(--transition-fast), box-shadow var(--transition-fast);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .apply-cta-btn:hover:not(:disabled) {
          background: var(--primary-hover);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }

        .apply-cta-btn.disabled {
          background: var(--text-dark);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 640px) {
          .audit-grid {
            grid-template-columns: 1fr;
          }
          .audit-item.text-long {
            grid-column: span 1;
          }
          .trust-score-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

// Simple internal helper component mock for DollarSign
function DollarSignMock({ size, className }) {
  return (
    <span className={className} style={{ fontSize: size, fontWeight: '700', lineHeight: 1 }}>$</span>
  );
}
