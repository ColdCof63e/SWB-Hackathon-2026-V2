import React from 'react';
import { MapPin, DollarSign, Calendar, ArrowRight, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export default function JobCard({ job, onSelect, isSelected }) {
  const { title, company, companyInitials, location, salary, postedDate, trustScore, status, category } = job;

  // Determine styles and icons based on status
  let statusClass = 'status-neutral';
  let glowClass = 'glow-blue';
  let ShieldIcon = Shield;

  if (status === 'Verified') {
    statusClass = 'status-high';
    glowClass = 'glow-green';
    ShieldIcon = ShieldCheck;
  } else if (status === 'Suspicious') {
    statusClass = 'status-mid';
    glowClass = 'glow-gold';
    ShieldIcon = Shield;
  } else if (status === 'Scam') {
    statusClass = 'status-low';
    glowClass = 'glow-red';
    ShieldIcon = ShieldAlert;
  }

  return (
    <div 
      className={`job-card glass ${isSelected ? 'selected' : ''} ${glowClass} animate-fade-in`}
      onClick={() => onSelect(job)}
    >
      <div className="card-top">
        <div className="company-logo-badge">
          <div className={`company-avatar ${statusClass}`}>
            {companyInitials}
          </div>
          <div className="title-section">
            <h3 className="job-title">{title}</h3>
            <span className="company-name">{company}</span>
          </div>
        </div>
        <div className={`trust-badge ${statusClass}`}>
          <ShieldIcon className="shield-icon" size={15} />
          <span>{trustScore}% Trust</span>
        </div>
      </div>

      <p className="job-excerpt">
        {job.description.length > 140 ? `${job.description.substring(0, 140)}...` : job.description}
      </p>

      <div className="card-footer">
        <div className="meta-info">
          <span className="meta-item">
            <MapPin size={14} />
            {location}
          </span>
          <span className="meta-item">
            <DollarSign size={14} />
            {salary}
          </span>
          <span className="meta-item">
            <Calendar size={14} />
            {postedDate}
          </span>
        </div>
        
        <button className="inspect-btn" onClick={(e) => {
          e.stopPropagation();
          onSelect(job);
        }}>
          <span>Inspect</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <style>{`
        .job-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          text-align: left;
          cursor: pointer;
          border-radius: var(--radius-md);
          position: relative;
          overflow: hidden;
        }

        /* Subtle glowing borders matching trust levels on hover */
        .job-card.glow-green:hover, .job-card.glow-green.selected {
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.12);
          transform: translateY(-2px);
        }
        .job-card.glow-gold:hover, .job-card.glow-gold.selected {
          border-color: rgba(245, 158, 11, 0.4);
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.12);
          transform: translateY(-2px);
        }
        .job-card.glow-red:hover, .job-card.glow-red.selected {
          border-color: rgba(244, 63, 94, 0.4);
          box-shadow: 0 4px 20px rgba(244, 63, 94, 0.12);
          transform: translateY(-2px);
        }
        .job-card.glow-blue:hover, .job-card.glow-blue.selected {
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.12);
          transform: translateY(-2px);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .company-logo-badge {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .company-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.5px;
        }

        .title-section {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .job-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
        }

        .company-name {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .shield-icon {
          flex-shrink: 0;
        }

        .job-excerpt {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          margin-top: auto;
          gap: 1rem;
        }

        .meta-info {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .inspect-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-fast), border-color var(--transition-fast);
          white-space: nowrap;
        }

        .job-card:hover .inspect-btn {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        @media (max-width: 640px) {
          .card-top {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .trust-badge {
            margin-top: 0.5rem;
          }
          
          .card-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .inspect-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
