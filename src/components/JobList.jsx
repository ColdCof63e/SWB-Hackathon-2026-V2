import React, { useState, useMemo } from 'react';
import JobCard from './JobCard';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function JobList({ jobs, selectedJob, onSelectJob }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');

  // Compute unique categories from jobs database
  const categories = useMemo(() => {
    const list = new Set(jobs.map(job => job.category));
    return ['All', ...Array.from(list)];
  }, [jobs]);

  // Filter jobs based on search term, category, and trust status
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

      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [jobs, searchTerm, activeCategory, activeFilter]);

  return (
    <div className="job-list-container">
      {/* Search & Filter Header */}
      <div className="filter-bar glass">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search verified roles, keywords, or companies..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter-tabs">
          {['All', 'Verified', 'Suspicious', 'Scam'].map((filter) => (
            <button
              key={filter}
              className={`filter-tab-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'All' ? 'All Listings' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="category-pills">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

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

      <style>{`
        .job-list-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          gap: 1.5rem;
          border-radius: var(--radius-md);
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-grow: 1;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
        }

        .search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .search-input {
          width: 100%;
          font-size: 0.95rem;
          outline: none;
        }

        .search-input::placeholder {
          color: var(--text-dark);
        }

        .status-filter-tabs {
          display: flex;
          gap: 0.25rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .filter-tab-btn {
          padding: 0.4rem 1rem;
          border-radius: calc(var(--radius-sm) - 3px);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--text-muted);
        }

        .filter-tab-btn:hover {
          color: var(--text-main);
        }

        .filter-tab-btn.active {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .category-pill {
          padding: 0.4rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .category-pill:hover, .category-pill.active {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
          color: #ffffff;
        }

        .jobs-output-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
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

        @media (max-width: 900px) {
          .filter-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          
          .status-filter-tabs {
            justify-content: space-between;
          }
          
          .filter-tab-btn {
            flex-grow: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
