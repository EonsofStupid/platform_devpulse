/**
 * @fileoverview Build Diary Dashboard
 * @module devpulse-ui/diary/BuildDiary
 *
 * Main dashboard for viewing build progress and features
 */

import React, { useState, useEffect } from 'react';
import { ProgressCard } from './ProgressCard.ui';
import { FeatureCard } from './FeatureCard.ui';
import { NotesPanel } from './NotesPanel.ui';

// Simplified types for UI
interface DiaryFeature {
  id: string;
  name: string;
  laymanName: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'blocked';
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  startedAt?: string;
  completedAt?: string;
  checklist?: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
}

interface DiaryProgress {
  scope: string;
  overall: {
    completed: number;
    inProgress: number;
    planned: number;
    blocked: number;
    total: number;
    percentage: number;
  };
  byCategory: Record<string, {
    completed: number;
    total: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    timestamp: string;
    type: string;
    title: string;
    description?: string;
  }>;
  blockers: DiaryFeature[];
  nextUp: DiaryFeature[];
}

interface RpcClient {
  send: (type: string, data?: unknown) => Promise<{ data: unknown }>;
}

export interface BuildDiaryProps {
  rpc: RpcClient;
  scope: 'devpulse' | 'devpulse-ui' | 'mapp';
  showLaymanMode?: boolean;
}

export function BuildDiary({
  rpc,
  scope,
  showLaymanMode = true,
}: BuildDiaryProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<DiaryProgress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const response = await rpc.send('diary.progress.req', { scope });
        const data = response.data as { progress: DiaryProgress; error?: string };

        if (data.error) {
          setError(data.error);
        } else {
          setProgress(data.progress);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load diary');
      } finally {
        setLoading(false);
      }
    }

    void loadProgress();
  }, [rpc, scope]);

  // Filter features by category
  const filteredFeatures = progress
    ? selectedCategory
      ? [...progress.nextUp, ...progress.blockers].filter(
          (f) => f.category === selectedCategory
        )
      : [...progress.nextUp, ...progress.blockers]
    : [];

  if (loading) {
    return <div className="build-diary-loading">Loading build diary...</div>;
  }

  if (error) {
    return (
      <div className="build-diary-error">
        <div className="build-diary-error-icon">⚠️</div>
        <div className="build-diary-error-message">{error}</div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="build-diary-empty">
        <div className="build-diary-empty-icon">📔</div>
        <div className="build-diary-empty-title">
          {showLaymanMode ? 'No Build Diary Yet' : 'Diary Not Initialized'}
        </div>
        <div className="build-diary-empty-message">
          {showLaymanMode
            ? 'Start tracking your build progress automatically.'
            : 'Initialize diary to start tracking build progress.'}
        </div>
      </div>
    );
  }

  const scopeLabels = {
    devpulse: showLaymanMode ? 'DevPulse Engine' : 'DevPulse',
    'devpulse-ui': showLaymanMode ? 'DevPulse Interface' : 'DevPulse UI',
    mapp: showLaymanMode ? 'Your App' : 'MAPP',
  };

  return (
    <div className="build-diary">
      {/* Header */}
      <div className="build-diary-header">
        <div className="build-diary-header-left">
          <h1 className="build-diary-title">
            {showLaymanMode ? 'Build Progress' : 'Build Diary'}
          </h1>
          <div className="build-diary-scope">{scopeLabels[scope]}</div>
        </div>

        <div className="build-diary-header-right">
          <button
            className="build-diary-notes-btn"
            onClick={() => setShowNotesPanel(!showNotesPanel)}
          >
            📝 {showLaymanMode ? 'My Notes' : 'Notes'}
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="build-diary-progress">
        <ProgressCard
          title={showLaymanMode ? 'Overall Progress' : 'Overall'}
          progress={progress.overall}
          showLaymanMode={showLaymanMode}
        />
      </div>

      {/* Progress by Category */}
      <div className="build-diary-categories">
        <h2 className="build-diary-categories-title">
          {showLaymanMode ? 'Progress by Area' : 'By Category'}
        </h2>

        <div className="build-diary-categories-grid">
          <button
            className={`build-diary-category-card ${!selectedCategory ? 'selected' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            <div className="build-diary-category-name">
              {showLaymanMode ? 'All Areas' : 'All Categories'}
            </div>
            <div className="build-diary-category-progress">
              {progress.overall.percentage}%
            </div>
          </button>

          {Object.entries(progress.byCategory).map(([category, cat]) => (
            <button
              key={category}
              className={`build-diary-category-card ${selectedCategory === category ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              <div className="build-diary-category-name">{category}</div>
              <div className="build-diary-category-stats">
                {cat.completed} / {cat.total}
              </div>
              <div className="build-diary-category-progress">
                <div
                  className="build-diary-category-progress-bar"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
              <div className="build-diary-category-percentage">{cat.percentage}%</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="build-diary-activity">
        <h2 className="build-diary-activity-title">
          {showLaymanMode ? 'Recent Updates' : 'Recent Activity'}
        </h2>

        <div className="build-diary-activity-list">
          {progress.recentActivity.length === 0 ? (
            <div className="build-diary-activity-empty">
              {showLaymanMode ? 'No recent activity' : 'No events recorded yet'}
            </div>
          ) : (
            progress.recentActivity.map((event) => (
              <div key={event.id} className="build-diary-activity-item">
                <div className="build-diary-activity-time">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
                <div className="build-diary-activity-title">{event.title}</div>
                {event.description && (
                  <div className="build-diary-activity-description">{event.description}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Blockers */}
      {progress.blockers.length > 0 && (
        <div className="build-diary-blockers">
          <h2 className="build-diary-blockers-title">
            ⚠️ {showLaymanMode ? 'Stuck Items' : 'Blocked Features'}
          </h2>

          <div className="build-diary-blockers-list">
            {progress.blockers.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                rpc={rpc}
                scope={scope}
                showLaymanMode={showLaymanMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Next Up */}
      <div className="build-diary-next">
        <h2 className="build-diary-next-title">
          {showLaymanMode ? 'Coming Up Next' : 'Next Up'}
        </h2>

        <div className="build-diary-next-list">
          {filteredFeatures.length === 0 ? (
            <div className="build-diary-next-empty">
              {showLaymanMode
                ? 'Nothing planned in this area yet'
                : 'No features in this category'}
            </div>
          ) : (
            filteredFeatures.slice(0, 5).map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                rpc={rpc}
                scope={scope}
                showLaymanMode={showLaymanMode}
              />
            ))
          )}
        </div>
      </div>

      {/* Notes Panel (Slide-in) */}
      {showNotesPanel && (
        <div className="build-diary-notes-panel">
          <NotesPanel
            rpc={rpc}
            scope={scope}
            showLaymanMode={showLaymanMode}
            onClose={() => setShowNotesPanel(false)}
          />
        </div>
      )}
    </div>
  );
}
