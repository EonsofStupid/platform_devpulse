// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataClyffy/FileUpload/FileUploadWizard.ui.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Cloud,
  Database,
  File,
  Image,
  Loader2,
  Music,
  Upload,
  Video,
  X,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
// storageService placeholder - implement as needed
import type { StorageProvider, UploadOptions, UploadProgress } from '@/types/storage-types';

interface FileUploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  itemType?: string;
  itemId?: string;
  onUploadComplete?: (files: any[]) => void;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: UploadProgress;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  result?: any;
}

export const FileUploadWizard: React.FC<FileUploadWizardProps> = ({
  isOpen,
  onClose,
  itemType,
  itemId,
  onUploadComplete,
}) => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    itemType,
    itemId,
    isFeatured: false,
    processingOptions: {
      generateThumbnail: true,
      optimize: true,
    },
  });
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Fetch storage providers
  const { data: providers = [] } = useQuery({
    queryKey: ['storage-providers'],
    queryFn: () => storageService.getActiveProviders(),
    enabled: isOpen,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileWithProgress: FileWithProgress) => {
      const options = {
        ...uploadOptions,
        storageProviderId: selectedProvider || undefined,
      };

      return storageService.uploadFile(fileWithProgress.file, options, (progress) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id ? { ...f, progress, status: 'uploading' as const } : f,
          ),
        );
      });
    },
    onSuccess: (result, fileWithProgress) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id ? { ...f, status: 'completed' as const, result } : f,
        ),
      );
    },
    onError: (error: any, fileWithProgress) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, status: 'failed' as const, error: error.message }
            : f,
        ),
      );
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: {
        loaded: 0,
        total: file.size,
        percentage: 0,
        speed: 0,
        estimatedTime: 0,
      },
      status: 'pending',
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const startUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (const file of pendingFiles) {
      uploadMutation.mutate(file);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case 'supabase':
        return <Database className="w-4 h-4" />;
      case 's3':
      case 'gcs':
      case 'gdrive':
        return <Cloud className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  };

  const completedFiles = files.filter((f) => f.status === 'completed');
  const canClose = files.length === 0 || completedFiles.length === files.length;

  const handleClose = () => {
    if (onUploadComplete && completedFiles.length > 0) {
      onUploadComplete(completedFiles.map((f) => f.result));
    }
    onClose();
    setFiles([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gray-900 border-neon-green/30">
        <CardHeader className="bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border-b border-neon-green/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent">
                Multi-Cloud File Upload Wizard
              </CardTitle>
              <CardDescription className="text-gray-300">
                Upload files with intelligent routing and processing
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={!canClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div>
              <Label className="text-gray-200 mb-2 block">Storage Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Auto-select (Intelligent Routing)">
                    {selectedProvider ? (
                      <div className="flex items-center gap-2">
                        {getProviderIcon(
                          providers.find((p) => p.id === selectedProvider)?.type || '',
                        )}
                        {providers.find((p) => p.id === selectedProvider)?.name}
                      </div>
                    ) : (
                      'Auto-select (Intelligent Routing)'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Auto-select (Intelligent Routing)
                    </div>
                  </SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        {getProviderIcon(provider.type)}
                        {provider.name}
                        {provider.is_default && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured" className="text-gray-200">
                  Featured Image
                </Label>
                <Switch
                  id="featured"
                  checked={uploadOptions.isFeatured}
                  onCheckedChange={(checked) =>
                    setUploadOptions((prev) => ({
                      ...prev,
                      isFeatured: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="thumbnail" className="text-gray-200">
                  Generate Thumbnails
                </Label>
                <Switch
                  id="thumbnail"
                  checked={uploadOptions.processingOptions?.generateThumbnail}
                  onCheckedChange={(checked) =>
                    setUploadOptions((prev) => ({
                      ...prev,
                      processingOptions: {
                        ...prev.processingOptions,
                        generateThumbnail: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="optimize" className="text-gray-200">
                  Optimize Files
                </Label>
                <Switch
                  id="optimize"
                  checked={uploadOptions.processingOptions?.optimize}
                  onCheckedChange={(checked) =>
                    setUploadOptions((prev) => ({
                      ...prev,
                      processingOptions: {
                        ...prev.processingOptions,
                        optimize: checked,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
              ${
                isDragActive
                  ? 'border-neon-green bg-neon-green/10'
                  : 'border-gray-600 hover:border-neon-green/50 hover:bg-neon-green/5'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg text-gray-300 mb-2">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-sm text-gray-500">
              Supports images, videos, audio, PDFs, and text files up to 500MB
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Files ({files.length})</h3>
                {files.some((f) => f.status === 'pending') && (
                  <Button
                    onClick={startUpload}
                    disabled={uploadMutation.isPending}
                    className="bg-gradient-to-r from-neon-green to-neon-cyan text-black"
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Start Upload
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((fileWithProgress) => (
                  <div
                    key={fileWithProgress.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                  >
                    {getFileIcon(fileWithProgress.file.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {fileWithProgress.file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {formatFileSize(fileWithProgress.file.size)}
                          </span>
                          {fileWithProgress.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          {fileWithProgress.status === 'failed' && (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                          {fileWithProgress.status === 'uploading' && (
                            <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                          )}
                        </div>
                      </div>

                      {fileWithProgress.status === 'uploading' && (
                        <Progress value={fileWithProgress.progress.percentage} className="h-2" />
                      )}

                      {fileWithProgress.error && (
                        <p className="text-xs text-red-400 mt-1">{fileWithProgress.error}</p>
                      )}
                    </div>

                    {fileWithProgress.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileWithProgress.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
