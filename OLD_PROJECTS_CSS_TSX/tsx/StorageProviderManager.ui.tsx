// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataClyffy/FileUpload/StorageProviderManager.ui.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Cloud,
  Database,
  Edit,
  Key,
  Plus,
  Settings,
  Trash,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import type { StorageProvider } from '@/types/storage-types';

interface StorageProviderManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageProviderManager: React.FC<StorageProviderManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<StorageProvider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'supabase' as const,
    config: {},
    is_active: true,
    is_default: false,
  });

  // Fetch storage providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['storage-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_providers')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Create/Update provider mutation
  const saveProviderMutation = useMutation({
    mutationFn: async (provider: any) => {
      if (editingProvider) {
        const { error } = await supabase
          .from('storage_providers')
          .update(provider)
          .eq('id', editingProvider.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('storage_providers').insert(provider);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
      toast.success(`Provider ${editingProvider ? 'updated' : 'created'} successfully`);
      handleCloseEditModal();
    },
    onError: (error: any) => {
      toast.error(`Failed to ${editingProvider ? 'update' : 'create'} provider: ${error.message}`);
    },
  });

  // Delete provider mutation
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('storage_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
      toast.success('Provider deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete provider: ${error.message}`);
    },
  });

  // Toggle provider status
  const toggleProviderMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const updateData = { [field]: value };

      // If setting as default, unset other defaults
      if (field === 'is_default' && value) {
        await supabase.from('storage_providers').update({ is_default: false }).neq('id', id);
      }

      const { error } = await supabase.from('storage_providers').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-providers'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update provider: ${error.message}`);
    },
  });

  const handleEdit = (provider: StorageProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type as any,
      config: provider.config,
      is_active: provider.is_active,
      is_default: provider.is_default,
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      type: 'supabase',
      config: {},
      is_active: true,
      is_default: false,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProvider(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Provider name is required');
      return;
    }

    saveProviderMutation.mutate(formData);
  };

  const handleDelete = (provider: StorageProvider) => {
    if (provider.is_default) {
      toast.error('Cannot delete the default storage provider');
      return;
    }

    if (confirm(`Are you sure you want to delete "${provider.name}"?`)) {
      deleteProviderMutation.mutate(provider.id);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'supabase':
        return <Database className="w-5 h-5" />;
      case 's3':
      case 'gcs':
      case 'gdrive':
        return <Cloud className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getConfigFields = (type: string) => {
    switch (type) {
      case 'supabase':
        return [
          {
            key: 'bucket',
            label: 'Bucket Name',
            type: 'text',
            placeholder: 'default',
          },
        ];
      case 's3':
        return [
          {
            key: 'region',
            label: 'Region',
            type: 'text',
            placeholder: 'us-east-1',
          },
          {
            key: 'bucket',
            label: 'Bucket Name',
            type: 'text',
            placeholder: 'my-bucket',
          },
          {
            key: 'accessKeyId',
            label: 'Access Key ID',
            type: 'password',
            placeholder: 'AKIAIOSFODNN7EXAMPLE',
          },
          {
            key: 'secretAccessKey',
            label: 'Secret Access Key',
            type: 'password',
            placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          },
          {
            key: 'endpoint',
            label: 'Custom Endpoint (Optional)',
            type: 'text',
            placeholder: 'https://s3.amazonaws.com',
          },
        ];
      case 'gcs':
        return [
          {
            key: 'projectId',
            label: 'Project ID',
            type: 'text',
            placeholder: 'my-project-id',
          },
          {
            key: 'bucket',
            label: 'Bucket Name',
            type: 'text',
            placeholder: 'my-bucket',
          },
          {
            key: 'keyFilename',
            label: 'Service Account Key File',
            type: 'textarea',
            placeholder: 'JSON key content',
          },
        ];
      case 'gdrive':
        return [
          {
            key: 'clientId',
            label: 'Client ID',
            type: 'password',
            placeholder: 'Google Drive Client ID',
          },
          {
            key: 'clientSecret',
            label: 'Client Secret',
            type: 'password',
            placeholder: 'Google Drive Client Secret',
          },
          {
            key: 'redirectUri',
            label: 'Redirect URI',
            type: 'text',
            placeholder: 'http://localhost:3000/auth/callback',
          },
          {
            key: 'folderId',
            label: 'Folder ID (Optional)',
            type: 'text',
            placeholder: 'Google Drive Folder ID',
          },
        ];
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
              Storage Provider Management
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure and manage your multi-cloud storage providers
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Manage storage providers for intelligent file routing
              </div>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-neon-green to-neon-cyan text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading providers...</div>
            ) : (
              <div className="grid gap-4">
                {providers.map((provider) => (
                  <Card key={provider.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getProviderIcon(provider.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">{provider.name}</h3>
                              {provider.is_default && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-neon-green/20 text-neon-green border-neon-green/50"
                                >
                                  Default
                                </Badge>
                              )}
                              {provider.is_active ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 capitalize">
                              {provider.type} Storage
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-4 mr-4">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-400">Active</Label>
                              <Switch
                                checked={provider.is_active}
                                onCheckedChange={(checked) =>
                                  toggleProviderMutation.mutate({
                                    id: provider.id,
                                    field: 'is_active',
                                    value: checked,
                                  })
                                }
                                disabled={toggleProviderMutation.isPending}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-400">Default</Label>
                              <Switch
                                checked={provider.is_default}
                                onCheckedChange={(checked) =>
                                  toggleProviderMutation.mutate({
                                    id: provider.id,
                                    field: 'is_default',
                                    value: checked,
                                  })
                                }
                                disabled={toggleProviderMutation.isPending}
                              />
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(provider)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(provider)}
                            disabled={provider.is_default}
                            className="text-gray-400 hover:text-red-400 disabled:opacity-50"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Provider Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingProvider ? 'Edit' : 'Add'} Storage Provider
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure the storage provider settings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-200">Provider Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="My Storage Provider"
                />
              </div>

              <div>
                <Label className="text-gray-200">Provider Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value, config: {} })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supabase">Supabase Storage</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                    <SelectItem value="gdrive">Google Drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Configuration Fields */}
            <div className="space-y-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Key className="w-4 h-4" />
                Configuration
              </div>

              {getConfigFields(formData.type).map((field) => (
                <div key={field.key}>
                  <Label className="text-gray-200">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={(formData.config as any)[field.key] || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            [field.key]: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={(formData.config as any)[field.key] || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            [field.key]: e.target.value,
                          },
                        })
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label className="text-gray-200">Active</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label className="text-gray-200">Set as Default</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseEditModal}
                  className="border-gray-600 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveProviderMutation.isPending}
                  className="bg-gradient-to-r from-neon-green to-neon-cyan text-black"
                >
                  {saveProviderMutation.isPending
                    ? 'Saving...'
                    : editingProvider
                      ? 'Update'
                      : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
