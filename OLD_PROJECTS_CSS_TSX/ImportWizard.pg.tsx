// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/pages/ImportWizard.pg.tsx
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Database, Sparkles, Zap } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import { useRouter, useParams } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  AnimatedStepTransition,
  EnhancedFileUploadStep,
  EnhancedWizardStepper,
  UniversalImportStep,
  WizardStepRenderer,
} from '../components/import';
// Data Maestro Integration
import { MaestroErrorBoundary } from '../components';
import { useEnhancedMaestroPermissions } from '../guards/EnhancedMaestroPermissionGuard';
import { DashboardTooltip, ImportTooltip } from '../utils/tooltip/MaestroTooltip';

import { MaestroOperationWrapper, MaestroProgressBar } from '../components/MaestroVisualFeedback';
import { useImportWizardStore } from '../stores/import-wizard.store';
import type { DataMaestroItemType } from '../hooks/useImport/useDataMaestroImport';
import { maestroToast } from '../services/maestro-toast-enhanced';

export const ImportWizard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const router = useRouter();
  const permissions = useEnhancedMaestroPermissions();

  // Zustand store
  const {
    currentStep,
    direction,
    loading,
    session,
    itemType,
    importStrategy,
    autoIdConfig,
    newFields,
    enterpriseValidation,
    steps,
    setCurrentStep,
    setLoading,
    setSession,
    setSessionId,
    setItemType,
    setImportStrategy,
    setAutoIdConfig,
    setNewFields,
    setEnterpriseValidation,
    setApprovedGaps,
    markStepCompleted,
    resetWizard,
  } = useImportWizardStore();

  useEffect(() => {
    if (sessionId) {
      loadSession();
    } else {
      setSessionId(null);
      resetWizard();
    }
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      maestroToast.spooky('Summoning Import Session', {
        description: 'Retrieving your magical data processing session...',
      });

      const { data, error } = await supabase
        .from('import_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      setSession(data);
      setSessionId(sessionId);
      setItemType((data.type as DataMaestroItemType) || null);

      const mappings = data.column_mappings;
      if (mappings && typeof mappings === 'object') {
        // Handle column mappings through store
      }

      // Extract and set other data from metadata
      const strategy = data.metadata?.import_strategy || 'upsert';
      setImportStrategy(strategy);

      const fields = data.metadata?.new_fields || [];
      setNewFields(fields);

      const autoId = data.metadata?.auto_id_config || {
        skuStrategy: 'AUTO',
        skuColumn: null,
        showAdvancedOptions: false,
      };
      setAutoIdConfig(autoId);

      const validation = data.metadata?.enterprise_validation;
      if (validation) {
        setEnterpriseValidation(validation);
      }

      const gaps = data.metadata?.approved_gaps || [];
      setApprovedGaps(gaps);

      // Determine current step based on session status with enhanced feedback
      let targetStep = 1;
      switch (data.status) {
        case 'uploaded':
          targetStep = 3;
          break;
        case 'mapped':
          targetStep = 4;
          break;
        case 'schema_evolved':
          targetStep = 5;
          break;
        case 'previewed':
          targetStep = 6;
          break;
        case 'ai_analyzed':
          targetStep = 7;
          break;
        case 'baseline_validated':
          targetStep = 8;
          break;
        case 'validated':
          targetStep = 9;
          break;
        case 'processing':
        case 'completed':
          targetStep = 9;
          break;
        default:
          targetStep = 2;
      }

      setCurrentStep(targetStep);

      maestroToast.success('Session Restored Successfully', {
        description: `Continuing from step ${targetStep}: ${steps[targetStep - 1]?.title}`,
      });
    } catch (error: unknown) {
      maestroToast.error('Session Loading Failed', {
        description: error instanceof Error ? error.message : 'Failed to retrieve import session',
        action: {
          label: 'Return to Hub',
          onClick: () => router.navigate({ to: '/admin/maestro/import' }),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (step: number, data?: Record<string, unknown>) => {
    try {
      setLoading(true);

      // Update session with step-specific data
      if (session?.id && data) {
        const updateData: Record<string, unknown> = {
          metadata: {
            ...session.metadata,
            last_completed_step: step,
          },
        };

        switch (step) {
          case 1:
            setItemType(data.itemType || null);
            setImportStrategy(data.importStrategy);
            updateData.metadata.item_type = data.itemType;
            updateData.metadata.import_strategy = data.importStrategy;
            maestroToast.festive('Import Configuration Set', {
              description: data.itemType
                ? `Ready to import ${data.itemType.replace('mi3dp_', '').replace('_', ' ')} with ${data.importStrategy} strategy`
                : `Import strategy set to ${data.importStrategy}`,
            });
            break;
          case 2:
            setSession(data.session);
            maestroToast.spooky('File Upload Complete', {
              description: 'Your data file has been processed and validated!',
            });
            break;
          case 3:
            updateData.column_mappings = data.mappings;
            updateData.metadata.new_fields = data.newFields;
            updateData.metadata.auto_id_config = data.autoIdConfig;
            updateData.status = 'mapped';
            maestroToast.success('Field Mapping Complete', {
              description: `Mapped ${Object.keys(data.mappings).length} columns successfully`,
            });
            break;
          case 4:
            updateData.metadata.schema_evolution = data;
            updateData.status = 'schema_evolved';
            maestroToast.festive('Schema Evolution Complete', {
              description: 'Database structure has been enhanced for your data',
            });
            break;
          case 5:
            updateData.status = 'previewed';
            maestroToast.info('Data Preview Complete', {
              description: 'Ready to proceed with AI analysis and validation',
            });
            break;
          case 6:
            setApprovedGaps(data.approvedGaps || []);
            updateData.metadata.ai_analysis = data;
            updateData.metadata.approved_gaps = data.approvedGaps;
            updateData.status = 'ai_analyzed';
            maestroToast.spooky('AI Analysis Complete', {
              description: 'Your data has been enhanced with artificial intelligence',
            });
            break;
          case 7:
            setEnterpriseValidation(data);
            updateData.metadata.enterprise_validation = data;
            updateData.status = 'baseline_validated';
            if (permissions.isSuperAdmin) {
              maestroToast.critical('Enterprise Validation Complete', {
                description: 'Data meets all enterprise security and quality standards',
              });
            } else {
              maestroToast.success('Validation Complete', {
                description: 'Data has been validated and approved for import',
              });
            }
            break;
          case 8:
            updateData.metadata.validated_data = data;
            updateData.status = 'validated';
            maestroToast.festive('Final Validation Complete', {
              description: 'All systems green! Ready for import execution',
            });
            break;
        }

        await supabase.from('import_sessions').update(updateData).eq('id', session.id);
      }

      // Move to next step with animation
      if (step < steps.length) {
        setCurrentStep(step + 1);
        markStepCompleted(step);
      }
    } catch (error: unknown) {
      maestroToast.error('Progress Save Failed', {
        description: error instanceof Error ? error.message : 'Failed to save wizard progress',
        action: {
          label: 'Retry',
          onClick: () => handleStepComplete(step, data),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    if (currentStep === 1) {
      return (
        <UniversalImportStep
          onComplete={(itemType, strategy) =>
            handleStepComplete(1, { itemType, importStrategy: strategy })
          }
          selectedEntity={itemType || undefined}
          selectedStrategy={importStrategy}
        />
      );
    }

    if (currentStep === 2) {
      if (!itemType) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-400">Please select an item type first</p>
            <Button onClick={handleBackStep} className="mt-4">
              Go Back
            </Button>
          </div>
        );
      }
      return (
        <EnhancedFileUploadStep
          onComplete={(data) => handleStepComplete(2, data)}
          onBack={handleBackStep}
          sessionId={sessionId}
          itemType={itemType}
          importStrategy={importStrategy}
        />
      );
    }

    return (
      <WizardStepRenderer
        currentStep={currentStep}
        selectedCategories={[]}
        sessionId={sessionId}
        itemType={itemType || undefined}
        importStrategy={importStrategy}
        session={session}
        fileData={[]}
        columnMappings={{}}
        enterpriseValidation={enterpriseValidation}
        approvedGaps={[]}
        newFields={newFields}
        onStepComplete={handleStepComplete}
        onBackStep={handleBackStep}
      />
    );
  };

  const getAutoIdBadgeText = () => {
    switch (autoIdConfig.skuStrategy) {
      case 'AUTO':
        return 'Auto-Generate IDs';
      case 'MAP':
        return 'Map from File';
      case 'MAP_AND_FILL_BLANKS':
        return 'Map + Auto-Fill';
      default:
        return 'Auto-Generate IDs';
    }
  };

  return (
    <MaestroErrorBoundary>
      <MaestroOperationWrapper
        isLoading={loading}
        loadingMessage="Processing import wizard..."
        variant="festive"
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <DashboardTooltip type="overview">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.navigate({ to: '/admin/maestro/import' })}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 font-orbitron hover-glow"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Import Hub
                  </Button>
                </DashboardTooltip>
                <div>
                  <h1 className="text-3xl font-orbitron font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    Enhanced Data Import Wizard
                  </h1>
                  <p className="text-gray-400 mt-1 font-rajdhani">
                    Visual multi-step process with AI enhancement and enterprise validation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {session && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-neon-cyan border-neon-cyan font-rajdhani"
                    >
                      <Database className="w-3 h-3 mr-1" />
                      Session: {session.id.slice(0, 8)}...
                    </Badge>
                  </motion.div>
                )}
                {itemType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-neon-purple border-neon-purple font-rajdhani"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {itemType.replace('mi3dp_', '').replace('_', ' ')}
                    </Badge>
                  </motion.div>
                )}
                {importStrategy && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-blue-400 border-blue-400 font-rajdhani"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {importStrategy === 'upsert'
                        ? 'Smart Update'
                        : importStrategy === 'insert_only'
                          ? 'Insert Only'
                          : 'Replace All'}
                    </Badge>
                  </motion.div>
                )}
                {itemType === 'mi3dp_parts' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-purple-400 border-purple-400 font-rajdhani"
                    >
                      IDs: {getAutoIdBadgeText()}
                    </Badge>
                  </motion.div>
                )}
                {permissions.isSuperAdmin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-yellow-400 border-yellow-400 font-rajdhani"
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      Super Admin
                    </Badge>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Progress Bar */}
            <MaestroProgressBar
              progress={(currentStep / steps.length) * 100}
              currentStep={steps[currentStep - 1]?.title}
              variant="spooky"
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Stepper Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="xl:col-span-1"
              >
                <ImportTooltip type="stepper">
                  <EnhancedWizardStepper
                    steps={steps}
                    currentStep={currentStep}
                    className="sticky top-6"
                  />
                </ImportTooltip>
              </motion.div>

              {/* Step Content */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="xl:col-span-3"
              >
                <AnimatedStepTransition
                  currentStep={currentStep}
                  direction={direction}
                  className="min-h-[600px]"
                >
                  {renderCurrentStep()}
                </AnimatedStepTransition>
              </motion.div>
            </div>
          </div>
        </div>
      </MaestroOperationWrapper>
    </MaestroErrorBoundary>
  );
};
