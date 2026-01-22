// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/components/ItemTypeGrid.ui.tsx
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Database,
  Edit2,
  Grid3X3,
  Layers,
  Plus,
  Search,
  Settings,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ItemType } from '@/types/data-maestro-types';

interface ItemTypeGridProps {
  itemTypes: ItemType[];
  onEdit: (itemType: ItemType) => void;
  onCreateNew: () => void;
}

export const ItemTypeGrid: React.FC<ItemTypeGridProps> = ({
  itemTypes,
  onEdit,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItemTypes = itemTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getItemTypeIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      database: Database,
      layers: Layers,
      grid: Grid3X3,
      zap: Zap,
      star: Star,
      chart: BarChart3,
      users: Users,
      calendar: Calendar,
      trending: TrendingUp,
    };

    const IconComponent = iconName ? iconMap[iconName] || Database : Database;
    return IconComponent;
  };

  const getTypeGlass = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'glass-cyan';
      case 'purple':
        return 'glass-purple';
      case 'green':
        return 'glass-emerald';
      case 'orange':
        return 'glass-amber';
      case 'yellow':
        return 'glass-amber';
      default:
        return 'glass-rich';
    }
  };

  const getTypeNeon = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'neon-text-cyan';
      case 'purple':
        return 'neon-text-purple';
      case 'green':
        return 'neon-text-green';
      case 'orange':
        return 'neon-text-slime';
      case 'yellow':
        return 'neon-text-green';
      default:
        return 'neon-text-slime';
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Explorer Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="database-header"
      >
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div>
            <h2 className="text-3xl font-bold neon-text-slime font-orbitron animate-neon-pulse">
              Item Types
            </h2>
            <p className="text-gray-300 mt-2 font-rajdhani text-lg">
              Define the structure and organization of your content
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 neon-text-cyan w-5 h-5" />
              <Input
                placeholder="Search item types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="database-search pl-12 font-rajdhani text-lg"
              />
            </div>
            <Button
              onClick={onCreateNew}
              className="bg-gradient-to-r from-neon-slime to-neon-cyan hover:from-neon-slime/80 hover:to-neon-cyan/80 text-black font-orbitron font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Type
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Item Types Database Grid */}
      {filteredItemTypes.length > 0 ? (
        <div className="database-grid">
          {filteredItemTypes.map((itemType, index) => {
            const IconComponent = getItemTypeIcon(itemType.iconName);
            const glassClass = getTypeGlass(itemType.color);
            const neonClass = getTypeNeon(itemType.color);

            return (
              <motion.div
                key={itemType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`database-card group ${glassClass}`}>
                  <div className="space-y-4">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl glass-rich border border-neon-slime/30 flex items-center justify-center backdrop-blur-sm">
                          <IconComponent className={`w-8 h-8 ${neonClass} animate-neon-pulse`} />
                        </div>
                        <div>
                          <h3
                            className={`text-xl font-bold ${neonClass} font-orbitron group-hover:animate-neon-pulse transition-all`}
                          >
                            {itemType.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {itemType.isPrimary && (
                              <Badge className="database-filter-tag neon-text-slime font-orbitron">
                                Primary
                              </Badge>
                            )}
                            <Badge
                              className={`database-filter-tag ${itemType.isActive ? 'neon-text-green' : 'neon-text-purple'} font-orbitron`}
                            >
                              {itemType.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(itemType)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity glass-rich border border-neon-cyan/50 neon-text-cyan hover:glass-cyan font-orbitron"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm leading-relaxed font-rajdhani">
                      {itemType.description || 'No description available'}
                    </p>

                    {/* Metadata Display */}
                    {itemType.metadata && Object.keys(itemType.metadata).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium neon-text-cyan font-orbitron">
                          Configuration
                        </h4>
                        <div className="database-stats-grid">
                          {Object.entries(itemType.metadata)
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <div key={key} className="database-stat-card">
                                <div className="text-gray-400 capitalize font-rajdhani text-xs">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="database-stat-value text-sm neon-text-slime font-orbitron">
                                  {String(value)}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-neon-slime/30">
                      <div className="text-xs neon-text-green font-rajdhani">
                        Order: {itemType.sortOrder}
                      </div>
                      <div className="text-xs neon-text-purple font-rajdhani">
                        {new Date(itemType.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => onEdit(itemType)}
                        className="flex-1 glass-rich border border-neon-slime/50 neon-text-slime hover:glass-emerald font-orbitron"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>

                  {/* Floating Action Indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full glass-cyan border border-cyan-400/50 flex items-center justify-center backdrop-blur-sm">
                      <Edit2 className="w-4 h-4 neon-text-cyan" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="database-empty-state">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full glass-cyan flex items-center justify-center border border-neon-cyan/50 backdrop-blur-sm">
            <Database className="w-12 h-12 neon-text-cyan animate-neon-pulse" />
          </div>
          <h3 className="text-2xl font-bold neon-text-slime font-orbitron mb-2">
            {searchTerm ? 'No Matching Item Types' : 'No Item Types Found'}
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6 font-rajdhani">
            {searchTerm
              ? 'Try adjusting your search criteria to find item types.'
              : 'Create your first item type to start building your data architecture.'}
          </p>
          {!searchTerm && (
            <Button
              onClick={onCreateNew}
              className="bg-gradient-to-r from-neon-slime to-neon-cyan hover:from-neon-slime/80 hover:to-neon-cyan/80 text-black font-orbitron font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Item Type
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
