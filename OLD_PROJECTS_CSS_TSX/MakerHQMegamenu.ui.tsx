// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/topbar/navigation/makerhq/MakerHQMegamenu.ui.tsx
import { Activity, BarChart3, Database, Home, Settings, Users, Wrench, Zap } from 'lucide-react';
import type React from 'react';
// CSS now owned by PulseOS DS

interface MakerHQMegamenuProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MakerHQMegamenu: React.FC<MakerHQMegamenuProps> = ({ onMouseEnter, onMouseLeave }) => {
  const hqSections = [
    {
      title: 'Dashboard',
      items: [
        {
          icon: Home,
          title: 'Overview',
          href: '/makerhq/dashboard',
          description: 'Your maker journey at a glance',
        },
        {
          icon: Activity,
          title: 'Activity Feed',
          href: '/makerhq/activity',
          description: 'Recent updates and notifications',
        },
        {
          icon: BarChart3,
          title: 'Analytics',
          href: '/makerhq/analytics',
          description: 'Track your progress and metrics',
        },
      ],
    },
    {
      title: 'Tools & Services',
      items: [
        {
          icon: Database,
          title: 'Data Explorer',
          href: '/makerhq/data',
          description: 'Manage and explore your data',
        },
        {
          icon: Wrench,
          title: 'Project Tools',
          href: '/makerhq/tools',
          description: 'Essential maker utilities',
        },
        {
          icon: Settings,
          title: 'Configuration',
          href: '/makerhq/config',
          description: 'Customize your workspace',
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          icon: Users,
          title: 'Team Hub',
          href: '/makerhq/teams',
          description: 'Collaborate with other makers',
        },
        {
          icon: Zap,
          title: 'Quick Actions',
          href: '/makerhq/actions',
          description: 'Fast access to common tasks',
        },
      ],
    },
  ];

  const handleItemClick = (href: string) => {
    console.log('🧭 Navigate to:', href);
    // TODO: Implement proper routing
  };

  return (
    <div
      className="makerhq-megamenu rich-glass-panel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="megamenu-header">
        <Zap size={24} className="header-icon pulsing" />
        <div>
          <h3 className="megamenu-title">MakerHQ</h3>
          <p className="megamenu-subtitle">Your central command center for all maker activities</p>
        </div>
      </div>

      <div className="megamenu-sections">
        {hqSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="megamenu-section">
            <h4 className="section-title">{section.title}</h4>
            <div className="section-items">
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={itemIndex}
                    className="megamenu-item rich-glass-button"
                    onClick={() => handleItemClick(item.href)}
                  >
                    <div className="item-icon">
                      <IconComponent size={18} />
                    </div>
                    <div className="item-content">
                      <h5 className="item-title">{item.title}</h5>
                      <p className="item-description">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="megamenu-footer">
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-value">5</span>
            <span className="stat-label">Active Projects</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">23</span>
            <span className="stat-label">Completed Tasks</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">98%</span>
            <span className="stat-label">System Health</span>
          </div>
        </div>
      </div>
    </div>
  );
};
