// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/pages/DataManagement/SingleEntryCreator.tsx
import type React from 'react';
import { useState } from 'react';
import { useSearch, useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Mi3dpPartsService } from '@/domains/admin/features/DataMaestro/services/Mi3dpParts';

import { ArrowLeft, Cpu, Database, FileText, Sparkles, Wrench } from 'lucide-react';
import { useRouter as useTanstackRouter } from '@tanstack/react-router';
import { BuildsForm } from './forms/BuildsForm';
import { ManufacturersForm } from './forms/ManufacturersForm';
import { PartsForm } from './forms/PartsForm';

type PartsFormData = {
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  currency: string;
  manufacturer_id?: string;
  image_url?: string;
  datasheet_url?: string;
  buy_url?: string;
};

type BuildsFormData = {
  name: string;
  description?: string;
  printer_type?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_cost?: number;
  estimated_build_time?: string;
  visibility: 'private' | 'unlisted' | 'public';
};

type ManufacturersFormData = {
  name: string;
  description?: string;
  website?: string;
  country?: string;
  logo_url?: string;
};

const postTypeConfigs = {
  parts: {
    name: '3D Printer Part',
    icon: Wrench,
    color: 'neon-cyan',
  },
  builds: {
    name: 'Printer Build',
    icon: Cpu,
    color: 'neon-purple',
  },
  manufacturers: {
    name: 'Manufacturer',
    icon: Database,
    color: 'neon-pink',
  },
  cms_content: {
    name: 'CMS Content',
    icon: FileText,
    color: 'neon-slime',
  },
} as const;

type PostType = keyof typeof postTypeConfigs;

export const SingleEntryCreator: React.FC = () => {
  const search = useSearch({ from: '/admin/datamanagement/item/new' });
  const [selectedType, setSelectedType] = useState<PostType>((search?.type as PostType) || 'parts');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use sonner toast directly
  const navigateRouter = useTanstackRouter();

  const config = postTypeConfigs[selectedType];
  const IconComponent = config.icon;

  // Handle CMS content creation
  const handleCmsContentSelect = () => {
    toast({
      title: '✨ Redirecting to CMS',
      description: 'Opening rich content editor for CMS content creation',
    });
    navigate('/admin/maestro/cms/create');
  };

  const handlePartsSubmit = async (data: PartsFormData) => {
    setIsSubmitting(true);
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const cleanData = {
        ...data,
        slug,
        image_url: data.image_url || null,
        datasheet_url: data.datasheet_url || null,
        buy_url: data.buy_url || null,
      };

      await Mi3dpPartsService.create(cleanData as any);

      toast({
        title: '✨ Success',
        description: `${config.name} created successfully with magical precision`,
      });

      navigate('/admin/maestro/data-management');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuildsSubmit = async (data: BuildsFormData) => {
    setIsSubmitting(true);
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const cleanData = {
        ...data,
        slug,
      };

      console.log('Creating build:', cleanData);

      toast({
        title: '✨ Success',
        description: `${config.name} created successfully with magical precision`,
      });

      navigate('/admin/maestro/data-management');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManufacturersSubmit = async (data: ManufacturersFormData) => {
    setIsSubmitting(true);
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const cleanData = {
        ...data,
        slug,
        website: data.website || null,
        logo_url: data.logo_url || null,
      };

      console.log('Creating manufacturer:', cleanData);

      toast({
        title: '✨ Success',
        description: `${config.name} created successfully with magical precision`,
      });

      navigate('/admin/maestro/data-management');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create entry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigateRouter.navigate({ to: '/admin/maestro/data-management' });
    navigateRouter.navigate({ to: '/admin/maestro/data-management' });
    navigateRouter.navigate({ to: '/admin/maestro/data-management' });
    navigateRouter.navigate({ to: '/admin/maestro/data-management' });
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'parts':
        return (
          <PartsForm
            onSubmit={handlePartsSubmit}
            isSubmitting={isSubmitting}
            onCancel={handleCancel}
          />
        );
      case 'builds':
        return (
          <BuildsForm
            onSubmit={handleBuildsSubmit}
            isSubmitting={isSubmitting}
            onCancel={handleCancel}
          />
        );
      case 'manufacturers':
        return (
          <ManufacturersForm
            onSubmit={handleManufacturersSubmit}
            isSubmitting={isSubmitting}
            onCancel={handleCancel}
          />
        );
      case 'cms_content':
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-slime/20 to-neon-cyan/20 border border-neon-slime/50 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-neon-slime" />
              </div>
              <h3 className="text-2xl font-orbitron font-bold neon-text-slime mb-2">
                CMS Content Creation
              </h3>
              <p className="text-gray-300 font-rajdhani text-lg mb-6">
                Rich content with visual editor and Data Maestro item linking
              </p>
            </div>
            <Button
              onClick={handleCmsContentSelect}
              className="bg-gradient-to-r from-neon-slime/20 to-neon-cyan/20 border border-neon-slime/50 neon-text-slime hover:from-neon-slime/30 hover:to-neon-cyan/30 font-orbitron font-bold hover-glow"
            >
              <FileText className="w-4 h-4 mr-2" />
              <Sparkles className="w-3 h-3 mr-1" />
              Open CMS Editor
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/admin/maestro/data-management')}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/20 hover:scale-105 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Data Management
        </Button>
      </div>

      <Card className="glass-rich border-neon-cyan/30 hover-glow">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-${config.color}/20 rounded-lg`}>
              <IconComponent className={`w-8 h-8 text-${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-2xl text-neon-cyan font-orbitron flex items-center gap-2">
                <Sparkles className="w-6 h-6 animate-spin" />
                Create New {config.name}
              </CardTitle>
              <CardDescription>
                Add a single entry to the database with enhanced validation and magical precision
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Post Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">Content Type</label>
            <Select
              value={selectedType}
              onValueChange={(value: PostType) => setSelectedType(value)}
            >
              <SelectTrigger className="w-64 bg-glass-card border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-glass-dark backdrop-blur-xl border-gray-600">
                {Object.entries(postTypeConfigs).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      <Sparkles className="w-3 h-3" />
                      {config.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderForm()}
        </CardContent>
      </Card>
    </div>
  );
};
