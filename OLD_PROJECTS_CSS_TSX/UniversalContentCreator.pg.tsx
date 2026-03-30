// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataClyffy/components/UniversalContentCreator.ui.tsx
import { motion } from 'framer-motion';
import { ArrowLeft, Database, FileText, Plus, Sparkles } from 'lucide-react';
import React from 'react';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClyffyTooltip } from '../utils/tooltip/ClyffyTooltip';
import { ClyffyPermissionGuard, useClyffyPermissions } from '../guards/ClyffyPermissionGuard';
import {
  type ContentType,
  useContentCreationStore,
} from '../stores/ContentCreation/ContentCreation.store';

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Database':
      return Database;
    case 'FileText':
      return FileText;
    default:
      return Plus;
  }
};

export const UniversalContentCreator: React.FC = () => {
  const router = useRouter();
  const permissions = useClyffyPermissions();
  const { availableContentTypes, selectedContentType, setContentType, resetCreation } =
    useContentCreationStore();

  React.useEffect(() => {
    // Reset creation state when component mounts
    resetCreation();
  }, [resetCreation]);

  const handleContentTypeSelect = (contentType: ContentType) => {
    clyffyToast.info(`Selected ${contentType.replace('_', ' ')}`, {
      description: 'Proceeding to content creation flow',
    });

    setContentType(contentType);

    // Route based on content type
    if (contentType === 'database_item') {
      router.navigate({ to: '/admin/clyffy/data-management/entities/new' });
    } else if (contentType === 'cms_content') {
      router.navigate({ to: '/admin/clyffy/cms/create' });
    }
  };

  const handleBack = () => {
    router.navigate({ to: '/admin/clyffy' });
  };

  return (
    <div className="space-y-8 rich-content-section min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="database-header rich-entrance-animation p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/20 hover:scale-105 transition-all duration-300 font-rajdhani"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Data Clyffy
            </Button>
          </div>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold neon-text-slime font-orbitron animate-neon-pulse mb-2 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 animate-spin" />
              Create Content
              <Sparkles className="w-8 h-8 animate-spin" />
            </h1>
            <p className="text-gray-300 mt-2 font-rajdhani text-xl">
              Choose what type of content you want to create
            </p>
            <div className="text-sm text-gray-400 mt-2 glass-rich p-2 rounded-lg inline-block">
              Role: <span className="text-neon-purple font-semibold">{permissions.role}</span>
            </div>
          </div>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </motion.div>

      {/* Content Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-6"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-orbitron font-bold neon-text-cyan mb-6 text-center">
            Select Content Type
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {availableContentTypes.map((contentType, index) => {
              const IconComponent = getIconComponent(contentType.icon);

              return (
                <motion.div
                  key={contentType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="rich-entrance-animation"
                >
                  <ClyffyPermissionGuard
                    requiredOperation={contentType.permission as any}
                    showToast={false}
                    fallbackComponent={
                      <Card className="database-card glass-rich opacity-50 cursor-not-allowed border border-gray-600/30 h-64">
                        <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                          <IconComponent className="w-16 h-16 text-gray-500 mb-4" />
                          <h3 className="text-xl font-orbitron font-bold text-gray-500 mb-2">
                            {contentType.name}
                          </h3>
                          <p className="text-gray-500 font-rajdhani">Permission Required</p>
                        </CardContent>
                      </Card>
                    }
                  >
                    <ClyffyTooltip
                      id={`content.${contentType.id}`}
                      customConfig={{
                        title: contentType.name,
                        description: contentType.description,
                        icon: <IconComponent className="w-4 h-4" />,
                      }}
                    >
                      <Card
                        className={`database-card glass-rich rich-interactive-element group cursor-pointer border-${contentType.color}/30 hover:border-${contentType.color}/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-${contentType.color}/20 h-64`}
                        onClick={() => handleContentTypeSelect(contentType.id)}
                      >
                        <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                          <div
                            className={`w-20 h-20 rounded-2xl glass-rich border border-${contentType.color}/50 flex items-center justify-center backdrop-blur-sm group-hover:border-${contentType.color}/80 transition-colors group-hover:shadow-lg bg-gradient-to-br from-${contentType.color}/20 to-${contentType.color}/10 mb-6`}
                          >
                            <IconComponent
                              className={`w-10 h-10 text-${contentType.color} animate-neon-pulse group-hover:scale-110 transition-transform`}
                            />
                          </div>

                          <h3
                            className={`text-2xl font-orbitron font-bold text-${contentType.color} group-hover:animate-neon-pulse mb-3`}
                          >
                            {contentType.name}
                          </h3>

                          <p className="text-gray-300 font-rajdhani text-lg leading-relaxed">
                            {contentType.description}
                          </p>

                          {contentType.subtypes && (
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                              {contentType.subtypes.slice(0, 3).map((subtype) => (
                                <span
                                  key={subtype}
                                  className={`px-2 py-1 text-xs rounded glass-rich border border-${contentType.color}/30 text-${contentType.color} font-rajdhani`}
                                >
                                  {subtype.replace('_', ' ')}
                                </span>
                              ))}
                              {contentType.subtypes.length > 3 && (
                                <span
                                  className={`px-2 py-1 text-xs rounded glass-rich border border-${contentType.color}/30 text-${contentType.color} font-rajdhani`}
                                >
                                  +{contentType.subtypes.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </ClyffyTooltip>
                  </ClyffyPermissionGuard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-6"
      >
        <div className="max-w-4xl mx-auto">
          <Card className="glass-rich border-neon-slime/30">
            <CardHeader>
              <CardTitle className="text-center neon-text-slime font-orbitron flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                Need Help Choosing?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h4 className="text-lg font-orbitron neon-text-cyan mb-2">Database Items</h4>
                  <p className="text-gray-300 font-rajdhani">
                    Choose this for structured data like 3D printer parts, builds, or manufacturers.
                    Includes validation, categories, and relationships.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-orbitron neon-text-purple mb-2">CMS Content</h4>
                  <p className="text-gray-300 font-rajdhani">
                    Choose this for rich content like blog posts, documentation, or landing pages.
                    Includes visual editor and Data Clyffy item linking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};
