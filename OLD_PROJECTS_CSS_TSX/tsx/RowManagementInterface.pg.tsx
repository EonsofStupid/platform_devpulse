// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataClyffy/DataManage/pages/RowManagementInterface.pg.tsx
import {
  AlertTriangle,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
// AIDataCorrectionService placeholder - implement as needed
// TypeConversionService placeholder - implement as needed

interface RowData {
  id: string;
  [key: string]: any;
}

interface ValidationIssue {
  field: string;
  issue: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

interface RowManagementInterfaceProps {
  entityType: string;
  rowData: RowData;
  fieldRequirements: any[];
  onSave: (updatedData: RowData) => Promise<void>;
  onCancel: () => void;
  readOnly?: boolean;
}

export const RowManagementInterface: React.FC<RowManagementInterfaceProps> = ({
  entityType,
  rowData,
  fieldRequirements,
  onSave,
  onCancel,
  readOnly = false,
}) => {
  const { toast } = useToast();
  const [editedData, setEditedData] = useState<RowData>(rowData);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<Record<string, string>>({});
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    validateData();
  }, [editedData, fieldRequirements]);

  const validateData = () => {
    const issues: ValidationIssue[] = [];

    fieldRequirements.forEach((req) => {
      if (req.is_required) {
        const value = editedData[req.field_name];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          issues.push({
            field: req.field_name,
            issue: 'Required field is empty',
            severity: 'error',
          });
        }
      }
    });

    if (entityType === 'parts') {
      if (editedData.price && isNaN(parseFloat(editedData.price))) {
        issues.push({
          field: 'price',
          issue: 'Invalid price format',
          severity: 'error',
        });
      }

      ['image_url', 'datasheet_url'].forEach((urlField) => {
        if (editedData[urlField] && !isValidUrl(editedData[urlField])) {
          issues.push({
            field: urlField,
            issue: 'Invalid URL format',
            severity: 'warning',
            suggestion: 'Please enter a valid URL starting with http:// or https://',
          });
        }
      });

      if (editedData.sku && editedData.sku.length < 3) {
        issues.push({
          field: 'sku',
          issue: 'SKU should be at least 3 characters',
          severity: 'warning',
        });
      }
    }

    setValidationIssues(issues);
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
    setChangedFields((prev) => new Set(prev).add(field));
  };

  const handleAICorrection = async () => {
    setIsProcessingAI(true);
    try {
      const suggestions = await AIDataCorrectionService.suggestCorrections(
        entityType,
        editedData,
        validationIssues,
      );

      setAISuggestions(suggestions);
      setShowAISuggestions(true);

      toast({
        title: '✨ AI suggestions ready',
        description: 'Review the magical corrections below',
      });
    } catch (error: any) {
      toast({
        title: 'AI correction failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const applyAISuggestion = (field: string, suggestion: string) => {
    handleFieldChange(field, suggestion);
    setAISuggestions((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const handleSave = async () => {
    const criticalIssues = validationIssues.filter((issue) => issue.severity === 'error');
    if (criticalIssues.length > 0) {
      toast({
        title: 'Cannot save',
        description: 'Please fix all critical errors first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSave(editedData);
      toast({
        title: '✨ Data saved successfully',
        description: 'Row has been updated with magical precision',
      });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setEditedData(rowData);
    setChangedFields(new Set());
    setAISuggestions({});
    setShowAISuggestions(false);
  };

  const getFieldRequirement = (fieldName: string) => {
    return fieldRequirements.find((req) => req.field_name === fieldName);
  };

  const getFieldIssues = (fieldName: string) => {
    return validationIssues.filter((issue) => issue.field === fieldName);
  };

  const hasChanges = changedFields.size > 0;
  const criticalErrors = validationIssues.filter((issue) => issue.severity === 'error').length;

  return (
    <Card className="glass-rich border-neon-purple/30 hover-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-neon-purple font-orbitron">
              <Edit3 className="w-5 h-5" />
              Row Management
              <Sparkles className="w-4 h-4 animate-spin" />
            </CardTitle>
            <CardDescription>
              {readOnly ? 'View' : 'Edit'} individual record data with AI-assisted validation
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse">
                {changedFields.size} changes
              </Badge>
            )}
            {criticalErrors > 0 && (
              <Badge variant="destructive" className="animate-pulse border-red-500">
                {criticalErrors} errors
              </Badge>
            )}
            {!readOnly && validationIssues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAICorrection}
                disabled={isProcessingAI}
                className="border-neon-purple text-neon-purple hover:bg-neon-purple/20 hover:scale-105 transition-all duration-300"
              >
                {isProcessingAI ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Correct
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enhanced Validation Summary */}
        {validationIssues.length > 0 && (
          <Alert
            className={`${criticalErrors > 0 ? 'border-red-500 bg-red-900/20' : 'border-yellow-500 bg-yellow-900/20'} backdrop-blur-sm animate-pulse`}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Validation Issues:</strong> {criticalErrors} errors,{' '}
              {validationIssues.length - criticalErrors} warnings
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced AI Suggestions */}
        {showAISuggestions && Object.keys(aiSuggestions).length > 0 && (
          <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-purple-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                AI Suggestions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAISuggestions(false)}
                className="hover:bg-purple-500/20"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(aiSuggestions).map(([field, suggestion]) => (
                <div
                  key={field}
                  className="flex items-center justify-between p-3 bg-glass-card rounded hover:bg-glass-hover transition-all duration-300"
                >
                  <div>
                    <span className="text-sm font-medium text-white">{field}:</span>
                    <span className="text-sm ml-2 text-purple-300">{suggestion}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applyAISuggestion(field, suggestion)}
                    className="bg-purple-600 hover:bg-purple-700 hover:scale-105 transition-all duration-300"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Field Editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(editedData).map(([fieldName, value]) => {
            if (fieldName === 'id') return null;

            const requirement = getFieldRequirement(fieldName);
            const issues = getFieldIssues(fieldName);
            const hasError = issues.some((issue) => issue.severity === 'error');
            const hasWarning = issues.some((issue) => issue.severity === 'warning');
            const isChanged = changedFields.has(fieldName);

            return (
              <div key={fieldName} className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-white">
                  {fieldName}
                  {requirement?.is_required && (
                    <span className="text-red-400 animate-pulse">*</span>
                  )}
                  {isChanged && (
                    <Badge
                      variant="outline"
                      className="text-xs text-neon-cyan border-neon-cyan animate-pulse"
                    >
                      Changed
                    </Badge>
                  )}
                </label>

                <Input
                  value={value || ''}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  disabled={readOnly}
                  className={`
                    backdrop-blur-sm transition-all duration-300
                    ${hasError ? 'border-red-500 bg-red-900/20 animate-pulse' : ''}
                    ${hasWarning ? 'border-yellow-500 bg-yellow-900/20' : ''}
                    ${isChanged ? 'border-neon-cyan bg-cyan-900/10 shadow-neon-cyan/20 shadow-lg' : ''}
                    ${!hasError && !hasWarning && !isChanged ? 'bg-glass-card border-gray-600' : ''}
                  `}
                />

                {issues.map((issue, idx) => (
                  <p
                    key={idx}
                    className={`text-xs flex items-center gap-1 ${issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {issue.issue}
                    {issue.suggestion && ` - ${issue.suggestion}`}
                  </p>
                ))}
              </div>
            );
          })}
        </div>

        {/* Enhanced Actions */}
        {!readOnly && (
          <div className="flex justify-between pt-4 border-t border-gray-700/50">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
                className="border-gray-600 hover:bg-gray-700/50 hover:scale-105 transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-gray-600 hover:bg-gray-700/50 hover:scale-105 transition-all duration-300"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={criticalErrors > 0 || !hasChanges}
                className={`hover:scale-105 transition-all duration-300 ${hasChanges && criticalErrors === 0 ? 'bg-neon-green text-black hover:bg-neon-green/90 shadow-neon-green/30 shadow-lg' : 'bg-gray-600'}`}
              >
                <Save className="w-4 h-4 mr-2" />
                {hasChanges && criticalErrors === 0 && <Sparkles className="w-3 h-3 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
