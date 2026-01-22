// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/DataMaestro/components/ItemGrid.ui.tsx
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Edit2,
  Eye,
  Filter,
  Grid3X3,
  Heart,
  List,
  Search,
  Share2,
  SortAsc,
  Star,
  Tag,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Item } from '@/types/data-maestro-types';

interface ItemGridProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onView: (item: Item) => void;
}

export const ItemGrid: React.FC<ItemGridProps> = ({ items, onEdit, onView }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusGlass = (status: string) => {
    switch (status) {
      case 'active':
        return 'glass-emerald';
      case 'draft':
        return 'glass-amber';
      case 'archived':
        return 'glass-rich';
      default:
        return 'glass-cyan';
    }
  };

  const getStatusNeon = (status: string) => {
    switch (status) {
      case 'active':
        return 'neon-text-green';
      case 'draft':
        return 'neon-text-slime';
      case 'archived':
        return 'neon-text-purple';
      default:
        return 'neon-text-cyan';
    }
  };

  const getContributionGlass = (type: string) => {
    switch (type) {
      case 'original':
        return 'glass-cyan';
      case 'remix':
        return 'glass-purple';
      case 'improvement':
        return 'glass-emerald';
      case 'documentation':
        return 'glass-amber';
      default:
        return 'glass-rich';
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="database-filter-panel"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 neon-text-cyan w-5 h-5" />
            <Input
              placeholder="Search items by name, description, or attributes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="database-search pl-12 font-rajdhani text-lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="database-search px-4 py-3 font-rajdhani"
              aria-label="Filter status"
              title="Filter status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="database-search px-4 py-3 font-rajdhani"
              aria-label="Sort items"
              title="Sort items"
            >
              <option value="updated">Recently Updated</option>
              <option value="name">Name A-Z</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>

            <div className="database-filter-panel p-1 flex rounded-xl">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="database-pagination-button"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="database-pagination-button"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Items Display */}
      {viewMode === 'grid' ? (
        <div className="database-grid">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`database-card group ${getStatusGlass(item.status)}`}
              >
                <div className="p-0 mb-4">
                  <div className="relative aspect-video glass-rich overflow-hidden rounded-lg border border-neon-slime/30">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center glass-rich">
                        <div className="w-16 h-16 rounded-full glass-cyan flex items-center justify-center">
                          <Zap className="w-8 h-8 neon-text-slime animate-neon-pulse" />
                        </div>
                      </div>
                    )}

                    {/* Status Overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <Badge
                        className={`${getContributionGlass(item.contributionType)} border border-neon-slime/50 text-white font-orbitron`}
                      >
                        {item.contributionType}
                      </Badge>
                      {item.featured && (
                        <div className="glass-amber p-2 rounded-full border border-neon-slime/50">
                          <Star className="w-4 h-4 neon-text-slime fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 glass-rich opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => onView(item)}
                        className="glass-rich border border-neon-cyan/50 neon-text-cyan hover:glass-cyan font-orbitron"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="glass-rich border border-neon-slime/50 neon-text-slime hover:glass-emerald font-orbitron"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold neon-text-slime font-orbitron group-hover:animate-neon-pulse transition-all">
                      {item.name}
                    </h3>
                    <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed font-rajdhani mt-2">
                      {item.summary || 'No description available'}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-sm font-rajdhani">
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 neon-text-cyan" />
                        <span className="neon-text-cyan">{item.viewCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 neon-text-purple" />
                        <span className="neon-text-purple">{item.likeCount || 0}</span>
                      </div>
                    </div>
                    <Badge
                      className={`database-filter-tag ${getStatusNeon(item.status)} font-orbitron`}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} className="database-filter-tag text-xs font-rajdhani">
                          {tag.name}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge className="database-filter-tag text-xs font-rajdhani">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-neon-slime/30">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-rajdhani">
                      <Clock className="w-3 h-3 neon-text-green" />
                      <span className="neon-text-green">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.itemType && (
                      <Badge className="database-filter-tag text-xs neon-text-cyan font-orbitron">
                        {item.itemType.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`database-card group ${getStatusGlass(item.status)}`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl glass-rich overflow-hidden flex-shrink-0 border border-neon-slime/30">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center glass-cyan">
                          <Zap className="w-8 h-8 neon-text-slime animate-neon-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold neon-text-slime font-orbitron group-hover:animate-neon-pulse transition-all">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {item.featured && (
                            <Star className="w-4 h-4 neon-text-slime fill-current" />
                          )}
                          <Badge
                            className={`${getContributionGlass(item.contributionType)} border border-neon-slime/50 text-white font-orbitron`}
                          >
                            {item.contributionType}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3 line-clamp-1 font-rajdhani">
                        {item.summary || 'No description available'}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-400 font-rajdhani">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 neon-text-cyan" />
                          <span className="neon-text-cyan">{item.viewCount || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 neon-text-purple" />
                          <span className="neon-text-purple">{item.likeCount || 0} likes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 neon-text-green" />
                          <span className="neon-text-green">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {item.itemType && (
                          <Badge className="database-filter-tag neon-text-cyan font-orbitron">
                            {item.itemType.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => onView(item)}
                        className="glass-rich border border-neon-cyan/50 neon-text-cyan hover:glass-cyan font-orbitron"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="glass-rich border border-neon-slime/50 neon-text-slime hover:glass-emerald font-orbitron"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="database-empty-state">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full glass-cyan flex items-center justify-center">
            <Search className="w-12 h-12 neon-text-cyan animate-neon-pulse" />
          </div>
          <h3 className="text-2xl font-bold neon-text-slime font-orbitron mb-2">No Items Found</h3>
          <p className="text-gray-400 max-w-md mx-auto font-rajdhani">
            Try adjusting your search criteria or create a new item to get started.
          </p>
        </div>
      )}
    </div>
  );
};
