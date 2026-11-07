/**
 * @fileoverview Contracts Tab - Companion File Checks
 * @module devpulse-ui/panels/tabs/ContractsTab
 * 
 * Lists missing/mismatched companion files with navigation links.
 */

import React, { useEffect, useState } from "react";
import { getDevPulseRPC } from "../../bridge/devpulse.rpc.svc";

interface ScanContractsResult {
  missing: Array<{
    file: string;
    kind: string;
    expected: string;
  }>;
  mismatched: Array<{
    file: string;
    kind: string;
    found: string;
    expected: string;
  }>;
}

export function ContractsTab() {
  const [data, setData] = useState<ScanContractsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('[DevPulse] ContractsTab: Loading contracts...');
        const result = await getDevPulseRPC().scanContracts();
        setData(result);
        console.log('[DevPulse] ContractsTab: Contracts loaded:', result);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('[DevPulse] ContractsTab: Error loading contracts:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group by companion file type
  const groupedMissing = React.useMemo(() => {
    if (!data) return {};
    const groups: Record<string, typeof data.missing> = {};
    for (const item of data.missing) {
      if (!groups[item.kind]) {
        groups[item.kind] = [];
      }
      groups[item.kind].push(item);
    }
    return groups;
  }, [data]);

  const groupedMismatched = React.useMemo(() => {
    if (!data) return {};
    const groups: Record<string, typeof data.mismatched> = {};
    for (const item of data.mismatched) {
      if (!groups[item.kind]) {
        groups[item.kind] = [];
      }
      groups[item.kind].push(item);
    }
    return groups;
  }, [data]);

  if (loading) {
    return <div className="dp-section"><h3>Contracts</h3><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="dp-section"><h3>Contracts</h3><p className="dp-error-message">Error: {error}</p></div>;
  }

  if (!data) {
    return <div className="dp-section"><h3>Contracts</h3><p>No data available</p></div>;
  }

  const totalMissing = data.missing.length;
  const totalMismatched = data.mismatched.length;

  return (
    <div className="dp-section">
      <h3>Contracts</h3>
      
      {/* Summary */}
      <div className="dp-contracts-summary">
        <p>
          <strong>Missing companion files:</strong> {totalMissing} |{" "}
          <strong>Mismatched companion files:</strong> {totalMismatched}
        </p>
      </div>

      {/* Missing Files */}
      {totalMissing > 0 && (
        <div className="dp-contracts-section">
          <h4 className="dp-contracts-section-title dp-contracts-missing">Missing Companion Files ({totalMissing})</h4>
          {Object.entries(groupedMissing).map(([kind, items]) => (
            <div key={kind} className="dp-contracts-group">
              <h5>{kind} files ({items.length})</h5>
              <ul>
                {items.map((item, idx) => (
                  <li key={idx} className="dp-contracts-item">
                    <div>
                      <strong>File:</strong>{" "}
                      <a
                        href={`#file:${item.file}`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('devpulse:file:navigate', { 
                            detail: { file: item.file } 
                          }));
                        }}
                        className="dp-contracts-file-link"
                      >
                        {item.file}
                      </a>
                    </div>
                    <div>
                      <strong>Expected:</strong>{" "}
                      <a
                        href={`#file:${item.expected}`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('devpulse:file:navigate', { 
                            detail: { file: item.expected } 
                          }));
                        }}
                        className="dp-contracts-expected-link"
                      >
                        {item.expected}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Mismatched Files */}
      {totalMismatched > 0 && (
        <div className="dp-contracts-section">
          <h4 className="dp-contracts-section-title dp-contracts-mismatched">Mismatched Companion Files ({totalMismatched})</h4>
          {Object.entries(groupedMismatched).map(([kind, items]) => (
            <div key={kind} className="dp-contracts-group">
              <h5>{kind} files ({items.length})</h5>
              <ul>
                {items.map((item, idx) => (
                  <li key={idx} className="dp-contracts-item">
                    <div>
                      <strong>File:</strong>{" "}
                      <a
                        href={`#file:${item.file}`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('devpulse:file:navigate', { 
                            detail: { file: item.file } 
                          }));
                        }}
                        className="dp-contracts-file-link"
                      >
                        {item.file}
                      </a>
                    </div>
                    <div>
                      <strong>Found:</strong> {item.found}
                    </div>
                    <div>
                      <strong>Expected:</strong>{" "}
                      <a
                        href={`#file:${item.expected}`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('devpulse:file:navigate', { 
                            detail: { file: item.expected } 
                          }));
                        }}
                        className="dp-contracts-expected-link"
                      >
                        {item.expected}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {totalMissing === 0 && totalMismatched === 0 && (
        <p className="dp-contracts-success">✅ All companion files are present and correct.</p>
      )}
    </div>
  );
}

