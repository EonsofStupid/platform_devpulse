// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/topbar/mobile/avatar/usermenu/UserMenu.m.ui.tsx
import { Bell, LogOut, Palette, Settings, Shield, User } from 'lucide-react';
import React from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/domains/common/auth/hooks';

interface MobileUserMenuProps {
  onClose: () => void;
}

interface MenuItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  action?: () => void;
  color?: 'cyan' | 'pink' | 'purple' | 'green' | 'slime' | 'red';
  divider?: boolean;
}

export const MobileUserMenu: React.FC<MobileUserMenuProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      href: '/profile',
      color: 'cyan',
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      color: 'purple',
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      color: 'pink',
    },
    {
      id: 'theme',
      icon: Palette,
      label: 'Theme',
      action: () => console.log('Theme picker'),
      color: 'slime',
    },
    {
      id: 'admin',
      icon: Shield,
      label: 'Admin Panel',
      href: '/admin',
      color: 'green',
      divider: true,
    },
    {
      id: 'signout',
      icon: LogOut,
      label: 'Sign Out',
      action: handleSignOut,
      color: 'red',
    },
  ];

  const getColorStyles = (color: MenuItem['color']) => {
    const colorMap = {
      cyan: 'hover:from-neon-cyan/20 hover:to-neon-cyan/10 hover:border-neon-cyan/30 hover:text-neon-cyan',
      pink: 'hover:from-neon-pink/20 hover:to-neon-pink/10 hover:border-neon-pink/30 hover:text-neon-pink',
      purple:
        'hover:from-neon-purple/20 hover:to-neon-purple/10 hover:border-neon-purple/30 hover:text-neon-purple',
      green:
        'hover:from-neon-green/20 hover:to-neon-green/10 hover:border-neon-green/30 hover:text-neon-green',
      slime:
        'hover:from-slime-primary/20 hover:to-slime-primary/10 hover:border-slime-primary/30 hover:text-slime-primary',
      red: 'hover:from-red-500/20 hover:to-red-500/10 hover:border-red-500/30 hover:text-red-400',
    };

    return colorMap[color] || colorMap.cyan;
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const colorStyles = getColorStyles(item.color);

    const baseClassName = `
      mobile-menu-item group flex items-center gap-3 p-3 rounded-xl
      text-gray-300 border border-transparent
      bg-gradient-to-r from-transparent to-transparent
      transition-all duration-200 ease-out
      touch-manipulation relative overflow-hidden
      ${colorStyles}
    `;

    const content = (
      <>
        <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        <span className="font-rajdhani font-medium text-base">{item.label}</span>
      </>
    );

    if (item.href) {
      return (
        <Link
          key={item.id}
          to={item.href}
          onClick={onClose}
          className={baseClassName}
          style={{
            minHeight: 'var(--mobile-touch-target)',
          }}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => {
          item.action?.();
          onClose();
        }}
        className={baseClassName}
        style={{
          minHeight: 'var(--mobile-touch-target)',
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <div
      className="mobile-user-menu absolute top-full right-0 mt-2
                 w-64 bg-gradient-to-br from-tech-dark/95 to-tech-darker/95
                 backdrop-filter backdrop-blur-24 rounded-2xl
                 border border-white/10 overflow-hidden z-[1000]
                 animate-in slide-in-from-top-2 duration-200"
      style={{
        boxShadow: `
          0 20px 40px rgba(0, 0, 0, 0.4),
          0 0 80px hsla(var(--slime-primary), 0.2)
        `,
      }}
    >
      {/* Header */}
      <div className="mobile-menu-header p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username || 'User'}
              className="w-12 h-12 rounded-full border-2 border-slime-primary/50
                         shadow-lg object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-br 
                         from-slime-primary to-neon-cyan
                         flex items-center justify-center
                         border-2 border-white/20"
              style={{
                boxShadow: '0 0 20px hsla(var(--slime-primary), 0.4)',
              }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
          )}

          <div>
            <div className="font-orbitron font-bold text-white text-base">
              {user?.username || 'Guest User'}
            </div>
            <div className="text-xs text-gray-400 font-rajdhani">
              {user?.email || 'guest@makersimpulse.com'}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="mobile-menu-items p-2 space-y-1">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {item.divider && index > 0 && <div className="border-t border-white/10 my-2" />}
            {renderMenuItem(item)}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className="mobile-menu-footer p-3 border-t border-white/10 text-center">
        <div className="text-xs text-gray-500 font-rajdhani">Makers Impulse v2.0</div>
      </div>
    </div>
  );
};
