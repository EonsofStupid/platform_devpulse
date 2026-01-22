// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/components/import/WizardStepRenderer.tsx
import type React from 'react';
import type { DataGap } from '@/admin/features/datamaestro/services/ai-data-correction.service';
import type { EnterpriseValidation } from '@/admin/features/datamaestro/types/enterprise-import.types';
import { MaestroTooltip } from '../../utils/tooltip';
import { BaselineProtectionStep } from './BaselineProtectionStep.ui';
import { CategoryManagementStep } from './CategoryManagementStep.ui';
import { DataPreviewStep } from './DataPreviewStep.ui';
import { EnhancedAIAnalysisStep } from './EnhancedAIAnalysisStep.ui';
import { EnhancedImportExecutionStep } from './EnhancedImportExecutionStep.ui';
import { FieldMappingStep } from './FieldMappingStep.ui';
import { FileUploadStep } from './FileUploadStep.ui';
import { SchemaEvolutionStep } from './SchemaEvolutionStep.ui';
import { ValidationAndCorrectionStep } from './ValidationAndCorrectionStep';

interface WizardStepRendererProps {
  currentStep: number;
  selectedCategories: string[];
  sessionId?: string;
  entityType: string;
  importStrategy: string;
  session: any;
  fileData: any[];
  columnMappings: Record<string, string>;
  enterpriseValidation: EnterpriseValidation | null;
  approvedGaps?: DataGap[];
  newFields?: string[];
  onStepComplete: (step: number, data?: any) => void;
  onBackStep: () => void;
}

export const WizardStepRenderer: React.FC<WizardStepRendererProps> = ({
  currentStep,
  selectedCategories,
  sessionId,
  entityType,
  importStrategy,
  session,
  fileData,
  columnMappings,
  enterpriseValidation,
  approvedGaps,
  newFields = [],
  onStepComplete,
  onBackStep,
}) => {
  const renderStepWithTooltip = (step: React.ReactNode, tooltipId: string) => (
    <MaestroTooltip id={tooltipId}>
      <div className="glass-rich rich-interactive-element hover-glow transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 rounded-lg -z-10" />
        <div className="relative z-10">{step}</div>
      </div>
    </MaestroTooltip>
  );

  switch (currentStep) {
    case 1:
      return renderStepWithTooltip(
        <CategoryManagementStep
          onComplete={(taxonomies) => onStepComplete(1, taxonomies)}
          onBack={onBackStep}
          preSelectedCategories={selectedCategories}
        />,
        'schema.builder',
      );
    case 2:
      return renderStepWithTooltip(
        <FileUploadStep
          onComplete={(data) => onStepComplete(2, data)}
          sessionId={sessionId}
          entityType={entityType}
          importStrategy={importStrategy}
        />,
        'import.wizard',
      );
    case 3:
      return renderStepWithTooltip(
        <FieldMappingStep
          session={session}
          fileData={fileData}
          entityType={entityType}
          onComplete={(mappings, newFields, autoIdConfig) =>
            onStepComplete(3, { mappings, newFields, autoIdConfig })
          }
          onBack={onBackStep}
        />,
        'import.mapping',
      );
    case 4:
      return renderStepWithTooltip(
        <SchemaEvolutionStep
          session={session}
          entityType={entityType}
          newFields={newFields}
          fileData={fileData}
          onComplete={(data) => onStepComplete(4, data)}
          onBack={onBackStep}
        />,
        'schema.builder',
      );
    case 5:
      return renderStepWithTooltip(
        <DataPreviewStep
          session={session}
          fileData={fileData}
          mappings={columnMappings}
          onComplete={(data) => onStepComplete(5, data)}
          onBack={onBackStep}
        />,
        'import.validation',
      );
    case 6:
      return renderStepWithTooltip(
        <EnhancedAIAnalysisStep
          session={session}
          fileData={fileData}
          mappings={columnMappings}
          onComplete={(data) => onStepComplete(6, data)}
          onBack={onBackStep}
        />,
        'operation.bulk-import',
      );
    case 7:
      return renderStepWithTooltip(
        <BaselineProtectionStep
          session={session}
          entityType={entityType}
          importData={fileData}
          onValidationComplete={(validation) => onStepComplete(7, validation)}
          onNext={() => onStepComplete(7)}
          onBack={onBackStep}
        />,
        'operation.bulk-import',
      );
    case 8:
      return renderStepWithTooltip(
        <ValidationAndCorrectionStep
          session={session}
          fileData={fileData}
          mappings={columnMappings}
          entityType={entityType}
          onComplete={(data) => onStepComplete(8, data)}
          onBack={onBackStep}
        />,
        'import.validation',
      );
    case 9:
      return renderStepWithTooltip(
        <EnhancedImportExecutionStep
          session={session}
          fileData={fileData}
          mappings={columnMappings}
          entityType={entityType}
          validation={enterpriseValidation}
          onBack={onBackStep}
        />,
        'operation.bulk-import',
      );
    default:
      return null;
  }
};
