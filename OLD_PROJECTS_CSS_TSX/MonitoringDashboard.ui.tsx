/**
 * @fileoverview Monitoring Dashboard Component
 * @module devpulse-ui/monitoring/MonitoringDashboard
 *
 * Real-time monitoring dashboard with activity feed and scan suggestions
 */

import React, { useState, useEffect } from 'react';
import { ActivityFeed } from './ActivityFeed.ui';
import { ScanSuggestions } from './ScanSuggestions.ui';

interface MonitoringDashboard {
  timestamp: string;
  activity: {
    totalEvents: number;
    byType: Record<string, number>;
    recentEvents: Array<{
      id: string;
      timestamp: string;
      type: string;
      description: string;
      scope?: string;
    }>;
    period: {
      start: string;
      end: string;
    };
  };
  fileChanges: {
    filesChanged: number;
    patterns: {
      added: number;
      modified: number;
      deleted: number;
    };
    affectedScopes: string[];
    lastChange: string;
  };
  suggestions: Array<{
    id: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    laymanMessage: string;
    scanType: 'drift' | 'alignment' | 'full';
    suggestedAt: string;
  }>;
  lastScan: {
    timestamp: string | null;
    result: {
      violations: number;
      healthScore: number;
    } | null;
  };
  healthTrend: {
    current: number;
    previous: number;
    direction: 'improving' | 'declining' | 'stable';
  };
}

interface RpcClient {
  send: (type: string, data?: unknown) => Promise<{ data: unknown }>;
}

export interface MonitoringDashboardProps {
  rpc: RpcClient;
  showLaymanMode?: boolean;
}

