import React, { useEffect, useState } from 'react';
import { ShieldCheck, LayoutGrid, Briefcase, X, ChevronRight } from 'lucide-react';

export default function WelcomeModal({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade out animation
  };

  return (
    <div className={`modal-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`welcome-modal glass ${isVisible ? 'visible' : ''}`}>
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>

        <div className="welcome-header">
          <div className="welcome-icon-wrapper">
            <ShieldCheck size={32} className="welcome-primary-icon" />
          </div>
          <h2>Welcome to Aegis</h2>
          <p>Your AI-powered remote job legitimacy filter.</p>
        </div>

        <div className="welcome-features">
          <div className="welcome-feature">
            <div className="feature-icon-box scanner-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div className="feature-text">
              <h4>Interactive Security Scanner</h4>
              <p>Paste job descriptions or emails to instantly check for payment scams and domain spoofing.</p>
            </div>
          </div>

          <div className="welcome-feature">
            <div className="feature-icon-box board-icon-box">
              <LayoutGrid size={24} />
            </div>
            <div className="feature-text">
              <h4>Verified Jobs Board</h4>
              <p>Browse high-quality, AI-vetted remote opportunities free from low-quality listings.</p>
            </div>
          </div>

          <div className="welcome-feature">
            <div className="feature-icon-box recruiter-icon-box">
              <Briefcase size={24} />
            </div>
            <div className="feature-text">
              <h4>Recruiter Console</h4>
              <p>Verified companies can securely post and auto-vet their open roles.</p>
            </div>
          </div>
        </div>

        <div className="welcome-footer">
          <button className="primary-btn pulse-btn" onClick={handleClose}>
            Get Started <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
