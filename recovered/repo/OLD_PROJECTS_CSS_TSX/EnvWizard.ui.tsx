/**
 * @fileoverview ENV Wizard Component
 * @module devpulse-ui/wizards/env/EnvWizard
 *
 * Schema-driven environment variable configuration wizard
 */

import React, { useState, useEffect } from 'react';
import { WizardShell, type WizardStep } from '../base/WizardShell.ui';
import { EnvField } from './EnvField.ui';

// Simplified types for UI (full types are in backend)
interface WizardCategory {
  id: string;
  label: string;
  laymanLabel: string;
  description: string;
  icon: string;
  fields: WizardField[];
}

interface WizardField {
  key: string;
  devTerm: string;
  laymanTerm: string;
  tooltip: string;
  laymanTooltip?: string;
  example: string;
  exampleExplanation?: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'secret';
  inputType: 'text' | 'password' | 'number' | 'url' | 'email';
  required: boolean;
  scope: 'devpulse' | 'mapp';
  category: string;
  security: {
    storeIn: string;
    blurByDefault: boolean;
    dangerLevel?: string;
  };
  whyThisMatters?: string;
  learnMore?: {
    docsUrl?: string;
    videoUrl?: string;
    externalUrl?: string;
    externalLabel?: string;
  };
}

interface WizardState {
  currentStep: number;
  scope?: 'devpulse' | 'mapp';
  selectedCategories: string[];
  fieldValues: Record<string, unknown>;
  errors: Record<string, string>;
  warnings: string[];
}

interface RpcClient {
  send: (type: string, data?: unknown) => Promise<{ data: unknown }>;
}

export interface EnvWizardProps {
  rpc: RpcClient;
  onComplete?: (result: {
    success: boolean;
    filesWritten: string[];
    summary: {
      scope: string;
      categoriesConfigured: string[];
      fieldsSet: number;
      secretsStored: number;
    };
  }) => void;
  onCancel?: () => void;
  showLaymanMode?: boolean;
}

