// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/topbar/navigation/NavigationLinks.ui.tsx
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '@/domains/common/auth/hooks';
import { Button } from '@/domains/common/components/ui';
import { MakerHQMegamenu } from './makerhq';

interface TopbarNavigationProps {
  className?: string;
}

export const TopbarNavigation: React.FC<TopbarNavigationProps> = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const [isMakerHQOpen, setIsMakerHQOpen] = useState(false);

  // Handle navigation with proper routing
  const handleNavigate = (path: string) => {
    console.log('🧭 Navigation requested:', path);
    // TODO: Implement proper routing with @tanstack/react-router
    window.location.href = path;
  };

  // Enhanced mouse interaction for glassmorphism effect
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.removeProperty('--mouse-x');
    e.currentTarget.style.removeProperty('--mouse-y');
  };

  return (
    <>
      <nav className={`topbar-navigation flex items-center gap-6 ${className}`}>
        {/* MakerHQ Megamenu Trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMakerHQOpen(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="topbar-nav-button relative overflow-hidden group
                     bg-gradient-to-br from-white/10 to-white/5
                     border border-white/20 backdrop-blur-sm
                     hover:from-white/20 hover:to-white/10
                     transition-all duration-300 ease-out
                     active:scale-95"
        >
          <span
            className="topbar-nav-text relative z-10 
                          transition-all duration-300 group-hover:scale-110
                          text-neon-slime font-semibold
                          drop-shadow-[0_0_10px_hsl(var(--neon-slime))]"
          >
            MakerHQ
          </span>
        </Button>

        {/* Authenticated User Navigation */}
        {isAuthenticated && (
          <div className="authenticated-nav flex items-center gap-4">
            {/* Future: MakerForge, MakerSpace, etc. */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate('/makerforge')}
              className="nav-link-button opacity-60 hover:opacity-100
                         transition-opacity duration-200"
            >
              MakerForge
            </Button>
          </div>
        )}
      </nav>

      {/* MakerHQ Megamenu */}
      <MakerHQMegamenu
        isOpen={isMakerHQOpen}
        onClose={() => setIsMakerHQOpen(false)}
        onNavigate={handleNavigate}
      />
    </>
  );
};
