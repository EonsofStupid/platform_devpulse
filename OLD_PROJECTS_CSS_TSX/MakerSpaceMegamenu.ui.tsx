// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/topbar/navigation/makerspace/MakerSpaceMegamenu.ui.tsx
import { BookOpen, Calendar, Coffee, MapPin, Star, Trophy, Users, Wrench } from 'lucide-react';
import type React from 'react';
// CSS now owned by PulseOS DS

interface MakerSpaceMegamenuProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MakerSpaceMegamenu: React.FC<MakerSpaceMegamenuProps> = ({
  onMouseEnter,
  onMouseLeave,
}) => {
  const spaceFeatures = [
    {
      category: 'Community Spaces',
      items: [
        {
          icon: Users,
          title: 'Collaboration Hub',
          href: '/makerspace/collaboration',
          description: 'Work together on projects',
        },
        {
          icon: Coffee,
          title: 'Social Lounge',
          href: '/makerspace/lounge',
          description: 'Connect with fellow makers',
        },
        {
          icon: BookOpen,
          title: 'Learning Center',
          href: '/makerspace/learning',
          description: 'Workshops and tutorials',
        },
      ],
    },
    {
      category: 'Events & Activities',
      items: [
        {
          icon: Calendar,
          title: 'Event Calendar',
          href: '/makerspace/events',
          description: 'Upcoming workshops and meetups',
        },
        {
          icon: Trophy,
          title: 'Competitions',
          href: '/makerspace/competitions',
          description: 'Join maker challenges',
        },
        {
          icon: Star,
          title: 'Showcase',
          href: '/makerspace/showcase',
          description: 'Share your creations',
        },
      ],
    },
    {
      category: 'Resources',
      items: [
        {
          icon: Wrench,
          title: 'Tool Library',
          href: '/makerspace/tools',
          description: 'Access shared equipment',
        },
        {
          icon: MapPin,
          title: 'Space Map',
          href: '/makerspace/map',
          description: 'Navigate the maker space',
        },
      ],
    },
  ];

  const handleFeatureClick = (href: string) => {
    console.log('🏗️ Navigate to MakerSpace:', href);
    // TODO: Implement proper routing
  };

  return (
    <div
      className="makerspace-megamenu rich-glass-panel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="megamenu-header">
        <Users size={24} className="header-icon bouncing" />
        <div>
          <h3 className="megamenu-title">MakerSpace</h3>
          <p className="megamenu-subtitle">Collaborative workspace for makers and innovators</p>
        </div>
      </div>

      <div className="space-features">
        {spaceFeatures.map((category, categoryIndex) => (
          <div key={categoryIndex} className="feature-category">
            <h4 className="category-title">{category.category}</h4>
            <div className="category-items">
              {category.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={itemIndex}
                    className="space-feature rich-glass-button"
                    onClick={() => handleFeatureClick(item.href)}
                  >
                    <div className="feature-icon">
                      <IconComponent size={18} />
                    </div>
                    <div className="feature-content">
                      <h5 className="feature-title">{item.title}</h5>
                      <p className="feature-description">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="megamenu-footer">
        <div className="space-stats">
          <div className="stat-card">
            <span className="stat-number">47</span>
            <span className="stat-label">Active Members</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">12</span>
            <span className="stat-label">Ongoing Projects</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">3</span>
            <span className="stat-label">Events This Week</span>
          </div>
        </div>
      </div>
    </div>
  );
};
