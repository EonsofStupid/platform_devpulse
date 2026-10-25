// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/webshell/topbar/navigation/makerforge/MakerForgeMegamenu.tsx
import {
  BarChart3,
  Box,
  Code,
  Cpu,
  GitBranch,
  Hammer,
  Layers,
  Palette,
  PlayCircle,
  Settings,
  Target,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import React from 'react';
// CSS now owned by PulseOS DS

// Type definitions
interface ForgeTool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  status: 'active' | 'beta' | 'coming-soon';
  category: string;
}

interface ForgeCategory {
  id: string;
  title: string;
  description: string;
  tools: ForgeTool[];
}

interface ForgeStats {
  activeProjects: number;
  toolsRunning: number;
  systemStatus: 'online' | 'maintenance' | 'offline';
}

interface MakerForgeMegamenuProps {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onToolLaunch?: (toolId: string, href: string) => void;
}

// Static data configuration
const FORGE_CATEGORIES: ForgeCategory[] = [
  {
    id: 'design',
    title: 'Design & Modeling',
    description: 'Visual design and 3D modeling tools',
    tools: [
      {
        id: '3d-designer',
        title: '3D Designer',
        description: 'Professional 3D modeling suite',
        icon: Palette,
        href: '/makerforge/3d-designer',
        status: 'active',
        category: 'design',
      },
      {
        id: 'cad-suite',
        title: 'CAD Suite',
        description: 'Computer-aided design tools',
        icon: Box,
        href: '/makerforge/cad',
        status: 'active',
        category: 'design',
      },
      {
        id: 'layer-manager',
        title: 'Layer Manager',
        description: 'Organize complex design layers',
        icon: Layers,
        href: '/makerforge/layers',
        status: 'beta',
        category: 'design',
      },
    ],
  },
  {
    id: 'development',
    title: 'Development',
    description: 'Code editing and circuit design',
    tools: [
      {
        id: 'code-editor',
        title: 'Code Editor',
        description: 'Advanced firmware development',
        icon: Code,
        href: '/makerforge/editor',
        status: 'active',
        category: 'development',
      },
      {
        id: 'circuit-builder',
        title: 'Circuit Builder',
        description: 'Electronic circuit design',
        icon: Cpu,
        href: '/makerforge/circuits',
        status: 'active',
        category: 'development',
      },
      {
        id: 'workflow-automation',
        title: 'Workflow Engine',
        description: 'Automate build processes',
        icon: Workflow,
        href: '/makerforge/workflow',
        status: 'beta',
        category: 'development',
      },
    ],
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing',
    description: 'Production and deployment tools',
    tools: [
      {
        id: 'print-queue',
        title: 'Print Queue',
        description: 'Manage 3D print jobs',
        icon: Target,
        href: '/makerforge/print',
        status: 'active',
        category: 'manufacturing',
      },
      {
        id: 'quick-tools',
        title: 'Quick Tools',
        description: 'Rapid prototyping utilities',
        icon: Zap,
        href: '/makerforge/quick',
        status: 'active',
        category: 'manufacturing',
      },
      {
        id: 'deployment',
        title: 'Deploy Manager',
        description: 'Production deployment',
        icon: PlayCircle,
        href: '/makerforge/deploy',
        status: 'coming-soon',
        category: 'manufacturing',
      },
    ],
  },
];

const FORGE_STATS: ForgeStats = {
  activeProjects: 12,
  toolsRunning: 3,
  systemStatus: 'online',
};

/**
 * MakerForgeMegamenu Component
 *
 * A comprehensive dropdown menu displaying MakerForge tools organized by category.
 * Features glass morphism styling, tool status indicators, and real-time forge statistics.
 */
