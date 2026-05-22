import React, { useState } from 'react';
import { Cpu, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export default function JobScanner() {
  const [description, setDescription] = useState('');
  const [recruiterInfo, setRecruiterInfo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanningStep, setScanningStep] = useState('');

  // Quick Preset Samples for Testing/Demoing
  const loadPreset = (type) => {
    if (type === 'scam') {
      setDescription(
        `WORK FROM HOME DATA ENTRY REPRESENTATIVE NEEDED URGENTLY!\n\n` +
        `We are looking for self-motivated individuals to fill out our Data Entry Clerk position. This is a 100% remote job where you can work from any location of your choice.\n\n` +
        `Salary: $48.00 per hour\n` +
        `Hours: Flexible (Part-time / Full-time)\n` +
        `Experience: None required. Training will be provided.\n\n` +
        `REQUIREMENTS & EQUIPMENT:\n` +
        `We will provide a certified company check to purchase your home office equipment (Apple MacBook Pro, printer, and scanning software) from our registered vendor. Do not buy them yourself.\n\n` +
        `HOW TO APPLY:\n` +
        `To set up an immediate text interview, download the Telegram app and add our Hiring Manager, Dr. Sarah Jenkins, using username @ApexGlobalRecruit.`
      );
      setRecruiterInfo('sarah.jenkins@gmail.com');
    } else if (type === 'verified') {
      setDescription(
        `React Frontend Developer\n` +
        `Quantum Scale Inc. - Remote (US/Canada Remote)\n` +
        `Base Salary: $90,000 - $115,000 + Medical Benefits + 401(k) Matching\n\n` +
        `Quantum Scale is a modern B2B analytics platform. We are seeking a React specialist to build high-performance data dashboards. This role reports to the Engineering Director.\n\n` +
        `KEY RESPONSIBILITIES:\n` +
        `- Build responsive web applications using React, TypeScript, and CSS modules.\n` +
        `- Collaborate with UI/UX designers using Figma layouts.\n` +
        `- Test frontend components using Jest and React Testing Library.\n\n` +
        `REQUIREMENTS:\n` +
        `- 3+ years of professional React experience.\n` +
        `- Experience with modern state management (Redux, Zustand, or Context API).\n\n` +
        `INTERVIEW PROCESS:\n` +
        `1. 30-min Zoom call with Recruiter\n` +
        `2. Technical panel walkthrough of a GitHub repository\n` +
        `3. System architecture round.`
      );
      setRecruiterInfo('hiring@quantumscale.io');
    }
  };

  const handleScan = () => {
    if (!description.trim()) {
      alert('Please paste a job description first.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    // Multi-step mock AI thinking process
    const steps = [
      'Initializing semantic parsers...',
      'Checking database for company footprint...',
      'Running scam pattern heuristic checks...',
      'Analyzing communication channel risks...',
      'Calibrating compensation with market averages...',
      'Generating safety audit report...'
    ];

    let currentStep = 0;
    setScanningStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setScanningStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        performAnalysis();
      }
    }, 400);
  };

  const performAnalysis = () => {
    const descLower = description.toLowerCase();
    const contactLower = recruiterInfo.toLowerCase();

    let score = 100;
    const redFlags = [];
    const greenFlags = [];
    let domainAge = 'Unknown (No URL provided)';
    let recruiterEmailStatus = 'Not provided';
    let interviewChannel = 'Not specified';
    let equipmentPolicy = 'Not specified';
    let marketMatch = 'Aligned';

    // 1. Recruiter Email check
    if (recruiterInfo) {
      if (contactLower.includes('gmail.com') || contactLower.includes('yahoo.com') || contactLower.includes('outlook.com') || contactLower.includes('hotmail.com')) {
        score -= 15;
        redFlags.push('Recruiter uses a free public email address (Gmail/Yahoo/Outlook) rather than an official company domain.');
        recruiterEmailStatus = 'Flagged (Public email)';
      } else {
        greenFlags.push('Recruiter contact domain matches potential enterprise email structures.');
        recruiterEmailStatus = 'Enterprise domain detected';
      }
    }

    // 2. Telegram / Signal / Insecure Chat check
    if (descLower.includes('telegram') || descLower.includes('signal app') || descLower.includes('@telegram') || descLower.includes('telegram app')) {
      score -= 35;
      redFlags.push('Interview process requests using Telegram, a highly anonymous, encrypted messaging app frequently used by recruiters spoofing positions.');
      interviewChannel = 'High Risk (Telegram Text Interview)';
    } else if (descLower.includes('whatsapp') || descLower.includes('whatsapp app')) {
      score -= 20;
      redFlags.push('Recruiter requests using WhatsApp, which bypasses formal corporate applicant tracking networks.');
      interviewChannel = 'Suspicious (WhatsApp Chat)';
    } else if (descLower.includes('zoom') || descLower.includes('google meet') || descLower.includes('teams') || descLower.includes('webex')) {
      greenFlags.push('Specifies standard video interview platforms (Zoom, Google Meet, or Microsoft Teams).');
      interviewChannel = 'Standard Video Interview';
    } else {
      score -= 10;
      redFlags.push('No formal video conference interviews or live systems are mentioned.');
      interviewChannel = 'Unspecified';
    }

    // 3. Equipment check check (Certified check scam)
    if (descLower.includes('send check') || descLower.includes('send you a check') || descLower.includes('certified check') || descLower.includes('buy equipment') || descLower.includes('purchase equipment') || descLower.includes('laptop and printer') || descLower.includes('buy laptop')) {
      score -= 40;
      redFlags.push('Classic check-cashing scheme detected: requests depositing a check from the company to buy equipment from a "trusted vendor".');
      equipmentPolicy = 'High Risk (Certified Check Equipment Policy)';
    } else if (descLower.includes('provide') || descLower.includes('ship') || descLower.includes('equipment is provided')) {
      greenFlags.push('Mentions direct company provision/shipping of hardware gear.');
      equipmentPolicy = 'Standard direct provision';
    }

    // 4. Hourly wages vs experience
    if ((descLower.includes('$40') || descLower.includes('$45') || descLower.includes('$48') || descLower.includes('$50') || descLower.includes('$60')) && 
        (descLower.includes('data entry') || descLower.includes('assistant') || descLower.includes('clerk') || descLower.includes('no experience'))) {
      score -= 20;
      redFlags.push('Unrealistic salary: Entry-level clerical or administrative work offering $40-$60/hour is highly anomalous and indicates a bait-and-switch.');
      marketMatch = 'Highly anomalous (Unreasonably high pay for role requirements)';
    }

    // 5. Positive items
    if (descLower.includes('401k') || descLower.includes('medical') || descLower.includes('matching') || descLower.includes('benefits') || descLower.includes('insurance')) {
      greenFlags.push('Mentions standard corporate employee benefits (401k, health coverage).');
    }
    if (descLower.includes('github') || descLower.includes('typescript') || descLower.includes('figma')) {
      greenFlags.push('Mentions specific professional collaboration suites and technical stack parameters.');
    }

    // Adjust final limits
    score = Math.max(10, Math.min(100, score));

    // Determine status
    let status = 'Verified';
    let overallVerdict = 'This job description shows standard professional qualities and lacks common remote job fraud indicators.';
    if (score < 50) {
      status = 'Scam';
      overallVerdict = 'Dangerous. Multiple scam patterns identified, including check-deposit fraud and anonymous chat redirection. DO NOT apply or share personal documentation.';
    } else if (score < 85) {
      status = 'Suspicious';
      overallVerdict = 'Caution advised. Some unverified credentials or generic communication methods are flagged. Validate the company\'s official website independently.';
    }

    // Domain Age Simulation based on email
    if (recruiterInfo && !recruiterEmailStatus.includes('Flagged')) {
      domainAge = '3 years (Verified Resolve)';
    }

    setScanResult({
      score,
      status,
      overallVerdict,
      redFlags,
      greenFlags,
      metrics: {
        domainAge,
        recruiterEmailStatus,
        interviewChannel,
        equipmentPolicy,
        marketMatch
      }
    });
    setIsScanning(false);
  };

  const handleReset = () => {
    setDescription('');
    setRecruiterInfo('');
    setScanResult(null);
  };

  return (
    <div className="job-scanner-container animate-fade-in">
      <div className="scanner-layout">
        {/* Scanner Inputs Card */}
        <div className="scanner-inputs glass">
          <div className="card-header-sparkle">
            <Sparkles className="sparkle-icon" size={18} />
            <h3>Real-time Job Legitimacy Scanner</h3>
          </div>

          <p className="scanner-intro">
            Paste a full job listing text block and optional metadata to test if the position is legitimate, unverified, or a phishing scam.
          </p>

          <div className="input-group">
            <label className="input-label">Job Posting Text</label>
            <textarea
              className="scan-textarea"
              placeholder="Paste the entire job posting description here (requirements, salary details, company summary)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={12}
            />
          </div>

          <div className="inputs-row">
            <div className="input-group">
              <label className="input-label">Recruiter Contact / Email (Optional)</label>
              <input
                type="text"
                className="scan-input"
                placeholder="e.g., hr@company.com or john.doe@gmail.com"
                value={recruiterInfo}
                onChange={(e) => setRecruiterInfo(e.target.value)}
              />
            </div>
          </div>

          <div className="preset-row">
            <span className="preset-label">Test Samples:</span>
            <button className="preset-btn btn-scam" onClick={() => loadPreset('scam')}>
              Load Telegram Equipment Scam
            </button>
            <button className="preset-btn btn-verified" onClick={() => loadPreset('verified')}>
              Load Verified React Developer
            </button>
          </div>

          <div className="scanner-actions">
            <button className="reset-action-btn" onClick={handleReset}>
              <RefreshCw size={14} />
              Reset Inputs
            </button>
            <button className="scan-action-btn" onClick={handleScan} disabled={isScanning}>
              <Cpu size={16} />
              <span>{isScanning ? 'Running Scan...' : 'Analyze Job Legitimacy'}</span>
            </button>
          </div>
        </div>

        {/* Scanner Results Panel */}
        <div className="scanner-results">
          {isScanning ? (
            <div className="scanner-loading glass">
              <div className="loading-spinner"></div>
              <h4>AI Verification Active</h4>
              <p className="loading-step-text">{scanningStep}</p>
            </div>
          ) : scanResult ? (
            <div className="scan-report glass">
              <div className="report-header">
                <div className="report-title-block">
                  <FileText className="report-icon" size={20} />
                  <h3>Legitimacy Audit Report</h3>
                </div>
                <span className={`status-badge-small ${
                  scanResult.status === 'Verified' ? 'status-high' : 
                  scanResult.status === 'Suspicious' ? 'status-mid' : 'status-low'
                }`}>
                  {scanResult.status}
                </span>
              </div>

              {/* Gauge rating */}
              <div className="report-rating-card">
                <div className="rating-gauge-bar">
                  <div className="gauge-outer">
                    <div 
                      className={`gauge-inner ${
                        scanResult.status === 'Verified' ? 'status-high' : 
                        scanResult.status === 'Suspicious' ? 'status-mid' : 'status-low'
                      }`}
                      style={{ width: `${scanResult.score}%` }}
                    />
                  </div>
                  <div className="gauge-labels">
                    <span className="score-number-big">{scanResult.score}%</span>
                    <span className="score-description">AI Trust Score</span>
                  </div>
                </div>
                <p className="verdict-summary-p">{scanResult.overallVerdict}</p>
              </div>

              {/* Parsed Attributes */}
              <div className="report-metrics-grid">
                <div className="metric-box">
                  <span className="box-lbl">Recruiter Email Domain</span>
                  <span className="box-val">{scanResult.metrics.recruiterEmailStatus}</span>
                </div>
                <div className="metric-box">
                  <span className="box-lbl">Interview Mode</span>
                  <span className="box-val">{scanResult.metrics.interviewChannel}</span>
                </div>
                <div className="metric-box">
                  <span className="box-lbl">Equipment Handling</span>
                  <span className="box-val">{scanResult.metrics.equipmentPolicy}</span>
                </div>
                <div className="metric-box">
                  <span className="box-lbl">Salary Market Check</span>
                  <span className="box-val">{scanResult.metrics.marketMatch}</span>
                </div>
              </div>

              {/* Indicators */}
              <div className="indicators-panel">
                {scanResult.redFlags.length > 0 && (
                  <div className="indicators-group flagged">
                    <span className="group-header text-red">
                      <ShieldAlert size={14} /> Danger Signals Detected ({scanResult.redFlags.length})
                    </span>
                    <ul className="flag-bullet-list">
                      {scanResult.redFlags.map((flag, i) => (
                        <li key={i} className="flag-item">
                          <AlertTriangle className="bullet-indicator text-red" size={13} />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scanResult.greenFlags.length > 0 && (
                  <div className="indicators-group verified">
                    <span className="group-header text-green">
                      <ShieldCheck size={14} /> Trust Anchors Detected ({scanResult.greenFlags.length})
                    </span>
                    <ul className="flag-bullet-list">
                      {scanResult.greenFlags.map((flag, i) => (
                        <li key={i} className="flag-item">
                          <CheckCircle className="bullet-indicator text-green" size={13} />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="scanner-results-empty glass">
              <Cpu className="empty-icon" size={48} />
              <h4>Scan Results Pending</h4>
              <p>Enter the remote job description text in the input card and run the analysis tool to trigger the safety inspection report.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .job-scanner-container {
          width: 100%;
        }

        .scanner-layout {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 1.5rem;
          align-items: start;
        }

        .scanner-inputs, .scan-report, .scanner-results-empty, .scanner-loading {
          padding: 1.5rem;
          text-align: left;
          border-radius: var(--radius-md);
        }

        .card-header-sparkle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: white;
        }

        .sparkle-icon {
          color: var(--primary-bright);
        }

        .card-header-sparkle h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .scanner-intro {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .input-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .scan-textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
          font-size: 0.9rem;
          line-height: 1.5;
          outline: none;
          resize: vertical;
          transition: border-color var(--transition-fast);
        }

        .scan-textarea:focus, .scan-input:focus {
          border-color: var(--primary-bright);
        }

        .inputs-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .scan-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.65rem 0.75rem;
          font-size: 0.9rem;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .preset-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          margin: 1.25rem 0;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .preset-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .preset-btn {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.35rem 0.65rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
        }

        .preset-btn.btn-scam {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: var(--score-low);
        }

        .preset-btn.btn-scam:hover {
          background: var(--score-low-bg);
          color: white;
        }

        .preset-btn.btn-verified {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--score-high);
        }

        .preset-btn.btn-verified:hover {
          background: var(--score-high-bg);
          color: white;
        }

        .scanner-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.25rem;
          gap: 1rem;
        }

        .reset-action-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.5rem;
        }

        .reset-action-btn:hover {
          color: white;
        }

        .scan-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .scan-action-btn:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        .scan-action-btn:disabled {
          background: var(--text-dark);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        /* Results pane empty state */
        .scanner-results-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.85rem;
          height: 100%;
          min-height: 380px;
        }

        .empty-icon {
          color: var(--text-dark);
          animation: pulse-glow 3s infinite ease-in-out;
        }

        .scanner-results-empty h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .scanner-results-empty p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 280px;
        }

        /* Loading panel */
        .scanner-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1rem;
          height: 100%;
          min-height: 380px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary-bright);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .scanner-loading h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .loading-step-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-family: monospace;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.35rem 0.75rem;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }

        /* Report layout */
        .scan-report {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .report-title-block {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
        }

        .report-icon {
          color: var(--primary-bright);
        }

        .report-title-block h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .status-badge-small {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: 50px;
          text-transform: uppercase;
        }

        .report-rating-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(0,0,0,0.15);
          border: 1px solid var(--border-color);
          padding: 1.25rem;
          border-radius: var(--radius-sm);
        }

        .rating-gauge-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .gauge-outer {
          height: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 5px;
          flex-grow: 1;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .gauge-inner {
          height: 100%;
          border-radius: 5px;
          transition: width 1s ease-out;
        }

        .gauge-labels {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.1;
          flex-shrink: 0;
        }

        .score-number-big {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
        }

        .score-description {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .verdict-summary-p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .report-metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          background: rgba(255,255,255,0.01);
          border: 1px solid rgba(255,255,255,0.03);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
        }

        .box-lbl {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .box-val {
          font-size: 0.8rem;
          font-weight: 700;
          color: white;
        }

        .indicators-panel {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .indicators-group {
          padding: 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
        }

        .indicators-group.flagged {
          background: rgba(244, 63, 94, 0.03);
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        .indicators-group.verified {
          background: rgba(16, 185, 129, 0.03);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .group-header {
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.5rem;
        }

        .text-red { color: var(--score-low); }
        .text-green { color: var(--score-high); }

        .flag-bullet-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .flag-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          line-height: 1.4;
          color: var(--text-muted);
        }

        .bullet-indicator {
          flex-shrink: 0;
          margin-top: 2px;
        }

        @media (max-width: 900px) {
          .scanner-layout {
            grid-template-columns: 1fr;
          }
          .scanner-results-empty, .scanner-loading {
            min-height: auto;
            padding: 2.5rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
