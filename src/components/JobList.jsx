import React, { useState, useMemo } from 'react';
import JobCard from './JobCard';
import { SlidersHorizontal } from 'lucide-react';

export default function JobList({ 
  jobs, 
  selectedJob, 
  onSelectJob,
  searchTerm,
  activeCategory,
  activeFilter
}) {
  // Sidebar filter states
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [minTrust, setMinTrust] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState(['Full-time', 'Part-time', 'Contract', 'Internship']);

  // Bookmarks persistence state
  const [bookmarkedJobs, setBookmarkedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('bookmarkedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleToggleBookmark = (id) => {
    const updated = bookmarkedJobs.includes(id)
      ? bookmarkedJobs.filter(bId => bId !== id)
      : [...bookmarkedJobs, id];
    setBookmarkedJobs(updated);
    localStorage.setItem('bookmarkedJobs', JSON.stringify(updated));
  };

  // Heuristic matching for job types
  const matchesJobType = (job) => {
    if (selectedTypes.length === 0 || selectedTypes.length === 4) return true;
    
    const descLower = job.description.toLowerCase();
    const titleLower = job.title.toLowerCase();
    
    return selectedTypes.some(type => {
      const typeLower = type.toLowerCase();
      if (typeLower === 'full-time' || typeLower === 'fulltime') {
        return descLower.includes('full-time') || descLower.includes('full time') || descLower.includes('fulltime') || titleLower.includes('full-time') || titleLower.includes('full time');
      }
      if (typeLower === 'part-time' || typeLower === 'parttime') {
        return descLower.includes('part-time') || descLower.includes('part time') || descLower.includes('parttime') || titleLower.includes('part-time') || titleLower.includes('part time');
      }
      if (typeLower === 'contract') {
        return descLower.includes('contract') || descLower.includes('contractor') || titleLower.includes('contract');
      }
      if (typeLower === 'internship' || typeLower === 'intern') {
        return descLower.includes('internship') || descLower.includes('intern ') || descLower.includes(' intern') || titleLower.includes('internship') || titleLower.includes('intern');
      }
      return false;
    });
  };

  // Filter jobs based on search, category, status, remoteOnly, savedOnly, minTrust, and job type
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = activeCategory === 'All' || job.category === activeCategory;
      
      let matchesFilter = true;
      if (activeFilter === 'Verified') matchesFilter = job.status === 'Verified';
      if (activeFilter === 'Suspicious') matchesFilter = job.status === 'Suspicious';
      if (activeFilter === 'Scam') matchesFilter = job.status === 'Scam';

      let matchesRemote = true;
      if (remoteOnly) {
        const isTrulyRemote = job.aiDetails ? job.aiDetails.isRemote : !['hybrid', 'onsite', 'on-site', 'in-office', 'in office', 'in-person'].some(term => job.location.toLowerCase().includes(term));
        matchesRemote = isTrulyRemote;
      }

      let matchesSaved = true;
      if (savedOnly) {
        matchesSaved = bookmarkedJobs.includes(job.id);
      }

      const matchesMinTrust = job.trustScore >= minTrust;
      const matchesType = matchesJobType(job);

      return matchesSearch && matchesCategory && matchesFilter && matchesRemote && matchesSaved && matchesMinTrust && matchesType;
    });
  }, [jobs, searchTerm, activeCategory, activeFilter, remoteOnly, savedOnly, minTrust, selectedTypes, bookmarkedJobs]);

  return (
    <div className="job-list-container">
      <div className="job-list-layout">
        
        {/* Left Sidebar Filter Panel */}
        <aside className="filters-sidebar glass animate-fade-in">
          <div className="sidebar-section">
            <h4>Quick Filters</h4>
            <div className="toggle-row">
              <span>Remote Only</span>
              <label className="switch-container">
                <input 
                  type="checkbox" 
                  checked={remoteOnly} 
                  onChange={(e) => setRemoteOnly(e.target.checked)} 
                />
                <span className="switch-slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <span>Saved Jobs</span>
              <label className="switch-container">
                <input 
                  type="checkbox" 
                  checked={savedOnly} 
                  onChange={(e) => setSavedOnly(e.target.checked)} 
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Trust Score Threshold</h4>
            <div className="slider-wrapper">
              <div className="slider-info">
                <span>Min Trust</span>
                <strong>{minTrust}%</strong>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={minTrust} 
                onChange={(e) => setMinTrust(parseInt(e.target.value))} 
                className="range-slider"
              />
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Job Type</h4>
            {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
              <label key={type} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTypes([...selectedTypes, type]);
                    } else {
                      setSelectedTypes(selectedTypes.filter(t => t !== type));
                    }
                  }}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Main List Content Area */}
        <div className="main-list-content">
          {/* Jobs Output */}
          <div className="jobs-output-wrapper">
            <div className="jobs-count-header">
              Showing <span>{filteredJobs.length}</span> Remote Opportunities
            </div>
            {filteredJobs.length > 0 ? (
              <div className="jobs-cards-grid">
                {filteredJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onSelect={onSelectJob}
                    isSelected={selectedJob && selectedJob.id === job.id}
                    isBookmarked={bookmarkedJobs.includes(job.id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state glass">
                <SlidersHorizontal className="empty-state-icon" size={48} />
                <h4>No Remote Positions Found</h4>
                <p>Try adjusting your search keywords, category filters, or security trust levels.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .job-list-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          height: 100%;
        }

        .job-list-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 1.5rem;
          width: 100%;
          height: 100%;
        }

        .filters-sidebar {
          padding: 1.5rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
          height: auto;
          align-self: start;
          position: sticky;
          top: 0;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
        }

        .sidebar-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .sidebar-section h4 {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        /* Switch styling */
        .switch-container {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 22px;
        }

        .switch-container input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .switch-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .3s;
          border-radius: 34px;
          border: 1px solid var(--border-color);
        }

        .switch-slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }

        input:checked + .switch-slider {
          background-color: var(--primary);
          border-color: var(--primary);
        }

        input:checked + .switch-slider:before {
          transform: translateX(22px);
        }

        /* Checkbox styling */
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          cursor: pointer;
        }

        .checkbox-label input {
          accent-color: var(--primary-bright);
          cursor: pointer;
        }

        /* Slider styling */
        .slider-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .slider-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .range-slider {
          width: 100%;
          accent-color: var(--primary-bright);
          cursor: pointer;
        }

        .main-list-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 0;
          min-height: 0;
          height: 100%;
        }



        .jobs-output-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex-grow: 1;
          min-height: 0;
        }

        .jobs-count-header {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-align: left;
        }

        .jobs-count-header span {
          color: #ffffff;
          font-weight: 700;
        }

        .jobs-cards-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          flex-grow: 1;
          min-height: 0;
          padding-right: 0.5rem;
        }

        .empty-state {
          padding: 3rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          border-radius: var(--radius-md);
        }

        .empty-state-icon {
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .empty-state h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .empty-state p {
          font-size: 0.9rem;
          color: var(--text-muted);
          max-width: 320px;
        }

        @media (max-width: 968px) {
          .job-list-layout {
            grid-template-columns: 1fr;
          }
          
          .filters-sidebar {
            position: static;
          }
        }


      `}</style>
    </div>
  );
}