export function MonitoringDashboard({
  rpc,
  showLaymanMode = true,
}: MonitoringDashboardProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load dashboard on mount
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await rpc.send('monitoring.dashboard.req');
        const data = response.data as { dashboard: MonitoringDashboard | null; error?: string };

        if (data.error) {
          setError(data.error);
        } else {
          setDashboard(data.dashboard);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load monitoring dashboard');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [rpc]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        const response = await rpc.send('monitoring.dashboard.req');
        const data = response.data as { dashboard: MonitoringDashboard | null };
        if (data.dashboard) {
          setDashboard(data.dashboard);
        }
      } catch {
        // Ignore refresh errors
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [rpc, autoRefresh]);

  // Handle suggestion dismissal
  async function handleDismissSuggestion(suggestionId: string) {
    try {
      await rpc.send('monitoring.suggestion.dismiss.req', { suggestionId });

      // Refresh dashboard
      const response = await rpc.send('monitoring.dashboard.req');
      const data = response.data as { dashboard: MonitoringDashboard | null };
      if (data.dashboard) {
        setDashboard(data.dashboard);
      }
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err);
    }
  }

  // Handle file changes reset
  async function handleResetFileChanges() {
    try {
      await rpc.send('monitoring.fileChanges.reset.req');

      // Refresh dashboard
      const response = await rpc.send('monitoring.dashboard.req');
      const data = response.data as { dashboard: MonitoringDashboard | null };
      if (data.dashboard) {
        setDashboard(data.dashboard);
      }
    } catch (err) {
      console.error('Failed to reset file changes:', err);
    }
  }

  if (loading) {
    return <div className="monitoring-dashboard-loading">Loading monitoring dashboard...</div>;
  }

  if (error) {
    return (
      <div className="monitoring-dashboard-error">
        <div className="monitoring-dashboard-error-icon">⚠️</div>
        <div className="monitoring-dashboard-error-message">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="monitoring-dashboard-empty">
        <div className="monitoring-dashboard-empty-icon">📊</div>
        <div className="monitoring-dashboard-empty-title">
          {showLaymanMode ? 'No Monitoring Data Yet' : 'Monitoring Not Initialized'}
        </div>
      </div>
    );
  }

  const trendIcon = {
    improving: '📈',
    declining: '📉',
    stable: '➡️',
  }[dashboard.healthTrend.direction];

  const trendLabel = showLaymanMode
    ? {
        improving: 'Getting Better',
        declining: 'Needs Attention',
        stable: 'Steady',
      }[dashboard.healthTrend.direction]
    : {
        improving: 'Improving',
        declining: 'Declining',
        stable: 'Stable',
      }[dashboard.healthTrend.direction];

  return (
    <div className="monitoring-dashboard">
      {/* Header */}
      <div className="monitoring-dashboard-header">
        <div className="monitoring-dashboard-header-left">
          <h1 className="monitoring-dashboard-title">
            {showLaymanMode ? 'System Monitor' : 'Active Monitoring'}
          </h1>
          <div className="monitoring-dashboard-refresh-toggle">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              {showLaymanMode ? 'Auto-update' : 'Auto-refresh'}
            </label>
          </div>
        </div>

        <div className="monitoring-dashboard-header-right">
          <div className="monitoring-dashboard-last-updated">
            {showLaymanMode ? 'Updated:' : 'Last updated:'}{' '}
            {new Date(dashboard.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Health Overview */}
      <div className="monitoring-dashboard-health">
        <div className="monitoring-health-card">
          <div className="monitoring-health-card-icon">💚</div>
          <div className="monitoring-health-card-content">
            <div className="monitoring-health-card-label">
              {showLaymanMode ? 'System Health' : 'Health Score'}
            </div>
            <div className="monitoring-health-card-value">{dashboard.healthTrend.current}/100</div>
            <div className="monitoring-health-card-trend">
              {trendIcon} {trendLabel}
            </div>
          </div>
        </div>

        <div className="monitoring-health-card">
          <div className="monitoring-health-card-icon">📝</div>
          <div className="monitoring-health-card-content">
            <div className="monitoring-health-card-label">
              {showLaymanMode ? 'Files Changed' : 'File Changes'}
            </div>
            <div className="monitoring-health-card-value">{dashboard.fileChanges.filesChanged}</div>
            <button
              className="monitoring-health-card-action"
              onClick={handleResetFileChanges}
              disabled={dashboard.fileChanges.filesChanged === 0}
            >
              {showLaymanMode ? 'Mark as Checked' : 'Reset Counter'}
            </button>
          </div>
        </div>

        <div className="monitoring-health-card">
          <div className="monitoring-health-card-icon">🔍</div>
          <div className="monitoring-health-card-content">
            <div className="monitoring-health-card-label">
              {showLaymanMode ? 'Last Check' : 'Last Scan'}
            </div>
            <div className="monitoring-health-card-value">
              {dashboard.lastScan.timestamp
                ? new Date(dashboard.lastScan.timestamp).toLocaleDateString()
                : showLaymanMode
                  ? 'Never'
                  : 'N/A'}
            </div>
            {dashboard.lastScan.result && (
              <div className="monitoring-health-card-detail">
                {dashboard.lastScan.result.violations}{' '}
                {showLaymanMode ? 'issues' : 'violations'}
              </div>
            )}
          </div>
        </div>

        <div className="monitoring-health-card">
          <div className="monitoring-health-card-icon">📊</div>
          <div className="monitoring-health-card-content">
            <div className="monitoring-health-card-label">
              {showLaymanMode ? 'Recent Activity' : 'Events (7 days)'}
            </div>
            <div className="monitoring-health-card-value">{dashboard.activity.totalEvents}</div>
            <div className="monitoring-health-card-detail">
              {Object.keys(dashboard.activity.byType).length}{' '}
              {showLaymanMode ? 'types' : 'event types'}
            </div>
          </div>
        </div>
      </div>

      {/* Scan Suggestions */}
      {dashboard.suggestions.length > 0 && (
        <div className="monitoring-dashboard-suggestions">
          <ScanSuggestions
            suggestions={dashboard.suggestions}
            onDismiss={handleDismissSuggestion}
            rpc={rpc}
            showLaymanMode={showLaymanMode}
          />
        </div>
      )}

      {/* Activity Feed */}
      <div className="monitoring-dashboard-activity">
        <ActivityFeed
          events={dashboard.activity.recentEvents}
          period={dashboard.activity.period}
          showLaymanMode={showLaymanMode}
        />
      </div>
    </div>
  );
}
