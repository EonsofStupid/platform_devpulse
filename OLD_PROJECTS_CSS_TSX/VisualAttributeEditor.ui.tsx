// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/Overview/VisualAttributeEditor.ui.tsx
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Hash,
  Link2,
  Mail,
  Palette,
  Plus,
  Settings,
  ToggleLeft,
  Type,
  Upload,
  X,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { AttributeDataType, AttributeDefinition } from '@/types/data-maestro-types';

interface VisualAttributeEditorProps {
  attributes: Record<string, any>;
  attributeDefinitions: AttributeDefinition[];
  onChange: (key: string, value: any) => void;
  onAddCustomAttribute?: (key: string, value: any, type: AttributeDataType) => void;
}

interface AttributeFieldProps {
  definition: AttributeDefinition;
  value: any;
  onChange: (value: any) => void;
}

const AttributeField: React.FC<AttributeFieldProps> = ({ definition, value, onChange }) => {
  const getFieldIcon = (dataType: AttributeDataType) => {
    const iconMap = {
      text: Type,
      number: Hash,
      boolean: ToggleLeft,
      url: Globe,
      email: Mail,
      date: Calendar,
      json: FileText,
      array: FileText,
    };
    return iconMap[dataType] || Type;
  };

  const IconComponent = getFieldIcon(definition.dataType);

  const renderField = () => {
    switch (definition.dataType) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={definition.description || `Enter ${definition.name}`}
            className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={definition.description || `Enter ${definition.name}`}
            className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-3">
            <Switch checked={!!value} onCheckedChange={onChange} />
            <Label className="text-white">{value ? 'Enabled' : 'Disabled'}</Label>
          </div>
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={definition.description || `Enter ${definition.name}`}
            className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
          />
        );

      case 'url':
        return (
          <div className="space-y-2">
            <Input
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={definition.description || `Enter ${definition.name}`}
              className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
            />
            {value && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(value, '_blank')}
                className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/20"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Open Link
              </Button>
            )}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-black/30 border-white/20 text-white"
          />
        );

      case 'array':
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(value || []).map((item: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 pr-1"
                >
                  {item}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newArray = [...(value || [])];
                      newArray.splice(index, 1);
                      onChange(newArray);
                    }}
                    className="ml-1 h-4 w-4 p-0 hover:bg-red-500/20"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add item..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      onChange([...(value || []), input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
                className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        );

      case 'json':
        return (
          <Textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch (error) {
                onChange(e.target.value);
              }
            }}
            placeholder={definition.description || 'Enter JSON data'}
            className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 font-mono text-sm min-h-[120px]"
          />
        );

      default:
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={definition.description || `Enter ${definition.name}`}
            className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
          <IconComponent className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <Label className="text-white font-medium flex items-center gap-2">
            {definition.name}
            {definition.isRequired && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            {definition.unit && (
              <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
                {definition.unit}
              </Badge>
            )}
          </Label>
          {definition.description && (
            <p className="text-sm text-gray-400 mt-1">{definition.description}</p>
          )}
        </div>
      </div>
      {renderField()}
    </motion.div>
  );
};

export const VisualAttributeEditor: React.FC<VisualAttributeEditorProps> = ({
  attributes,
  attributeDefinitions,
  onChange,
  onAddCustomAttribute,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customAttributeKey, setCustomAttributeKey] = useState('');
  const [customAttributeValue, setCustomAttributeValue] = useState('');
  const [customAttributeType, setCustomAttributeType] = useState<AttributeDataType>('text');

  // Separate core and advanced attributes
  const coreDefinitions = attributeDefinitions.filter((def) => !def.metadata?.isAdvanced);
  const advancedDefinitions = attributeDefinitions.filter((def) => def.metadata?.isAdvanced);

  const handleAddCustomAttribute = () => {
    if (customAttributeKey.trim() && onAddCustomAttribute) {
      onAddCustomAttribute(customAttributeKey.trim(), customAttributeValue, customAttributeType);
      setCustomAttributeKey('');
      setCustomAttributeValue('');
      setCustomAttributeType('text');
    }
  };

  return (
    <div className="space-y-6">
      {/* Core Attributes */}
      {coreDefinitions.length > 0 && (
        <Card className="bg-gradient-to-br from-black/20 to-gray-900/40 border border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Palette className="w-5 h-5 text-cyan-400" />
              Core Attributes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coreDefinitions.map((definition) => (
                <AttributeField
                  key={definition.id}
                  definition={definition}
                  value={attributes[definition.slug]}
                  onChange={(value) => onChange(definition.slug, value)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Attributes */}
      {advancedDefinitions.length > 0 && (
        <Card className="bg-gradient-to-br from-black/20 to-gray-900/40 border border-white/10 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-white">
                <Settings className="w-5 h-5 text-purple-400" />
                Advanced Attributes
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="border-white/20 text-gray-300 hover:text-white"
              >
                {showAdvanced ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advancedDefinitions.map((definition) => (
                  <AttributeField
                    key={definition.id}
                    definition={definition}
                    value={attributes[definition.slug]}
                    onChange={(value) => onChange(definition.slug, value)}
                  />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Custom Attributes */}
      {onAddCustomAttribute && (
        <Card className="bg-gradient-to-br from-black/20 to-gray-900/40 border border-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Plus className="w-5 h-5 text-green-400" />
              Custom Attributes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Attribute name"
                value={customAttributeKey}
                onChange={(e) => setCustomAttributeKey(e.target.value)}
                className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
              />
              <Select
                value={customAttributeType}
                onValueChange={(value: AttributeDataType) => setCustomAttributeType(value)}
              >
                <SelectTrigger className="bg-black/30 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddCustomAttribute}
                disabled={!customAttributeKey.trim()}
                className="bg-green-500/20 border border-green-400/50 text-green-400 hover:bg-green-500/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            {customAttributeType !== 'boolean' && (
              <Input
                placeholder="Initial value (optional)"
                value={customAttributeValue}
                onChange={(e) => setCustomAttributeValue(e.target.value)}
                className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Custom Attributes Display */}
      {Object.keys(attributes).some(
        (key) => !attributeDefinitions.find((def) => def.slug === key),
      ) && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-400">
              <FileText className="w-5 h-5" />
              Existing Custom Attributes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(attributes)
              .filter(([key]) => !attributeDefinitions.find((def) => def.slug === key))
              .map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-white font-medium">{key}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={typeof value === 'object' ? JSON.stringify(value) : value || ''}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          onChange(key, parsed);
                        } catch {
                          onChange(key, e.target.value);
                        }
                      }}
                      className="bg-black/30 border-white/20 text-white"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onChange(key, undefined)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
