/**
 * @fileoverview Project Config Page - Configure MakersImpulse3D
 * @module devpulse-ui/pages/ProjectConfig
 * 
 * Configure rules and settings for MakersImpulse3D.
 * Sections: Project Connection, Governance Rules, Pre-Commit Gates, File Location Policies.
 */

import React, { useEffect, useState } from 'react';
import { getDevPulseRPC } from '../bridge/devpulse.rpc.svc';
import { GlossaryTooltip } from '../components/GlossaryTooltip.ui';

interface ProjectConnection {
  postgresHost: string;
  postgresPort: number;
  postgresDatabase: string;
  postgresUser: string;
  connected: boolean;
}

export function ProjectConfig(): React.JSX.Element {
  const [connection, setConnection] = useState<ProjectConnection>({
    postgresHost: 'localhost',
    postgresPort: 5432,
    postgresDatabase: 'makersimpulse',
    postgresUser: 'postgres',
    connected: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const rpc = getDevPulseRPC();
        const projectConfig = await rpc.projectConfigGet();
        if (projectConfig && typeof projectConfig === 'object' && 'name' in projectConfig) {
          // Project config loaded - could update connection state if needed
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load project config:', error);
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  if (loading) {
    return <div className="dp-loading">Loading project configuration...</div>;
  }

  return (
    <div className="dp-project-config">
      <h2 className="dp-project-config-title">Your Project</h2>

      {/* Project Connection */}
      <section className="dp-project-config-section">
        <h3 className="dp-project-config-section-title">Project Connection</h3>
        <p className="dp-project-config-section-help">
          Configure connection to your project's database and services
        </p>
        <div className="dp-project-config-form">
          <div className="dp-project-config-field">
            <label>
              PostgreSQL Host
              <input
                type="text"
                value={connection.postgresHost}
                onChange={(e) => setConnection(prev => ({ ...prev, postgresHost: e.target.value }))}
              />
            </label>
          </div>
          <div className="dp-project-config-field">
            <label>
              PostgreSQL Port
              <input
                type="number"
                value={connection.postgresPort}
                onChange={(e) => setConnection(prev => ({ ...prev, postgresPort: Number(e.target.value) }))}
              />
            </label>
          </div>
          <div className="dp-project-config-field">
            <label>
              Database Name
              <input
                type="text"
                value={connection.postgresDatabase}
                onChange={(e) => setConnection(prev => ({ ...prev, postgresDatabase: e.target.value }))}
              />
            </label>
          </div>
          <div className="dp-project-config-field">
            <label>
              Database User
              <input
                type="text"
                value={connection.postgresUser}
                onChange={(e) => setConnection(prev => ({ ...prev, postgresUser: e.target.value }))}
              />
            </label>
          </div>
          <div className="dp-project-config-status">
            <span className={`dp-project-config-status-indicator ${connection.connected ? 'connected' : 'disconnected'}`}>
              {connection.connected ? '●' : '○'} {connection.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button className="dp-btn dp-btn-primary">Test Connection</button>
        </div>
      </section>

      {/* Governance Rules */}
      <section className="dp-project-config-section">
        <h3 className="dp-project-config-section-title">
          <GlossaryTooltip term="governance">Governance</GlossaryTooltip> Rules
        </h3>
        <p className="dp-project-config-section-help">
          View and edit the <GlossaryTooltip term="suffix-matrix">Suffix Matrix</GlossaryTooltip> and <GlossaryTooltip term="naming-convention">Naming Conventions</GlossaryTooltip>
        </p>
        <div className="dp-project-config-actions">
          <button className="dp-btn dp-btn-secondary">View Suffix Matrix</button>
          <button className="dp-btn dp-btn-secondary">Edit Naming Conventions</button>
        </div>
      </section>

      {/* Pre-Commit Gates */}
      <section className="dp-project-config-section">
        <h3 className="dp-project-config-section-title">
          <GlossaryTooltip term="pre-commit">Pre-Commit</GlossaryTooltip> <GlossaryTooltip term="gate">Gates</GlossaryTooltip>
        </h3>
        <p className="dp-project-config-section-help">
          Toggle which <GlossaryTooltip term="check">checks</GlossaryTooltip> run before commits
        </p>
        <div className="dp-project-config-gates">
          <label className="dp-project-config-gate-item">
            <input type="checkbox" defaultChecked />
            <span>Enforce <GlossaryTooltip term="companion-files">Companion Files</GlossaryTooltip></span>
          </label>
          <label className="dp-project-config-gate-item">
            <input type="checkbox" defaultChecked />
            <span>Enforce <GlossaryTooltip term="suffix-matrix">Suffix Matrix</GlossaryTooltip> Compliance</span>
          </label>
          <label className="dp-project-config-gate-item">
            <input type="checkbox" defaultChecked />
            <span>Enforce <GlossaryTooltip term="file-location">File Location</GlossaryTooltip> Policies</span>
          </label>
        </div>
      </section>

      {/* File Location Policies */}
      <section className="dp-project-config-section">
        <h3 className="dp-project-config-section-title">
          <GlossaryTooltip term="file-location">File Location</GlossaryTooltip> Policies
        </h3>
        <p className="dp-project-config-section-help">
          Configure where different file types are allowed to exist
        </p>
        <div className="dp-project-config-policies">
          <div className="dp-project-config-policy-item">
            <strong><GlossaryTooltip term="css-checks">CSS Files</GlossaryTooltip>:</strong>
            <span>Only allowed in: client/src/styles, packages/devpulse-ui/src/styles</span>
            <button className="dp-btn dp-btn-secondary dp-btn-sm">Edit</button>
          </div>
        </div>
      </section>

      <div className="dp-project-config-actions-footer">
        <button className="dp-btn dp-btn-primary">Save Configuration</button>
      </div>
    </div>
  );
}

