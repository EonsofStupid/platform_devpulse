// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/rightsidebar/rsb-useroverview/UserOverview.ui.tsx
import {
  Award,
  Bell,
  Database,
  Loader2,
  LogOut,
  Settings,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { throttle } from '@/domains/common/utils/Performance/Performance.utl';
import { useUserOverview } from '@/user/features/Overview/UserOverview.ui';
import { useAuth } from '@/common/auth/hooks';
import { Button } from '@/components/ui/button';
import { settingsItems } from '../rsb-settings/rsb-Settings.ui';

export const UserOverview: React.FC = () => {
  const { user: authUser, signOut } = useAuth();
  // For now, use existing auth hook until we build proper overview store
  const { user: profileUser, isLoading: loading, error } = useAuth();

  // Mock data until proper stores are built
  const mockData = {
    role: profileUser?.role || 'user',
    impulseXp: { total_xp: 1250, level: 5, recent_activities: 12 },
    activeBuilds: [], // Will be populated from projects store
    notifications: [], // Will be populated from notifications store
    profileCompletion: profileUser?.profile?.profile_completion || 65,
    totalProjects: 0, // From projects store
    totalFollowers: 0, // From social store
    totalLikes: 0, // From social store
  };

  const {
    role,
    impulseXp,
    activeBuilds,
    notifications,
    profileCompletion,
    totalProjects,
    totalFollowers,
    totalLikes,
  } = mockData;

  const refreshOverview = useMemo(
    () =>
      throttle(() => {
        // TODO: Implement with proper stores
        console.log('Overview refresh requested');
      }, 1000),
    [],
  );

  const clearError = () => {
    // TODO: Implement with proper stores
    console.log('Clear error requested');
  };

  // Refresh data when auth state changes
  useEffect(() => {
    if (authUser) {
      refreshOverview();
    }
  }, [authUser, refreshOverview]);

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

  return (
    <div className="rightsidebar-section">
      {/* Error Display */}
      {error && (
        <div className="pulseos-glass-card p-3 rounded-lg mb-4 border border-red-500/30">
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
        <div className="pulseos-glass-card p-4 rounded-lg mb-6 pulseos-hover-glow">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 pulseos-anim-spin pulseos-neon-text-cyan" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full pulseos-glass-panel flex items-center justify-center relative">
                  {profileUser?.avatar_url ? (
                    <img
                      src={profileUser.avatar_url}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 pulseos-neon-text-cyan" />
                  )}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center pulseos-anim-pulse-glow">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{displayName}</h3>
                  <p className="text-sm pulseos-neon-text-green">Active</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="w-3 h-3 pulseos-neon-text-purple" />
                    <span className="text-xs pulseos-neon-text-purple capitalize">
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                <div className="pulseos-glass-panel p-3 rounded text-center pulseos-hover-glow transition-all duration-300">
                  <div className="pulseos-neon-text-cyan text-lg font-bold">
                    {totalProjects}
                  </div>
                  <div className="text-gray-400">Projects</div>
                </div>
                <div className="pulseos-glass-panel p-3 rounded text-center pulseos-hover-glow transition-all duration-300">
                  <div className="pulseos-neon-text-pink text-lg font-bold">
                    {totalFollowers}
                  </div>
                  <div className="text-gray-400">Followers</div>
                </div>
                <div className="pulseos-glass-panel p-3 rounded text-center pulseos-hover-glow transition-all duration-300">
                  <div className="pulseos-neon-text-green text-lg font-bold">
                    {totalLikes}
                  </div>
                  <div className="text-gray-400">Likes</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Profile Completion</span>
                    <span className="pulseos-neon-text-cyan">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500 pulseos-anim-pulse-glow"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="pulseos-glass-card p-4 rounded-lg mb-6 pulseos-hover-glow">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4 pulseos-neon-text-cyan" />
            <h3 className="font-bold text-white text-lg mb-2">
              Welcome to makersIMPULSE
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Join our community of makers and innovators
            </p>
            <Button className="w-full pulseos-glass-interactive-button pulseos-neon-text-cyan">Sign Up Now</Button>
          </div>
        </div>
      )}

      {/* Live Activity */}
      <div className="pulseos-glass-card p-4 rounded-lg mb-6 pulseos-hover-glow">
        <h3 className="font-bold text-sm pulseos-neon-text-cyan mb-3 flex items-center gap-2 pulseos-anim-retro-flicker">
          <TrendingUp className="w-4 h-4" />
          Live Activity
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Active Builds</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 pulseos-anim-pulse-glow"></div>
              <span className="pulseos-neon-text-green font-bold">
                {activeBuilds?.length || 0}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Views Today</span>
            <span className="pulseos-neon-text-cyan font-bold">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Comments</span>
            <span className="pulseos-neon-text-pink font-bold">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Impulse Score</span>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 pulseos-neon-text-purple" />
              <span className="pulseos-neon-text-purple font-bold">
                {impulseXp?.total_xp || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="space-y-2 mb-6">
        <h3 className="font-bold text-sm pulseos-neon-text-purple mb-4 pulseos-anim-retro-flicker">
          Quick Settings
        </h3>
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={`
                w-full justify-start px-4 h-12 pulseos-glass-interactive-button
                ${item.pulse ? 'pulseos-anim-pulse-glow' : ''}
              `}
              onMouseMove={handleMouseMove}
            >
              <Icon
                className={`w-5 h-5 mr-3 ${item.pulse ? 'pulseos-neon-text-green' : 'pulseos-neon-text-pink'}`}
              />
              <span className="font-medium text-gray-300 group-hover:text-white">{item.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm pulseos-neon-text-green mb-4 pulseos-anim-retro-flicker">
          Quick Actions
        </h3>

        <Button className="w-full pulseos-glass-interactive-button" onMouseMove={handleMouseMove}>
          <Settings className="w-4 h-4 mr-2 pulseos-neon-text-cyan" />
          <span className="pulseos-neon-text-cyan">Advanced Settings</span>
        </Button>

        <Button className="w-full pulseos-glass-interactive-button" onMouseMove={handleMouseMove}>
          <Database className="w-4 h-4 mr-2 pulseos-neon-text-green" />
          <span className="pulseos-neon-text-green">Export Data</span>
        </Button>

        {authUser && (
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full pulseos-glass-interactive-button"
            onMouseMove={handleMouseMove}
          >
            <LogOut className="w-4 h-4 mr-2 pulseos-neon-text-pink" />
            <span className="pulseos-neon-text-pink">Sign Out</span>
          </Button>
        )}
      </div>
    </div>
  );
};
