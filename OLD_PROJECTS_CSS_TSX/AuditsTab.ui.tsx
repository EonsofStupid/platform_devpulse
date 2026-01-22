/**
 * @fileoverview Audits Tab - Audit Management
 * @module devpulse-ui/panels/tabs/AuditsTab
 *
 * Displays and manages project audits and engine audits/harvesters.
 * Shows clear distinction between project-specific audits and engine-level audits.
 */

import React, { useEffect, useState, useMemo } from "react";
import { getDevPulseRPC } from "../../bridge/devpulse.rpc.svc";
import { GlossaryTooltip } from "../../components/GlossaryTooltip.ui";
import { Tooltip } from "../../components/Tooltip.ui";

interface AuditConfig {
  id: string;
  name: string;
  description?: string;
  category?: string;
  severity?: 'error' | 'warn' | 'info';
  enabled?: boolean;
  config?: Record<string, unknown>;
}

interface AuditConfigResponse {
  enabled_audits?: Record<string, boolean>;
  project_audits?: Record<string, AuditConfig>;
}

interface EngineAudit {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  scope: 'engine' | 'project';
}

export function AuditsTab() {
  const [projectAudits, setProjectAudits] = useState<AuditConfigResponse | null>(null);
  const [engineAudits, setEngineAudits] = useState<EngineAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingScope, setEditingScope] = useState<'project' | 'engine'>('project');

  // Load audit configurations
  useEffect(() => {
    const loadAudits = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load project audit config
        const projectConfig = await getDevPulseRPC().auditConfigGet();
        setProjectAudits(projectConfig as AuditConfig);

        // Load available engine audits/harvesters
        const engineList = await getDevPulseRPC().auditsList();
        setEngineAudits(engineList as EngineAudit[]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audits');
        console.error('Failed to load audits:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAudits();
  }, []);

  // Handle audit toggle
  const handleAuditToggle = async (auditId: string, scope: 'project' | 'engine', enabled: boolean) => {
    try {
      if (scope === 'project') {
        await getDevPulseRPC().auditConfigSet(auditId, enabled);
        // Reload project config
        const updatedConfig = await getDevPulseRPC().auditConfigGet();
        setProjectAudits(updatedConfig as AuditConfig);
      } else {
        await getDevPulseRPC().auditEnable(auditId, enabled);
        // Reload engine audits
        const updatedList = await getDevPulseRPC().auditsList();
        setEngineAudits(updatedList as EngineAudit[]);
      }
    } catch (err) {
      setError(`Failed to ${enabled ? 'enable' : 'disable'} audit: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Failed to toggle audit:', err);
    }
  };

  // Project audits list
  const projectAuditsList = useMemo(() => {
    if (!projectAudits?.enabled_audits) return [];

    return Object.entries(projectAudits.enabled_audits).map(([id, enabled]) => ({
      id,
      enabled,
      scope: 'project' as const,
      name: id.replace(/^dp-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Project-specific audit: ${id}`,
      category: 'project'
    }));
  }, [projectAudits]);

  // Engine audits list
  const engineAuditsList = useMemo(() => {
    return engineAudits.map(audit => ({
      ...audit,
      scope: 'engine' as const
    }));
  }, [engineAudits]);

  if (loading) {
    return (
      <div className="dp-section">
        <h3>
          <GlossaryTooltip term="audit">Audits</GlossaryTooltip>
        </h3>
        <p>Loading audit configurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dp-section">
        <h3>
          <GlossaryTooltip term="audit">Audits</GlossaryTooltip>
        </h3>
        <div className="dp-error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="dp-section">
      <div className="dp-audits-header">
        <h3>
          <GlossaryTooltip term="audit">Audits</GlossaryTooltip> Management
        </h3>

        {/* Scope Context */}
        <div className="dp-audits-scope-context">
          <div className="dp-scope-indicator">
            <span className="dp-scope-label">Managing:</span>
            <span className="dp-scope-value">
              {editingScope === 'project' ? 'Project Audits' : 'DevPulse Engine Audits'}
            </span>
          </div>
        </div>
      </div>

      {/* Scope Toggle */}
      <div className="dp-audits-scope-toggle">
        <button
          className={`dp-btn ${editingScope === 'project' ? 'dp-btn-primary' : 'dp-btn-secondary'}`}
          onClick={() => setEditingScope('project')}
        >
          Project Audits
        </button>
        <button
          className={`dp-btn ${editingScope === 'engine' ? 'dp-btn-primary' : 'dp-btn-secondary'}`}
          onClick={() => setEditingScope('engine')}
        >
          Engine Audits
        </button>
      </div>

      {/* Project Audits Section */}
      {editingScope === 'project' && (
        <div className="dp-audits-section">
          <h4 className="dp-audits-section-title">
            <GlossaryTooltip term="audit">Project Audits</GlossaryTooltip>
            <Tooltip content="These audits are configured specifically for your project in ./devpulse/audit-config.json">
              <span className="dp-help-icon">(?)</span>
            </Tooltip>
          </h4>

          <div className="dp-guidance-text">
            Project audits are custom validations specific to your codebase. They run against your project's policies.
          </div>

          {projectAuditsList.length === 0 ? (
            <p className="dp-audits-empty">No project audits configured</p>
          ) : (
            <div className="dp-audits-list">
              {projectAuditsList.map((audit) => (
                <div key={audit.id} className="dp-audit-item">
                  <div className="dp-audit-info">
                    <div className="dp-audit-name">{audit.name}</div>
                    <div className="dp-audit-description">{audit.description}</div>
                    <div className="dp-audit-category">
                      <span className="dp-category-badge dp-category-project">Project</span>
                    </div>
                  </div>

                  <div className="dp-audit-controls">
                    <label className="dp-toggle">
                      <input
                        type="checkbox"
                        checked={audit.enabled}
                        onChange={(e) => handleAuditToggle(audit.id, audit.scope, e.target.checked)}
                      />
                      <span className="dp-toggle-slider"></span>
                    </label>
                    <span className={`dp-audit-status dp-audit-status-${audit.enabled ? 'enabled' : 'disabled'}`}>
                      {audit.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engine Audits Section */}
      {editingScope === 'engine' && (
        <div className="dp-audits-section">
          <h4 className="dp-audits-section-title">
            <GlossaryTooltip term="audit">Engine Audits & Harvesters</GlossaryTooltip>
            <Tooltip content="These audits and harvesters are built into DevPulse and available to all projects">
              <span className="dp-help-icon">(?)</span>
            </Tooltip>
          </h4>

          <div className="dp-guidance-text">
            Engine audits are built-in validations and data collectors that DevPulse provides. They can be enabled or disabled per project.
          </div>

          {engineAuditsList.length === 0 ? (
            <p className="dp-audits-empty">No engine audits available</p>
          ) : (
            <div className="dp-audits-list">
              {engineAuditsList.map((audit) => (
                <div key={audit.id} className="dp-audit-item">
                  <div className="dp-audit-info">
                    <div className="dp-audit-name">{audit.name}</div>
                    <div className="dp-audit-description">{audit.description}</div>
                    <div className="dp-audit-category">
                      <span className="dp-category-badge dp-category-engine">Engine</span>
                      <span className="dp-category-badge dp-category-{audit.category}">{audit.category}</span>
                    </div>
                  </div>

                  <div className="dp-audit-controls">
                    <label className="dp-toggle">
                      <input
                        type="checkbox"
                        checked={audit.enabled}
                        onChange={(e) => handleAuditToggle(audit.id, audit.scope, e.target.checked)}
                      />
                      <span className="dp-toggle-slider"></span>
                    </label>
                    <span className={`dp-audit-status dp-audit-status-${audit.enabled ? 'enabled' : 'disabled'}`}>
                      {audit.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
