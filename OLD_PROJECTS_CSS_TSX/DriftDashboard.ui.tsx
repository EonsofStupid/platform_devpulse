/**
 * @fileoverview Drift Detection Dashboard
 * @module devpulse-ui/scanners/drift/DriftDashboard
 *
 * Main UI for viewing and managing drift detection results
 */

import React, { useState, useEffect } from 'react';
import { ViolationCard } from './ViolationCard.ui';
import { ScanControls } from './ScanControls.ui';

// Simplified types for UI (full types are in backend)
interface DriftViolation {
  patternId: string;
  patternName: string;
  category: string;
  file: string;
  line?: number;
  column?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  umbrella: string;
  message: string;
  suggestion: string;
  autoFixable: boolean;
  autoFix?: {
    type: string;
    action: string;
    preview?: string;
  };
  codeSnippet?: string;
  examples?: {
    bad: string[];
    good: string[];
  };
}

interface ScanResult {
  success: boolean;
  timestamp: string;
  duration: number;
  scope: string;
  filesScanned: number;
  violations: DriftViolation[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    autoFixable: number;
  };
  byCategory: Record<string, number>;
  byUmbrella: Record<string, number>;
  errors: string[];
  warnings: string[];
}

interface RpcClient {
  send: (type: string, data?: unknown) => Promise<{ data: unknown }>;
}

export interface DriftDashboardProps {
  rpc: RpcClient;
  showLaymanMode?: boolean;
}

