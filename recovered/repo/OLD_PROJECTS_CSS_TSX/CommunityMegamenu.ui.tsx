// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/topbar/navigation/community/CommunityMegamenu.ui.tsx
import { BookOpen, Calendar, MessageSquare, Trophy, Users, Zap } from 'lucide-react';
import type React from 'react';
// CSS now owned by PulseOS DS

interface CommunityMegamenuProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const CommunityMegamenu: React.FC<CommunityMegamenuProps> = ({
  onMouseEnter,
  onMouseLeave,
}) => {
  const communitySections = [
    {
      title: 'Connect',
      items: [
        {
          icon: MessageSquare,
          title: 'Discussions',
          href: '/community/discussions',
          description: 'Join maker conversations',
        },
        {
          icon: Users,
          title: 'Groups',
          href: '/community/groups',
          description: 'Find your maker tribe',
        },
        {
          icon: Calendar,
          title: 'Events',
          href: '/community/events',
          description: 'Maker meetups and workshops',
        },
      ],
    },
    {
      title: 'Learn & Share',
      items: [
        {
          icon: BookOpen,
          title: 'Tutorials',
          href: '/community/tutorials',
          description: 'Learn from the community',
        },
        {
          icon: Trophy,
          title: 'Challenges',
          href: '/community/challenges',
          description: 'Test your maker skills',
        },
        {
          icon: Zap,
          title: 'Showcase',
          href: '/community/showcase',
          description: 'Share your creations',
        },
      ],
    },
  ];

  const handleItemClick = (href: string) => {
    console.log('🌟 Navigate to:', href);
    // TODO: Implement proper routing
  };

  return (
    <div className="community-megamenu" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="megamenu-header">
        <Users className="header-icon sparking" size={24} />
        <div>
          <h3 className="megamenu-title">Community</h3>
          <p className="megamenu-subtitle">Connect with fellow makers worldwide</p>
        </div>
      </div>

      <div className="megamenu-grid">
        {communitySections.map((section) => (
          <div key={section.title} className="megamenu-section">
            <h4 className="section-title">{section.title}</h4>
            {section.items.map((item) => (
              <button
                key={item.title}
                className="megamenu-item"
                onClick={() => handleItemClick(item.href)}
              >
                <div className="item-icon">
                  <item.icon size={18} />
                </div>
                <div className="item-content">
                  <div className="item-title">{item.title}</div>
                  <div className="item-description">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="megamenu-footer">
        <p className="footer-text">Join thousands of makers sharing knowledge and creativity</p>
      </div>
    </div>
  );
};
