/**
 * @fileoverview Rule Creation Wizard - Multi-step wizard for creating governance rules
 * @module devpulse-ui/components/workflows/RuleCreationWizard
 * 
 * Guided workflow for creating governance rules with templates, live preview, and auto-generation.
 */

import React, { useState, useCallback } from 'react';
import { POLICY_TEMPLATES, getTemplateById, type PolicyTemplate } from '../../data/policyTemplates.const';
import { getDevPulseRPC } from '../../bridge/devpulse.rpc.svc';
import { GlossaryTooltip } from '../GlossaryTooltip.ui';

interface WizardStep {
  id: string;
  label: string;
  type: 'select' | 'input' | 'multi-select' | 'checkbox';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  required: boolean;
  helpText?: string;
}

interface WizardState {
  step: number;
  selectedTemplate: string | null;
  values: Record<string, unknown>;
  preview: { check: string; policy: Record<string, unknown> } | null;
  violations: Array<{ file: string; message: string }> | null;
}

export function RuleCreationWizard({ onComplete, onCancel }: { onComplete?: () => void; onCancel?: () => void }) {
  const [state, setState] = useState<WizardState>({
    step: 0,
    selectedTemplate: null,
    values: {},
    preview: null,
    violations: null,
  });

  const template = state.selectedTemplate ? getTemplateById(state.selectedTemplate) : null;
  const currentStep = template ? template.steps[state.step] : null;

  const handleTemplateSelect = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      selectedTemplate: templateId,
      step: 0,
      values: {},
      preview: null,
      violations: null,
    }));
  }, []);

  const handleStepNext = useCallback(() => {
    if (!template) return;
    
    if (state.step < template.steps.length - 1) {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
    } else {
      // Generate policy and show preview
      const policy = template.generatePolicy(state.values);
      setState(prev => ({ ...prev, preview: policy }));
    }
  }, [template, state.step, state.values]);

  const handleStepBack = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  }, []);

  const handleValueChange = useCallback((stepId: string, value: unknown) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [stepId]: value },
    }));
  }, []);

  const handlePreview = useCallback(async () => {
    if (!template || !state.preview) return;
    
    try {
      console.log('[DevPulse] RuleCreationWizard: Previewing rule...');
      // Call RPC to preview violations
      const rpc = getDevPulseRPC();
      // This would call a preview endpoint that shows what files would be affected
      // For now, just log
      console.log('[DevPulse] RuleCreationWizard: Preview policy:', state.preview);
    } catch (error) {
      console.error('[DevPulse] RuleCreationWizard: Preview failed:', error);
    }
  }, [template, state.preview]);

  const handleSave = useCallback(async () => {
    if (!template || !state.preview) return;
    
    try {
      console.log('[DevPulse] RuleCreationWizard: Saving rule...');
      const rpc = getDevPulseRPC();
      // This would save the policy to the appropriate profile folder
      // For now, just log
      console.log('[DevPulse] RuleCreationWizard: Saving policy:', state.preview);
      onComplete?.();
    } catch (error) {
      console.error('[DevPulse] RuleCreationWizard: Save failed:', error);
      alert(`Failed to save rule: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [template, state.preview, onComplete]);

  // Step 0: Template Selection
  if (state.step === 0 && !template) {
    return (
      <div className="dp-wizard">
        <h3 className="dp-wizard-title">Create New Governance Rule</h3>
        <p className="dp-wizard-description">
          Select a template to get started. Templates provide common patterns with minimal requirements.
        </p>
        
        <div className="dp-wizard-templates">
          {POLICY_TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="dp-wizard-template-card"
              onClick={() => handleTemplateSelect(t.id)}
            >
              <h4 className="dp-wizard-template-name">{t.name}</h4>
              <p className="dp-wizard-template-description">{t.description}</p>
              <span className="dp-wizard-template-category">{t.category}</span>
            </div>
          ))}
        </div>
        
        <div className="dp-wizard-actions">
          <button className="dp-btn dp-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Configuration Steps
  if (template && currentStep && state.step < template.steps.length) {
    const isLastStep = state.step === template.steps.length - 1;
    const currentValue = state.values[currentStep.id];

    return (
      <div className="dp-wizard">
        <div className="dp-wizard-progress">
          <div className="dp-wizard-progress-bar" style={{ width: `${((state.step + 1) / (template.steps.length + 1)) * 100}%` }} />
          <span className="dp-wizard-progress-text">
            Step {state.step + 1} of {template.steps.length + 1}
          </span>
        </div>

        <h3 className="dp-wizard-title">{currentStep.label}</h3>
        {currentStep.helpText && (
          <p className="dp-wizard-help">
            <GlossaryTooltip term="policy">{currentStep.helpText}</GlossaryTooltip>
          </p>
        )}

        <div className="dp-wizard-field">
          {currentStep.type === 'select' && currentStep.options && (
            <select
              value={String(currentValue || '')}
              onChange={(e) => handleValueChange(currentStep.id, e.target.value)}
              className="dp-wizard-input"
            >
              <option value="">Select...</option>
              {currentStep.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          {currentStep.type === 'input' && (
            <input
              type="text"
              value={String(currentValue || '')}
              onChange={(e) => handleValueChange(currentStep.id, e.target.value)}
              placeholder={currentStep.placeholder}
              className="dp-wizard-input"
            />
          )}

          {currentStep.type === 'multi-select' && currentStep.options && (
            <div className="dp-wizard-multi-select">
              {currentStep.options.map(opt => {
                const selected = Array.isArray(currentValue) && currentValue.includes(opt.value);
                return (
                  <label key={opt.value} className="dp-wizard-checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = Array.isArray(currentValue) ? currentValue : [];
                        const updated = e.target.checked
                          ? [...current, opt.value]
                          : current.filter(v => v !== opt.value);
                        handleValueChange(currentStep.id, updated);
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="dp-wizard-actions">
          {state.step > 0 && (
            <button className="dp-btn dp-btn-secondary" onClick={handleStepBack}>
              Back
            </button>
          )}
          <button
            className="dp-btn dp-btn-primary"
            onClick={handleStepNext}
            disabled={currentStep.required && !currentValue}
          >
            {isLastStep ? 'Preview' : 'Next'}
          </button>
          <button className="dp-btn dp-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Preview Step
  if (state.preview) {
    return (
      <div className="dp-wizard">
        <h3 className="dp-wizard-title">Review & Save</h3>
        <p className="dp-wizard-description">
          Review your rule configuration. Click "Preview" to see which files would be affected.
        </p>

        <div className="dp-wizard-preview">
          <div className="dp-wizard-preview-section">
            <h4>Check</h4>
            <code className="dp-wizard-code">{state.preview.check}</code>
          </div>
          <div className="dp-wizard-preview-section">
            <h4>Policy Configuration</h4>
            <pre className="dp-wizard-code">
              {JSON.stringify(state.preview.policy, null, 2)}
            </pre>
          </div>
        </div>

        <div className="dp-wizard-actions">
          <button className="dp-btn dp-btn-secondary" onClick={handleStepBack}>
            Back
          </button>
          <button className="dp-btn dp-btn-primary" onClick={handlePreview}>
            Preview Violations
          </button>
          <button className="dp-btn dp-btn-solid" onClick={handleSave}>
            Save Rule
          </button>
          <button className="dp-btn dp-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}