export function DriftDashboard({
  rpc,
  showLaymanMode = true,
}: DriftDashboardProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string[]>(['critical', 'high', 'medium', 'low']);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [showAutoFixableOnly, setShowAutoFixableOnly] = useState(false);

  // Load last scan result on mount
  useEffect(() => {
    async function loadLastScan() {
      try {
        setLoading(true);
        const response = await rpc.send('scanner.drift.lastResult.req');
        const data = response.data as { result: ScanResult | null };

        if (data.result) {
          setScanResult(data.result);
        }
      } catch (err) {
        console.error('Failed to load last scan:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadLastScan();
  }, [rpc]);

  // Run scan
  async function runScan(options: {
    scope?: string;
    categories?: string[];
    severityThreshold?: string;
  }) {
    try {
      setScanning(true);
      setError(null);

      const response = await rpc.send('scanner.drift.scan.req', options);
      const data = response.data as { result: ScanResult; error?: string };

      if (data.error) {
        setError(data.error);
      } else {
        setScanResult(data.result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run scan');
    } finally {
      setScanning(false);
    }
  }

  // Auto-fix violations
  async function autoFix(violationIds: string[]) {
    try {
      setLoading(true);
      await rpc.send('scanner.drift.autoFix.req', { violationIds });

      // Re-run scan to see results
      await runScan({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-fix');
    } finally {
      setLoading(false);
    }
  }

  // Filter violations
  const filteredViolations = scanResult?.violations.filter((violation) => {
    if (!severityFilter.includes(violation.severity)) return false;
    if (categoryFilter.length > 0 && !categoryFilter.includes(violation.category)) return false;
    if (showAutoFixableOnly && !violation.autoFixable) return false;
    return true;
  }) || [];

  // Get unique categories
  const categories = scanResult
    ? Array.from(new Set(scanResult.violations.map((v) => v.category)))
    : [];

  if (loading && !scanResult) {
    return <div className="drift-dashboard-loading">Loading drift detection...</div>;
  }

  return (
    <div className="drift-dashboard">
      {/* Header */}
      <div className="drift-dashboard-header">
        <h1 className="drift-dashboard-title">
          {showLaymanMode ? 'AI Drift Detection' : 'Drift Scanner'}
        </h1>
        <p className="drift-dashboard-description">
          {showLaymanMode
            ? 'Detect when AI accidentally changes your code patterns'
            : 'Monitor codebase for AI-introduced pattern violations'}
        </p>
      </div>

      {/* Scan Controls */}
      <ScanControls
        onScan={runScan}
        scanning={scanning}
        lastScan={scanResult?.timestamp}
        showLaymanMode={showLaymanMode}
      />

      {/* Error Display */}
      {error && (
        <div className="drift-dashboard-error">
          <div className="drift-dashboard-error-icon">⚠️</div>
          <div className="drift-dashboard-error-message">{error}</div>
        </div>
      )}

      {/* Scan Results */}
      {scanResult && (
        <>
          {/* Summary Cards */}
          <div className="drift-dashboard-summary">
            <div className="drift-summary-card">
              <div className="drift-summary-card-value">{scanResult.filesScanned}</div>
              <div className="drift-summary-card-label">
                {showLaymanMode ? 'Files Checked' : 'Files Scanned'}
              </div>
            </div>

            <div className="drift-summary-card">
              <div className="drift-summary-card-value">{scanResult.summary.total}</div>
              <div className="drift-summary-card-label">
                {showLaymanMode ? 'Issues Found' : 'Violations'}
              </div>
            </div>

            <div className="drift-summary-card drift-summary-card-critical">
              <div className="drift-summary-card-value">{scanResult.summary.critical}</div>
              <div className="drift-summary-card-label">Critical</div>
            </div>

            <div className="drift-summary-card drift-summary-card-high">
              <div className="drift-summary-card-value">{scanResult.summary.high}</div>
              <div className="drift-summary-card-label">High</div>
            </div>

            <div className="drift-summary-card drift-summary-card-medium">
              <div className="drift-summary-card-value">{scanResult.summary.medium}</div>
              <div className="drift-summary-card-label">Medium</div>
            </div>

            <div className="drift-summary-card drift-summary-card-low">
              <div className="drift-summary-card-value">{scanResult.summary.low}</div>
              <div className="drift-summary-card-label">Low</div>
            </div>

            <div className="drift-summary-card drift-summary-card-fixable">
              <div className="drift-summary-card-value">{scanResult.summary.autoFixable}</div>
              <div className="drift-summary-card-label">
                {showLaymanMode ? 'Auto-Fixable' : 'Can Auto-Fix'}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="drift-dashboard-filters">
            <div className="drift-filter-group">
              <label className="drift-filter-label">
                {showLaymanMode ? 'Priority Level' : 'Severity'}:
              </label>
              <div className="drift-filter-checkboxes">
                {['critical', 'high', 'medium', 'low'].map((severity) => (
                  <label key={severity} className="drift-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={severityFilter.includes(severity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSeverityFilter([...severityFilter, severity]);
                        } else {
                          setSeverityFilter(severityFilter.filter((s) => s !== severity));
                        }
                      }}
                    />
                    <span className={`drift-severity-badge drift-severity-${severity}`}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="drift-filter-group">
              <label className="drift-filter-label">Category:</label>
              <div className="drift-filter-checkboxes">
                <label className="drift-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={categoryFilter.length === 0}
                    onChange={() => setCategoryFilter([])}
                  />
                  <span>All</span>
                </label>
                {categories.map((category) => (
                  <label key={category} className="drift-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={categoryFilter.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCategoryFilter([...categoryFilter, category]);
                        } else {
                          setCategoryFilter(categoryFilter.filter((c) => c !== category));
                        }
                      }}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="drift-filter-group">
              <label className="drift-filter-checkbox">
                <input
                  type="checkbox"
                  checked={showAutoFixableOnly}
                  onChange={(e) => setShowAutoFixableOnly(e.target.checked)}
                />
                <span>{showLaymanMode ? 'Show Only Fixable Issues' : 'Auto-Fixable Only'}</span>
              </label>
            </div>
          </div>

          {/* Violations List */}
          <div className="drift-dashboard-violations">
            <div className="drift-violations-header">
              <h2 className="drift-violations-title">
                {filteredViolations.length} {showLaymanMode ? 'Issues' : 'Violations'}
              </h2>

              {filteredViolations.some((v) => v.autoFixable) && (
                <button
                  className="drift-violations-fix-all-btn"
                  onClick={() => {
                    const fixableIds = filteredViolations
                      .filter((v) => v.autoFixable)
                      .map((v) => v.patternId);
                    void autoFix(fixableIds);
                  }}
                  disabled={loading}
                >
                  {showLaymanMode ? 'Fix All Issues' : 'Auto-Fix All'}
                </button>
              )}
            </div>

            {filteredViolations.length === 0 ? (
              <div className="drift-violations-empty">
                <div className="drift-violations-empty-icon">✨</div>
                <div className="drift-violations-empty-title">
                  {showLaymanMode ? 'All Good!' : 'No Violations Found'}
                </div>
                <div className="drift-violations-empty-message">
                  {showLaymanMode
                    ? 'Your code follows all the patterns correctly.'
                    : 'Codebase is aligned with all drift detection rules.'}
                </div>
              </div>
            ) : (
              <div className="drift-violations-list">
                {filteredViolations.map((violation, index) => (
                  <ViolationCard
                    key={`${violation.file}-${violation.patternId}-${index}`}
                    violation={violation}
                    onAutoFix={
                      violation.autoFixable ? () => autoFix([violation.patternId]) : undefined
                    }
                    showLaymanMode={showLaymanMode}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!scanResult && !loading && (
        <div className="drift-dashboard-empty">
          <div className="drift-dashboard-empty-icon">🔍</div>
          <div className="drift-dashboard-empty-title">
            {showLaymanMode ? 'No Scan Results Yet' : 'No Scan Data'}
          </div>
          <div className="drift-dashboard-empty-message">
            {showLaymanMode
              ? 'Run your first scan to check for code pattern issues.'
              : 'Run a scan to detect drift violations.'}
          </div>
          <button
            className="drift-dashboard-empty-scan-btn"
            onClick={() => runScan({})}
            disabled={scanning}
          >
            {showLaymanMode ? 'Run First Scan' : 'Start Scan'}
          </button>
        </div>
      )}
    </div>
  );
}
