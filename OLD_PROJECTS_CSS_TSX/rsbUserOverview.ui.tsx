// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/rightsidebar/rsb-useroverview/rsb-UserOverview.ui.tsx
/* Import PulseOS styles - all visual styles come from central design system */
import '@/domains/admin/features/pulseos/styles/index.ds.css';

import { Award, Database, Loader2, LogOut, Settings, TrendingUp, User, X, Zap } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';

import { useAuth } from '@/domains/common/auth/hooks';
import { Button } from '@/domains/common/components/ui';
import { useLayout } from '@/domains/common/hooks';
interface RightSidebarProps {
  className?: string;
}

export const RsbUserOverview: React.FC<RightSidebarProps> = ({ className = '' }) => {
  const { rightSidebarOpen, toggleRightSidebar } = useLayout();
  const {
    user: authUser,
    signOut,
    profile,
    primaryRole,
    subscriptionTier,
    avatarUrl,
    loading,
    error,
    refreshProfile,
  } = useAuth();

  // Extract data from the auth profile
  const profileUser = profile || authUser;
  const role = primaryRole;
  const impulseXp = { total_xp: 1250, level: 5, recent_activities: 12 }; // Mock data
  const activeBuilds: any[] = []; // Mock data
  const notifications = 0; // Mock data
  const profileCompletion = 65; // Mock data
  const totalProjects = 0; // Mock data
  const totalFollowers = 0; // Mock data
  const totalLikes = 0; // Mock data

  const clearError = () => {
    // Error clearing would need to be implemented in the hook
    console.log('Clear error requested');
  };

  // Refresh data when auth state changes
  useEffect(() => {
    if (authUser) {
      refreshProfile();
    }
  }, [authUser, refreshProfile]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

  const displayName =
    profileUser?.display_name || profileUser?.username || authUser?.email?.split('@')[0] || 'User';
  const userRole = role || 'subscriber';

  // Settings menu items
  const settingsItems = [
    { label: 'Profile Settings', icon: User, path: '/profile', pulse: false },
    {
      label: 'Notifications',
      icon: TrendingUp,
      path: '/notifications',
      pulse: Array.isArray(notifications) ? notifications.length > 0 : notifications > 0,
    },
    {
      label: 'Account Security',
      icon: Settings,
      path: '/security',
      pulse: false,
    },
  ];

  return (
    <aside
      className={`
        fixed top-[3.7rem] bottom-0 z-40 w-64 
        transition-all duration-300 ease-in-out retro-sidebar-right
        ${rightSidebarOpen ? 'right-0' : '-right-64'}
        ${className}
      `}
    >
      <div className="p-4 h-full overflow-y-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-orbitron font-bold text-lg neon-text-pink mi-anim-retro-flicker">
            User Control
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRightSidebar}
            onMouseMove={handleMouseMove}
            className="admin-sidebar-item hover-scale transition-all duration-300"
          >
            <X className="w-5 h-5 neon-text-pink" />
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="glass-card p-3 rounded-lg mb-4 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mt-2 text-red-400 hover:text-red-300"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* User Profile Section */}
        {authUser ? (
          <div className="glass-card p-4 rounded-lg mb-6 hover-glow">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin neon-text-cyan" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center relative">
                    {profileUser?.avatar_url ? (
                      <img
                        src={profileUser.avatar_url}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 neon-text-cyan" />
                    )}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-green rounded-full flex items-center justify-center animate-pulse-glow">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-rajdhani font-bold text-white text-lg">{displayName}</h3>
                    <p className="text-sm neon-text-green">Active</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Award className="w-3 h-3 neon-text-purple" />
                      <span className="text-xs neon-text-purple capitalize">{userRole}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                  <div className="glass-panel p-3 rounded text-center hover-glow transition-all duration-300">
                    <div className="neon-text-cyan text-lg font-bold">{totalProjects}</div>
                    <div className="text-gray-400">Projects</div>
                  </div>
                  <div className="glass-panel p-3 rounded text-center hover-glow transition-all duration-300">
                    <div className="neon-text-pink text-lg font-bold">{totalFollowers}</div>
                    <div className="text-gray-400">Followers</div>
                  </div>
                  <div className="glass-panel p-3 rounded text-center hover-glow transition-all duration-300">
                    <div className="neon-text-green text-lg font-bold">{totalLikes}</div>
                    <div className="text-gray-400">Likes</div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Profile Completion</span>
                      <span className="neon-text-cyan">{profileCompletion}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 progress-container">
                      <div
                        className="progress-bar-fill bg-gradient-to-r from-neon-cyan to-neon-purple h-2 rounded-full transition-all duration-500 animate-pulse-glow"
                        data-progress={profileCompletion}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="glass-card p-4 rounded-lg mb-6 hover-glow">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 neon-text-cyan" />
              <h3 className="font-rajdhani font-bold text-white text-lg mb-2">
                Welcome to makersIMPULSE
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Join our community of makers and innovators
              </p>
              <Button className="w-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover-glow">
                Sign Up Now
              </Button>
            </div>
          </div>
        )}

        {/* Live Activity */}
        <div className="glass-card p-4 rounded-lg mb-6 hover-glow">
          <h3 className="font-orbitron font-bold text-sm neon-text-cyan mb-3 flex items-center gap-2 mi-anim-retro-flicker">
            <TrendingUp className="w-4 h-4" />
            Live Activity
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Builds</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse-glow"></div>
                <span className="neon-text-green font-bold">{activeBuilds.length}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Views Today</span>
              <span className="neon-text-cyan font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Comments</span>
              <span className="neon-text-pink font-bold">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Impulse Score</span>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 neon-text-purple" />
                <span className="neon-text-purple font-bold">{impulseXp?.total_xp || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="space-y-2 mb-6">
          <h3 className="font-orbitron font-bold text-sm neon-text-purple mb-4 mi-anim-retro-flicker">
            Quick Settings
          </h3>
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={`
                  admin-sidebar-item w-full justify-start h-12 px-4
                  hover:bg-transparent hover-scale
                  ${item.pulse ? 'animate-pulse-glow' : ''}
                `}
                onMouseMove={handleMouseMove}
                onClick={() => {
                  // TODO: Implement navigation to settings pages
                  console.log(`Navigate to ${item.path}`);
                }}
              >
                <Icon
                  className={`w-5 h-5 mr-3 ${item.pulse ? 'neon-text-green' : 'neon-text-pink'}`}
                />
                <span className="font-rajdhani font-medium text-gray-300 group-hover:text-white">
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-orbitron font-bold text-sm neon-text-green mb-4 mi-anim-retro-flicker">
            Quick Actions
          </h3>

          <Button
            className="w-full bg-neon-cyan/20 border border-neon-cyan/50 hover-glow transition-all duration-300"
            onMouseMove={handleMouseMove}
            onClick={() => {
              // TODO: Implement advanced settings navigation
              console.log('Navigate to advanced settings');
            }}
          >
            <Settings className="w-4 h-4 mr-2 neon-text-cyan" />
            <span className="neon-text-cyan">Advanced Settings</span>
          </Button>

          <Button
            className="w-full bg-neon-green/20 border border-neon-green/50 hover-glow transition-all duration-300"
            onMouseMove={handleMouseMove}
            onClick={() => {
              // TODO: Implement data export functionality
              console.log('Export user data');
            }}
          >
            <Database className="w-4 h-4 mr-2 neon-text-green" />
            <span className="neon-text-green">Export Data</span>
          </Button>

          {authUser && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await signOut();
                } catch (error) {
                  console.error('Sign out failed:', error);
                }
              }}
              className="w-full border-neon-pink/50 bg-neon-pink/10 hover-glow transition-all duration-300"
              onMouseMove={handleMouseMove}
            >
              <LogOut className="w-4 h-4 mr-2 neon-text-pink" />
              <span className="neon-text-pink">Sign Out</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};

// Export as default for easier importing
export default RsbUserOverview;
