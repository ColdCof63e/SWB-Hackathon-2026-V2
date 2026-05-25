import React from 'react';
import { DollarSign, Calendar, ArrowRight, ShieldCheck, ShieldAlert, Shield, Heart } from 'lucide-react';

export default function JobCard({ job, onSelect, isSelected, isBookmarked = false, onToggleBookmark = () => {} }) {
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

  // Heuristic work mode detection for badge
  const isTrulyRemote = job.aiDetails ? job.aiDetails.isRemote : !['hybrid', 'onsite', 'on-site', 'in-office', 'in office', 'in-person'].some(term => location.toLowerCase().includes(term));
  let workModeBadge = null;
  if (!isTrulyRemote) {
    workModeBadge = (
      <span className="workmode-badge onsite">
        <span style={{ marginRight: '0.2rem' }}>⚠️</span> Hybrid / Onsite
      </span>
    );
  } else {
    const locLower = location.toLowerCase();
    let flag = '🌍';
    let label = 'Remote (Global)';
    if (locLower.includes('us') || locLower.includes('united states') || locLower.includes('america')) {
      flag = '🇺🇸';
      label = 'Remote (US)';
    } else if (locLower.includes('canada') || locLower.includes('ca')) {
      flag = '🇨🇦';
      label = 'Remote (Canada)';
    } else if (locLower.includes('uk') || locLower.includes('united kingdom') || locLower.includes('london')) {
      flag = '🇬🇧';
      label = 'Remote (UK)';
    }
    workModeBadge = (
      <span className="workmode-badge remote">
        <span style={{ marginRight: '0.2rem' }}>{flag}</span> {label}
      </span>
    );
  }

  // Decode double-encoded HTML entity listings and strip markup for card excerpt
  const cleanDescription = React.useMemo(() => {
    if (!job.description) return '';
    let prev;
    let decoded = job.description;
    let iterations = 0;
    do {
      prev = decoded;
      decoded = decoded
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&middot;/g, '·')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
      iterations++;
    } while (decoded !== prev && iterations < 4);
    
    return decoded
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [job.description]);

  // Tech stack tags extraction
  const commonTech = ['React', 'Angular', 'Vue', 'Node.js', 'Express', 'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', 'TypeScript', 'JavaScript', 'Rust', 'Go', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'Figma', 'GitHub', 'CI/CD'];
  const descriptionLower = cleanDescription.toLowerCase();
  const techTags = commonTech.filter(tech => {
    const escaped = tech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(descriptionLower);
  }).slice(0, 3);

  return (
    <div 
      className={`job-card glass ${isSelected ? 'selected' : ''} ${glowClass} animate-fade-in`}
      onClick={() => onSelect(job)}
      style={{ position: 'relative' }}
    >
      {/* Heart bookmark toggle button */}
      <button 
        className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark(job.id);
        }}
      >
        <Heart size={18} fill={isBookmarked ? '#f43f5e' : 'none'} />
      </button>

      <div className="card-top">
        <div className="company-logo-badge">
          <div className={`company-avatar ${statusClass}`}>
            {companyInitials}
          </div>
          <div className="title-section">
            <h3 className="job-title" style={{ paddingRight: '2rem' }}>{title}</h3>
            <span className="company-name">{company}</span>
          </div>
        </div>
        <div className={`trust-badge ${statusClass}`} style={{ marginRight: '1.5rem' }}>
          <ShieldIcon className="shield-icon" size={15} />
          <span>{trustScore}% Trust</span>
        </div>
      </div>

      <p className="job-excerpt">
        {cleanDescription.length > 140 ? `${cleanDescription.substring(0, 140)}...` : cleanDescription}
      </p>

      {/* Tech tags list */}
      {techTags.length > 0 && (
        <div className="tech-tags">
          {techTags.map(tech => (
            <span key={tech} className="tech-tag">{tech}</span>
          ))}
        </div>
      )}

      <div className="card-footer">
        <div className="meta-info">
          {workModeBadge}
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
          flex-shrink: 0;
        }

        .bookmark-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: none;
          border: none;
          color: var(--text-dark);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast), transform 0.2s;
        }

        .bookmark-btn:hover {
          color: #f43f5e;
          transform: scale(1.15);
        }

        .bookmark-btn.active {
          color: #f43f5e;
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

        .tech-tags {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-top: -0.25rem;
        }

        .tech-tag {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 50px;
          padding: 0.15rem 0.5rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .workmode-badge {
          display: flex;
          align-items: center;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .workmode-badge.onsite {
          color: #f43f5e;
        }

        .workmode-badge.remote {
          color: var(--primary-bright);
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

