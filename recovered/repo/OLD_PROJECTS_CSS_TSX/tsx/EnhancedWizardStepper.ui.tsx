// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataClyffy/components/import/EnhancedWizardStepper.ui.tsx
import { ArrowRight, CheckCircle, Circle, Clock, Sparkles } from 'lucide-react';
import type React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/common/lib/cn.utl';
import { ClyffyTooltip } from '../../utils/tooltip';

interface Step {
  id: number;
  title: string;
  description: string;
  status?: 'completed' | 'current' | 'pending';
}

interface EnhancedWizardStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const EnhancedWizardStepper: React.FC<EnhancedWizardStepperProps> = ({
  steps,
  currentStep,
  className,
}) => {
  const getStepStatus = (stepId: number): 'completed' | 'current' | 'pending' => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-neon-green" />;
      case 'current':
        return (
          <div className="relative">
            <Clock className="w-6 h-6 text-neon-cyan animate-pulse" />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-neon-purple animate-spin" />
          </div>
        );
      default:
        return <Circle className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <ClyffyTooltip id="import.wizard">
      <Card className={cn('glass-rich border-neon-cyan/30 overflow-hidden hover-glow', className)}>
        <div className="p-6 bg-gradient-to-br from-slate-900/90 to-blue-900/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white font-orbitron flex items-center gap-2">
              <div className="relative">
                🧙‍♂️
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-neon-purple animate-spin" />
              </div>
              Import Progress
            </h3>
            <div className="text-sm text-gray-400 font-rajdhani bg-gray-800/50 px-3 py-1 rounded-full border border-neon-cyan/20">
              Step {currentStep} of {steps.length}
            </div>
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.id} className="flex items-center group">
                    {/* Step Circle */}
                    <div className="relative">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2 glass-rich backdrop-blur-xl',
                          status === 'completed' &&
                            'bg-neon-green/20 border-neon-green shadow-lg shadow-neon-green/25 hover-glow scale-105',
                          status === 'current' &&
                            'bg-neon-cyan/20 border-neon-cyan shadow-lg shadow-neon-cyan/25 scale-110 animate-neon-pulse',
                          status === 'pending' &&
                            'bg-gray-800/60 border-gray-600 hover:border-gray-500 hover:scale-105',
                        )}
                      >
                        {getStepIcon(status)}
                      </div>

                      {/* Step Number for pending */}
                      {status === 'pending' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-400 font-orbitron">
                            {step.id}
                          </span>
                        </div>
                      )}

                      {/* Sparkle effect for completed */}
                      {status === 'completed' && (
                        <div className="absolute -inset-2 animate-pulse">
                          <Sparkles className="absolute top-0 right-0 w-4 h-4 text-neon-green animate-bounce" />
                        </div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="ml-4 min-w-0 flex-1">
                      <div
                        className={cn(
                          'font-semibold text-sm transition-all duration-300 font-orbitron',
                          status === 'completed' && 'text-neon-green drop-shadow-glow',
                          status === 'current' &&
                            'text-neon-cyan animate-neon-pulse drop-shadow-glow text-base',
                          status === 'pending' && 'text-gray-400',
                        )}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 max-w-[120px] truncate font-rajdhani">
                        {step.description}
                      </div>
                    </div>

                    {/* Connector */}
                    {!isLast && (
                      <div className="mx-4">
                        <ArrowRight
                          className={cn(
                            'w-5 h-5 transition-all duration-300',
                            status === 'completed' && 'text-neon-green animate-pulse',
                            status === 'current' &&
                              index < steps.length - 1 &&
                              'text-neon-cyan animate-bounce',
                            'text-gray-600',
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile: Vertical Layout */}
          <div className="lg:hidden space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className="flex items-start">
                  {/* Step Circle */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 glass-rich',
                        status === 'completed' &&
                          'bg-neon-green/20 border-neon-green hover-glow scale-105',
                        status === 'current' &&
                          'bg-neon-cyan/20 border-neon-cyan scale-110 animate-neon-pulse',
                        status === 'pending' && 'bg-gray-800 border-gray-600',
                      )}
                    >
                      {getStepIcon(status)}
                    </div>

                    {/* Vertical Connector */}
                    {!isLast && (
                      <div
                        className={cn(
                          'absolute left-1/2 top-12 w-0.5 h-8 -translate-x-0.5 transition-colors',
                          status === 'completed' &&
                            'bg-gradient-to-b from-neon-green to-neon-cyan animate-pulse',
                          'bg-gray-600',
                        )}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="ml-4 min-w-0 flex-1 pb-8">
                    <div
                      className={cn(
                        'font-semibold text-base transition-colors font-orbitron',
                        status === 'completed' && 'text-neon-green drop-shadow-glow',
                        status === 'current' &&
                          'text-neon-cyan animate-neon-pulse drop-shadow-glow',
                        status === 'pending' && 'text-gray-400',
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 font-rajdhani">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-400 mb-3 font-rajdhani">
              <span className="flex items-center gap-1">✨ Magical Progress</span>
              <span className="bg-gray-800/50 px-2 py-1 rounded border border-neon-cyan/20">
                {Math.round(((currentStep - 1) / steps.length) * 100)}% Complete
              </span>
            </div>
            <div className="relative w-full bg-gray-800/60 rounded-full h-3 overflow-hidden glass-rich border border-gray-700">
              <div
                className="h-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-green transition-all duration-700 ease-out mi-anim-shimmer relative overflow-hidden"
                style={{
                  width: `${((currentStep - 1) / steps.length) * 100}%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-right"></div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </ClyffyTooltip>
  );
};
