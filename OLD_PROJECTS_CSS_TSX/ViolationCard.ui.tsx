/**
 * @fileoverview Violation Card Component
 * @module devpulse-ui/scanners/drift/ViolationCard
 *
 * Displays individual drift violation with details and fix suggestions
 */

import React, { useState } from 'react';

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

export interface ViolationCardProps {
  violation: DriftViolation;
  onAutoFix?: () => void;
  showLaymanMode?: boolean;
}

export function ViolationCard({
  violation,
  onAutoFix,
  showLaymanMode = true,
}: ViolationCardProps): React.JSX.Element {
  const [showDetails, setShowDetails] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#65a30d',
  };

  const severityLabels = {
    critical: showLaymanMode ? 'Must Fix' : 'Critical',
    high: showLaymanMode ? 'Important' : 'High',
    medium: showLaymanMode ? 'Should Fix' : 'Medium',
    low: showLaymanMode ? 'Nice to Fix' : 'Low',
  };

  const fileLocation = violation.line
    ? `${violation.file}:${violation.line}`
    : violation.file;

  return (
    <div className={`violation-card violation-card-${violation.severity}`}>
      {/* Header */}
      <div className="violation-card-header">
        <div className="violation-card-title-section">
          <div className="violation-card-title">{violation.patternName}</div>
          <div className="violation-card-meta">
            <span
              className="violation-card-severity"
              style={{ backgroundColor: severityColors[violation.severity] }}
            >
              {severityLabels[violation.severity]}
            </span>
            <span className="violation-card-category">{violation.category}</span>
            <span className="violation-card-umbrella">
              📂 {violation.umbrella}
            </span>
          </div>
        </div>

        <div className="violation-card-actions">
          {violation.autoFixable && onAutoFix && (
            <button
              className="violation-card-fix-btn"
              onClick={onAutoFix}
              title={showLaymanMode ? 'Automatically fix this issue' : 'Auto-fix violation'}
            >
              ✨ {showLaymanMode ? 'Fix It' : 'Auto-Fix'}
            </button>
          )}

          <button
            className="violation-card-details-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '▼' : '▶'} {showLaymanMode ? 'Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* File Location */}
      <div className="violation-card-file">
        <span className="violation-card-file-icon">📄</span>
        <code className="violation-card-file-path">{fileLocation}</code>
      </div>

      {/* Message */}
      <div className="violation-card-message">{violation.message}</div>

      {/* Code Snippet */}
      {violation.codeSnippet && (
        <div className="violation-card-snippet">
          <div className="violation-card-snippet-label">
            {showLaymanMode ? 'Code:' : 'Code Snippet:'}
          </div>
          <pre className="violation-card-snippet-code">
            <code>{violation.codeSnippet}</code>
          </pre>
        </div>
      )}

      {/* Suggestion */}
      <div className="violation-card-suggestion">
        <div className="violation-card-suggestion-icon">💡</div>
        <div className="violation-card-suggestion-text">
          <strong>{showLaymanMode ? 'How to fix:' : 'Suggestion:'}</strong> {violation.suggestion}
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="violation-card-details">
          {/* Auto-Fix Preview */}
          {violation.autoFix && violation.autoFix.preview && (
            <div className="violation-card-autofix">
              <div className="violation-card-autofix-header">
                {showLaymanMode ? 'What Auto-Fix Will Do:' : 'Auto-Fix Action:'}
              </div>
              <div className="violation-card-autofix-action">{violation.autoFix.action}</div>
              <pre className="violation-card-autofix-preview">
                <code>{violation.autoFix.preview}</code>
              </pre>
            </div>
          )}

          {/* Examples Toggle */}
          {violation.examples && (
            <div className="violation-card-examples-section">
              <button
                className="violation-card-examples-toggle"
                onClick={() => setShowExamples(!showExamples)}
              >
                {showExamples ? '▼' : '▶'} {showLaymanMode ? 'Show Examples' : 'View Examples'}
              </button>

              {showExamples && (
                <div className="violation-card-examples">
                  {/* Bad Examples */}
                  {violation.examples.bad && violation.examples.bad.length > 0 && (
                    <div className="violation-card-examples-group">
                      <div className="violation-card-examples-label violation-card-examples-bad-label">
                        ❌ {showLaymanMode ? 'Wrong:' : 'Bad Examples:'}
                      </div>
                      {violation.examples.bad.map((example, index) => (
                        <pre key={index} className="violation-card-example violation-card-example-bad">
                          <code>{example}</code>
                        </pre>
                      ))}
                    </div>
                  )}

                  {/* Good Examples */}
                  {violation.examples.good && violation.examples.good.length > 0 && (
                    <div className="violation-card-examples-group">
                      <div className="violation-card-examples-label violation-card-examples-good-label">
                        ✅ {showLaymanMode ? 'Correct:' : 'Good Examples:'}
                      </div>
                      {violation.examples.good.map((example, index) => (
                        <pre key={index} className="violation-card-example violation-card-example-good">
                          <code>{example}</code>
                        </pre>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Why This Matters */}
          <div className="violation-card-why">
            <div className="violation-card-why-icon">📚</div>
            <div className="violation-card-why-text">
              <strong>{showLaymanMode ? 'Why this matters:' : 'Rationale:'}</strong>
              <p>
                This pattern belongs to the <strong>{violation.umbrella}</strong> umbrella, which
                helps maintain {showLaymanMode ? 'code quality and consistency' : 'codebase integrity'}.
              </p>
            </div>
          </div>

          {/* Pattern ID (for devs) */}
          {!showLaymanMode && (
            <div className="violation-card-pattern-id">
              Pattern ID: <code>{violation.patternId}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