export const MakerForgeMegamenu: React.FC<MakerForgeMegamenuProps> = ({
  onMouseEnter,
  onMouseLeave,
  onToolLaunch,
}) => {
  // Event handlers
  const handleToolClick = React.useCallback(
    (tool: ForgeTool) => {
      if (tool.status === 'coming-soon') {
        console.warn(`🔨 Tool "${tool.title}" is coming soon`);
        return;
      }

      console.log(`🔨 Launching MakerForge tool: ${tool.title} (${tool.id})`);

      if (onToolLaunch) {
        onToolLaunch(tool.id, tool.href);
      } else {
        // Default navigation fallback
        window.location.href = tool.href;
      }
    },
    [onToolLaunch],
  );

  const getToolStatusClass = (status: ForgeTool['status']): string => {
    switch (status) {
      case 'beta':
        return 'tool-status-beta';
      case 'coming-soon':
        return 'tool-status-disabled';
      default:
        return 'tool-status-active';
    }
  };

  const getSystemStatusIndicator = (status: ForgeStats['systemStatus']) => {
    switch (status) {
      case 'online':
        return { dot: 'status-dot-online', text: 'All Systems Online' };
      case 'maintenance':
        return { dot: 'status-dot-warning', text: 'Maintenance Mode' };
      case 'offline':
        return { dot: 'status-dot-offline', text: 'System Offline' };
    }
  };

  const systemStatus = getSystemStatusIndicator(FORGE_STATS.systemStatus);

  return (
    <div
      className="makerforge-megamenu rich-glass-panel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="menu"
      aria-label="MakerForge Tools Menu"
    >
      {/* Header Section */}
      <header className="megamenu-header">
        <div className="header-icon-container">
          <Hammer size={28} className="header-icon forge-icon-rotating" aria-hidden="true" />
        </div>
        <div className="header-content">
          <h3 className="megamenu-title">MakerForge</h3>
          <p className="megamenu-subtitle">Professional tools for makers and creators</p>
        </div>
      </header>

      {/* Tools Grid */}
      <div className="forge-tools-grid" role="group" aria-label="Tool Categories">
        {FORGE_CATEGORIES.map((category) => (
          <section
            key={category.id}
            className="forge-category"
            aria-labelledby={`category-${category.id}`}
          >
            <header className="category-header">
              <h4 id={`category-${category.id}`} className="category-title">
                {category.title}
              </h4>
              <p className="category-description">{category.description}</p>
            </header>

            <div className="category-tools" role="group">
              {category.tools.map((tool) => {
                const IconComponent = tool.icon;
                const statusClass = getToolStatusClass(tool.status);

                return (
                  <button
                    key={tool.id}
                    className={`forge-tool rich-glass-button ${statusClass}`}
                    onClick={() => handleToolClick(tool)}
                    disabled={tool.status === 'coming-soon'}
                    role="menuitem"
                    aria-describedby={`tool-${tool.id}-desc`}
                  >
                    <div className="tool-icon-wrapper">
                      <IconComponent size={20} className="tool-icon" aria-hidden="true" />
                      {tool.status === 'beta' && <span className="tool-status-badge">BETA</span>}
                    </div>

                    <div className="tool-content">
                      <h5 className="tool-title">{tool.title}</h5>
                      <p id={`tool-${tool.id}-desc`} className="tool-description">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Stats Footer */}
      <footer className="megamenu-footer">
        <div className="forge-stats" role="group" aria-label="Forge Statistics">
          <div className="stat-card">
            <GitBranch size={16} className="stat-icon" aria-hidden="true" />
            <div className="stat-content">
              <span className="stat-number">{FORGE_STATS.activeProjects}</span>
              <span className="stat-label">Active Projects</span>
            </div>
          </div>

          <div className="stat-card">
            <Settings size={16} className="stat-icon rotating" aria-hidden="true" />
            <div className="stat-content">
              <span className="stat-number">{FORGE_STATS.toolsRunning}</span>
              <span className="stat-label">Tools Running</span>
            </div>
          </div>

          <div className="stat-card">
            <div className={`status-indicator ${systemStatus.dot}`} aria-hidden="true"></div>
            <div className="stat-content">
              <span className="stat-status">{systemStatus.text}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
