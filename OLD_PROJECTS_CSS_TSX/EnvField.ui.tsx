/**
 * @fileoverview ENV Field Component
 * @module devpulse-ui/wizards/env/EnvField
 *
 * Input field with blur/reveal, validation, and educational tooltips
 */

import React, { useState } from 'react';
import { LabelWithTooltip, type TooltipContent } from '../../education/Tooltip.ui';

export interface EnvFieldProps {
  fieldKey: string;
  devTerm: string;
  laymanTerm: string;
  tooltip: string;
  laymanTooltip?: string;
  example: string;
  exampleExplanation?: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'secret';
  inputType: 'text' | 'password' | 'number' | 'url' | 'email';
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  warning?: string;
  blurByDefault?: boolean;
  whyThisMatters?: string;
  learnMore?: {
    docsUrl?: string;
    videoUrl?: string;
    externalUrl?: string;
    externalLabel?: string;
  };
  showLaymanMode?: boolean;
}

export function EnvField({
  fieldKey,
  devTerm,
  laymanTerm,
  tooltip,
  laymanTooltip,
  example,
  exampleExplanation,
  type,
  inputType,
  required,
  value,
  onChange,
  onBlur,
  error,
  warning,
  blurByDefault = false,
  whyThisMatters,
  learnMore,
  showLaymanMode = true,
}: EnvFieldProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState(!blurByDefault);
  const [isFocused, setIsFocused] = useState(false);

  const tooltipContent: TooltipContent = {
    devTerm,
    laymanTerm,
    tooltip,
    laymanTooltip,
    example,
    exampleExplanation,
    whyThisMatters,
    learnMore,
  };

  const displayLabel = showLaymanMode && laymanTerm ? laymanTerm : devTerm;
  const isSecret = type === 'secret' || inputType === 'password';

  return (
    <div className="env-field">
      {/* Label with Tooltip */}
      <LabelWithTooltip
        label={displayLabel}
        required={required}
        content={tooltipContent}
        showLaymanMode={showLaymanMode}
      />

      {/* Input Container */}
      <div className="env-field-input-container">
        <input
          id={fieldKey}
          name={fieldKey}
          type={isSecret && !isRevealed ? 'password' : inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={isFocused ? example : `Enter ${displayLabel.toLowerCase()}...`}
          className={`env-field-input ${error ? 'error' : ''} ${warning ? 'warning' : ''}`}
          style={{
            filter: isSecret && !isRevealed && value ? 'blur(4px)' : 'none',
          }}
          required={required}
        />

        {/* Reveal/Blur Toggle for Secrets */}
        {isSecret && value && (
          <button
            type="button"
            className="env-field-reveal-btn"
            onClick={() => setIsRevealed(!isRevealed)}
            aria-label={isRevealed ? 'Hide value' : 'Show value'}
          >
            {isRevealed ? (
              // Eye slash icon (hide)
              <svg className="env-field-reveal-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              // Eye icon (show)
              <svg className="env-field-reveal-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Example Hint (on focus) */}
      {isFocused && example && !value && (
        <div className="env-field-hint">
          <span className="env-field-hint-label">Example:</span> {example}
          {exampleExplanation && (
            <span className="env-field-hint-explanation"> — {exampleExplanation}</span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="env-field-error">
          <svg className="env-field-error-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="env-field-error-text">{error}</span>
        </div>
      )}

      {/* Warning Message */}
      {warning && !error && (
        <div className="env-field-warning">
          <svg className="env-field-warning-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="env-field-warning-text">{warning}</span>
        </div>
      )}
    </div>
  );
}
