// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/DataManage/pages/SchemaEvolutionManager.pg.tsx
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Database,
  Edit3,
  GitBranch,
  History,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

interface SchemaEvolution {
  id: string;
  entityType: string;
  version: number;
  fields: SchemaField[];
  migration: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'applied' | 'rolled_back';
}

interface SchemaEvolutionManagerProps {
  entityType: string;
  currentSchema: SchemaField[];
  onSchemaUpdate: (newSchema: SchemaField[]) => void;
}

export const SchemaEvolutionManager: React.FC<SchemaEvolutionManagerProps> = ({
  entityType,
  currentSchema,
  onSchemaUpdate,
}) => {
  const { toast } = useToast();
  const [evolutions, setEvolutions] = useState<SchemaEvolution[]>([]);
  const [proposedSchema, setProposedSchema] = useState<SchemaField[]>(currentSchema);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedMigration, setGeneratedMigration] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchemaEvolutions();
  }, [entityType]);

  useEffect(() => {
    validateSchema();
  }, [proposedSchema]);

  const loadSchemaEvolutions = async () => {
    try {
      const data = await SchemaEvolutionService.getEvolutions(entityType);
      setEvolutions(data);
    } catch (error: any) {
      toast({
        title: 'Failed to load schema history',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const validateSchema = () => {
    const errors: string[] = [];
    const fieldNames = new Set<string>();

    proposedSchema.forEach((field, index) => {
      if (fieldNames.has(field.name)) {
        errors.push(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);

      if (!field.name.trim()) {
        errors.push(`Field at position ${index + 1} has no name`);
      }

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push(
          `Invalid field name: ${field.name}. Use only letters, numbers, and underscores.`,
        );
      }

      const validTypes = ['text', 'integer', 'numeric', 'boolean', 'jsonb', 'timestamp'];
      if (!validTypes.includes(field.type)) {
        errors.push(`Invalid data type for ${field.name}: ${field.type}`);
      }
    });

    setValidationErrors(errors);
  };

  const addField = () => {
    setProposedSchema((prev) => [
      ...prev,
      {
        name: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    setProposedSchema((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field)),
    );
  };

  const removeField = (index: number) => {
    setProposedSchema((prev) => prev.filter((_, i) => i !== index));
  };

  const generateMigration = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: 'Cannot generate migration',
        description: 'Please fix validation errors first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const migration = await SchemaEvolutionService.generateMigration(
        entityType,
        currentSchema,
        proposedSchema,
      );
      setGeneratedMigration(migration);

      toast({
        title: '✨ Migration generated',
        description: 'Review the magical SQL migration before applying',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to generate migration',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyEvolution = async () => {
    if (!generatedMigration) {
      await generateMigration();
      return;
    }

    setLoading(true);
    try {
      const evolutionId = await SchemaEvolutionService.applyEvolution(
        entityType,
        proposedSchema,
        generatedMigration,
      );

      await loadSchemaEvolutions();
      onSchemaUpdate(proposedSchema);
      setIsEditing(false);
      setGeneratedMigration('');

      toast({
        title: '✨ Schema evolution applied',
        description: `Evolution ${evolutionId} has been successfully applied with magical precision`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to apply evolution',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const rollbackEvolution = async (evolutionId: string) => {
    setLoading(true);
    try {
      await SchemaEvolutionService.rollbackEvolution(evolutionId);
      await loadSchemaEvolutions();

      toast({
        title: '✨ Evolution rolled back',
        description: 'Schema has been reverted to previous state',
      });
    } catch (error: any) {
      toast({
        title: 'Rollback failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToCurrentSchema = () => {
    setProposedSchema(currentSchema);
    setGeneratedMigration('');
    setIsEditing(false);
  };

  const hasChanges = JSON.stringify(proposedSchema) !== JSON.stringify(currentSchema);

  return (
    <div className="space-y-6">
      <Card className="glass-rich border-neon-green/30 hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neon-green font-orbitron">
            <Database className="w-5 h-5" />
            Schema Evolution Manager
            <Sparkles className="w-4 h-4 animate-spin" />
          </CardTitle>
          <CardDescription>
            Manage and evolve the {entityType} schema with automatic migration generation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Enhanced Current Schema Overview */}
          <div className="bg-glass-card p-4 rounded-lg border border-neon-green/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-neon-green flex items-center gap-2">
                Current Schema
                <Sparkles className="w-4 h-4 animate-pulse" />
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 hover:scale-105 transition-all duration-300"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel Edit' : 'Edit Schema'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {currentSchema.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-glass-hover rounded hover:bg-glass-card transition-all duration-300"
                >
                  <div>
                    <span className="font-medium text-white">{field.name}</span>
                    <span className="text-sm text-gray-400 ml-2">({field.type})</span>
                  </div>
                  {field.required && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      Required
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Schema Editor */}
          {isEditing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-neon-purple flex items-center gap-2">
                  Edit Schema
                  <Sparkles className="w-4 h-4 animate-spin" />
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addField}
                  className="border-green-500 text-green-500 hover:bg-green-500/20 hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {/* Enhanced Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert className="border-red-500 bg-red-900/20 backdrop-blur-sm animate-pulse">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Validation Errors:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {validationErrors.map((error, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Field Editor */}
              <div className="space-y-3">
                {proposedSchema.map((field, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center p-3 bg-glass-card rounded-lg hover:bg-glass-hover transition-all duration-300 border border-gray-700/50"
                  >
                    <div className="col-span-3">
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        className="h-8 bg-glass-card border-gray-600"
                      />
                    </div>

                    <div className="col-span-2">
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(index, { type: value })}
                      >
                        <SelectTrigger className="h-8 bg-glass-card border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-glass-dark backdrop-blur-xl border-gray-600">
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="integer">Integer</SelectItem>
                          <SelectItem value="numeric">Numeric</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="jsonb">JSONB</SelectItem>
                          <SelectItem value="timestamp">Timestamp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Button
                        variant={field.required ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateField(index, { required: !field.required })}
                        className={`h-8 w-full transition-all duration-300 ${field.required ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-gray-700'}`}
                      >
                        {field.required ? 'Required' : 'Optional'}
                      </Button>
                    </div>

                    <div className="col-span-3">
                      <Input
                        placeholder="Default value"
                        value={field.defaultValue || ''}
                        onChange={(e) => updateField(index, { defaultValue: e.target.value })}
                        className="h-8 bg-glass-card border-gray-600"
                      />
                    </div>

                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20 hover:scale-110 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="col-span-1">
                      {JSON.stringify(field) !== JSON.stringify(currentSchema[index]) && (
                        <Badge
                          variant="outline"
                          className="text-yellow-400 border-yellow-400 animate-pulse"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Changed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Generated Migration */}
              {generatedMigration && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2 text-neon-cyan">
                    <Code className="w-4 h-4" />
                    Generated Migration
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </h4>
                  <pre className="bg-gray-900/50 p-4 rounded-lg text-sm overflow-x-auto border border-neon-cyan/20 backdrop-blur-sm">
                    <code className="text-neon-cyan">{generatedMigration}</code>
                  </pre>
                </div>
              )}

              {/* Enhanced Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-700/50">
                <Button
                  variant="outline"
                  onClick={resetToCurrentSchema}
                  disabled={!hasChanges}
                  className="border-gray-600 hover:bg-gray-700/50 hover:scale-105 transition-all duration-300"
                >
                  Reset
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateMigration}
                    disabled={validationErrors.length > 0 || !hasChanges || loading}
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/20 hover:scale-105 transition-all duration-300"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    {loading ? 'Generating...' : 'Generate Migration'}
                  </Button>
                  <Button
                    onClick={applyEvolution}
                    disabled={validationErrors.length > 0 || !hasChanges || loading}
                    className="bg-neon-green text-black hover:bg-neon-green/90 hover:scale-105 transition-all duration-300 shadow-neon-green/30 shadow-lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <Sparkles className="w-3 h-3 mr-1" />
                    Apply Evolution
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Evolution History */}
      <Card className="glass-rich border-neon-purple/30 hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neon-purple font-orbitron">
            <History className="w-5 h-5" />
            Evolution History
            <Sparkles className="w-4 h-4 animate-pulse" />
          </CardTitle>
          <CardDescription>
            Track and manage schema evolution history with rollback capabilities
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {evolutions.map((evolution) => (
              <div
                key={evolution.id}
                className="flex items-center justify-between p-4 bg-glass-card rounded-lg hover:bg-glass-hover transition-all duration-300 border border-gray-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-white">v{evolution.version}</span>
                  </div>

                  <Badge
                    variant={
                      evolution.status === 'applied'
                        ? 'default'
                        : evolution.status === 'draft'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="animate-pulse"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {evolution.status}
                  </Badge>

                  <span className="text-sm text-gray-400">{evolution.fields.length} fields</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {new Date(evolution.createdAt).toLocaleDateString()}
                  </span>

                  {evolution.status === 'applied' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rollbackEvolution(evolution.id)}
                      disabled={loading}
                      className="border-red-500 text-red-400 hover:bg-red-500/20 hover:scale-105 transition-all duration-300"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {evolutions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                No schema evolutions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
