import React from 'react';
import { Database, ShieldCheck, ShieldAlert, Award } from 'lucide-react';

export default function StatsBanner() {
  const stats = [
    {
      id: 'scanned',
      label: 'Remote Jobs Evaluated',
      value: '1,542',
      change: '+14 today',
      icon: <Database className="stat-icon text-blue" size={24} />,
      colorClass: 'blue'
    },
    {
      id: 'legitimate',
      label: 'Verified Legitimate',
      value: '1,289',
      change: '83.5% Trust Index',
      icon: <ShieldCheck className="stat-icon text-green" size={24} />,
      colorClass: 'green'
    },
    {
      id: 'scams',
      label: 'Scams Shielded',
      value: '184',
      change: '100% Blocked',
      icon: <ShieldAlert className="stat-icon text-red" size={24} />,
      colorClass: 'red'
    },
    {
      id: 'accuracy',
      label: 'AI Detector Precision',
      value: '99.2%',
      change: 'Active Heuristics',
      icon: <Award className="stat-icon text-gold" size={24} />,
      colorClass: 'gold'
    }
  ];

  return (
    <div className="stats-grid animate-fade-in">
      {stats.map((stat) => (
        <div key={stat.id} className="stat-card glass">
          <div className="stat-header">
            <span className="stat-label">{stat.label}</span>
            <div className={`stat-icon-wrapper ${stat.colorClass}`}>
              {stat.icon}
            </div>
          </div>
          <div className="stat-body">
            <span className="stat-value">{stat.value}</span>
            <span className={`stat-change ${stat.colorClass}`}>{stat.change}</span>
          </div>
        </div>
      ))}

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: var(--radius-md);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
          background: var(--bg-card-hover);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .stat-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-icon-wrapper {
          padding: 0.45rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Color schemes for icon wrappers */
        .stat-icon-wrapper.blue {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .stat-icon-wrapper.green {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .stat-icon-wrapper.red {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
        }
        .stat-icon-wrapper.gold {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .text-blue { color: var(--score-neutral); }
        .text-green { color: var(--score-high); }
        .text-red { color: var(--score-low); }
        .text-gold { color: var(--score-mid); }

        .stat-body {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -1px;
          color: #ffffff;
          line-height: 1;
        }

        .stat-change {
          font-size: 0.8rem;
          font-weight: 500;
        }

        .stat-change.blue { color: var(--score-neutral); }
        .stat-change.green { color: var(--score-high); }
        .stat-change.red { color: var(--score-low); }
        .stat-change.gold { color: var(--score-mid); }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