export function EnvWizard({
  rpc,
  onComplete,
  onCancel,
  showLaymanMode = true,
}: EnvWizardProps): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    selectedCategories: [],
    fieldValues: {},
    errors: {},
    warnings: [],
  });
  const [categories, setCategories] = useState<WizardCategory[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string[]>>({});

  // Initialize wizard
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const response = await rpc.send('wizard.env.init.req', {
          scope: state.scope,
        });

        const data = response.data as {
          schema?: unknown;
          state?: WizardState;
          categories?: WizardCategory[];
          error?: string;
        };

        if (data.error) {
          setError(data.error);
        } else {
          setState(data.state || state);
          setCategories(data.categories || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize wizard');
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [state.scope]);

  // Validate field on blur
  async function validateField(fieldKey: string, value: unknown) {
    try {
      const response = await rpc.send('wizard.env.validate.req', {
        fieldKey,
        value,
      });

      const validation = response.data as {
        valid: boolean;
        errors: string[];
        warnings: string[];
      };

      if (!validation.valid && validation.errors.length > 0) {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldKey]: validation.errors[0],
        }));
      } else {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldKey];
          return newErrors;
        });
      }

      if (validation.warnings.length > 0) {
        setFieldWarnings((prev) => ({
          ...prev,
          [fieldKey]: validation.warnings,
        }));
      } else {
        setFieldWarnings((prev) => {
          const newWarnings = { ...prev };
          delete newWarnings[fieldKey];
          return newWarnings;
        });
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
  }

  // Execute wizard
  async function executeWizard() {
    try {
      setLoading(true);
      const response = await rpc.send('wizard.env.execute.req', {
        state,
        dryRun: false,
      });

      const result = response.data as {
        success: boolean;
        filesWritten: string[];
        warnings: string[];
        errors: string[];
        summary: {
          scope: string;
          categoriesConfigured: string[];
          fieldsSet: number;
          secretsStored: number;
        };
      };

      if (result.success) {
        onComplete?.(result);
      } else {
        setError(result.errors.join('\n'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute wizard');
    } finally {
      setLoading(false);
    }
  }

  // Wizard steps
  const steps: WizardStep[] = [
    {
      id: 'scope',
      title: 'Scope Selection',
      laymanTitle: 'What to Configure',
      description: 'Choose whether to configure DevPulse or your app',
    },
    {
      id: 'categories',
      title: 'Category Selection',
      laymanTitle: 'What to Set Up',
      description: 'Select which types of services you need',
    },
    {
      id: 'fields',
      title: 'Field Input',
      laymanTitle: 'Fill in Details',
      description: 'Enter your API keys and configuration',
    },
    {
      id: 'review',
      title: 'Review',
      laymanTitle: 'Double-Check',
      description: 'Preview what will be saved',
    },
    {
      id: 'finish',
      title: 'Finish',
      laymanTitle: 'Save Settings',
      description: 'Save your configuration',
    },
  ];

  // Next button disabled logic
  const nextDisabled =
    (state.currentStep === 0 && !state.scope) ||
    (state.currentStep === 1 && state.selectedCategories.length === 0) ||
    (state.currentStep === 2 && Object.keys(fieldErrors).length > 0) ||
    loading;

  // Get fields for selected categories
  const selectedFields = categories
    .filter((cat) => state.selectedCategories.includes(cat.id))
    .flatMap((cat) => cat.fields);

  if (error) {
    return (
      <div className="wizard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onCancel}>Close</button>
      </div>
    );
  }

  if (loading && state.currentStep === 0) {
    return <div className="wizard-loading">Loading wizard...</div>;
  }

  return (
    <WizardShell
      title="ENV Configuration Wizard"
      laymanTitle="Set Up Environment Variables"
      description="Configure API keys and settings for DevPulse and your app"
      steps={steps}
      currentStep={state.currentStep}
      onNext={() => {
        if (state.currentStep === steps.length - 1) {
          void executeWizard();
        } else {
          setState({ ...state, currentStep: state.currentStep + 1 });
        }
      }}
      onBack={() => setState({ ...state, currentStep: state.currentStep - 1 })}
      onCancel={onCancel}
      onFinish={() => void executeWizard()}
      nextDisabled={nextDisabled}
      showLaymanMode={showLaymanMode}
    >
      {/* Step 1: Scope Selection */}
      {state.currentStep === 0 && (
        <div className="wizard-step-scope">
          <div className="scope-options">
            <button
              className={`scope-option ${state.scope === 'devpulse' ? 'selected' : ''}`}
              onClick={() => setState({ ...state, scope: 'devpulse' })}
            >
              <div className="scope-option-icon">⚙️</div>
              <div className="scope-option-title">DevPulse Engine</div>
              <div className="scope-option-description">
                {showLaymanMode
                  ? 'Configure DevPulse features (AI helpers, monitoring)'
                  : 'API keys and settings for DevPulse features'}
              </div>
            </button>

            <button
              className={`scope-option ${state.scope === 'mapp' ? 'selected' : ''}`}
              onClick={() => setState({ ...state, scope: 'mapp' })}
            >
              <div className="scope-option-icon">📦</div>
              <div className="scope-option-title">MAPP (Your App)</div>
              <div className="scope-option-description">
                {showLaymanMode
                  ? 'Configure your app (database, payments, email)'
                  : 'Database, payments, and app-specific settings'}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Category Selection */}
      {state.currentStep === 1 && (
        <div className="wizard-step-categories">
          <div className="categories-grid">
            {categories.map((category) => {
              const isSelected = state.selectedCategories.includes(category.id);

              return (
                <button
                  key={category.id}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    const newCategories = isSelected
                      ? state.selectedCategories.filter((id) => id !== category.id)
                      : [...state.selectedCategories, category.id];

                    setState({ ...state, selectedCategories: newCategories });
                  }}
                >
                  <div className="category-card-icon">{category.icon}</div>
                  <div className="category-card-title">
                    {showLaymanMode ? category.laymanLabel : category.label}
                  </div>
                  <div className="category-card-description">{category.description}</div>
                  <div className="category-card-checkbox">
                    {isSelected && <span>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Field Input */}
      {state.currentStep === 2 && (
        <div className="wizard-step-fields">
          {categories
            .filter((cat) => state.selectedCategories.includes(cat.id))
            .map((category) => (
              <div key={category.id} className="field-category">
                <h3 className="field-category-title">
                  {category.icon} {showLaymanMode ? category.laymanLabel : category.label}
                </h3>

                {category.fields.map((field) => (
                  <EnvField
                    key={field.key}
                    fieldKey={field.key}
                    devTerm={field.devTerm}
                    laymanTerm={field.laymanTerm}
                    tooltip={field.tooltip}
                    laymanTooltip={field.laymanTooltip}
                    example={field.example}
                    exampleExplanation={field.exampleExplanation}
                    type={field.type}
                    inputType={field.inputType}
                    required={field.required}
                    value={String(state.fieldValues[field.key] || '')}
                    onChange={(value) => {
                      setState({
                        ...state,
                        fieldValues: { ...state.fieldValues, [field.key]: value },
                      });
                    }}
                    onBlur={() => validateField(field.key, state.fieldValues[field.key])}
                    error={fieldErrors[field.key]}
                    warning={fieldWarnings[field.key]?.[0]}
                    blurByDefault={field.security.blurByDefault}
                    whyThisMatters={field.whyThisMatters}
                    learnMore={field.learnMore}
                    showLaymanMode={showLaymanMode}
                  />
                ))}
              </div>
            ))}
        </div>
      )}

      {/* Step 4: Review */}
      {state.currentStep === 3 && (
        <div className="wizard-step-review">
          <h3>Review Configuration</h3>

          <div className="review-summary">
            <div className="review-item">
              <strong>Scope:</strong> {state.scope === 'devpulse' ? 'DevPulse Engine' : 'MAPP'}
            </div>
            <div className="review-item">
              <strong>Categories:</strong> {state.selectedCategories.join(', ')}
            </div>
            <div className="review-item">
              <strong>Fields Configured:</strong> {Object.keys(state.fieldValues).length}
            </div>
          </div>

          <div className="review-preview">
            <h4>Preview .env File:</h4>
            <pre className="review-preview-content">
              {selectedFields.map((field) => {
                const value = state.fieldValues[field.key];
                if (!value) return null;

                const displayValue =
                  field.type === 'secret' ? '***' : String(value);

                return `${field.key}=${displayValue}\n`;
              }).join('')}
            </pre>
          </div>

          <div className="review-security-notice">
            <svg className="review-security-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <div>
              <strong>Security:</strong> Secrets will be stored in <code>.env.local</code> which
              is automatically gitignored.
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Finish (execution happens on button click) */}
      {state.currentStep === 4 && loading && (
        <div className="wizard-step-finish">
          <div className="wizard-loading-spinner">Saving configuration...</div>
        </div>
      )}
    </WizardShell>
  );
}
