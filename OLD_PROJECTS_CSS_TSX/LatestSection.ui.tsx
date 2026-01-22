// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/features/Landing/Mi3dpLatest/LatestSection.ui.tsx
import type React from 'react';
import { useEffect, useState } from 'react';
import { LatestCategoryFilter } from './LatestCategoryFilter.ui';
import { LatestContentCard } from './LatestContentCard.ui';
import { latestContentService } from './services/LatestContent/LatestContentService';
import type { LatestItem, LatestSectionProps } from './Mi3dpLatest.types';

export const LatestSection: React.FC<LatestSectionProps> = ({
  className = '',
  showHeader = true,
  categories = [],
}) => {
  const [latestItems, setLatestItems] = useState<LatestItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLatestContent();
    loadAvailableCategories();
  }, [selectedCategory]);

  const loadLatestContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Service returns an array; use correct arg order (limit, categorySlug)
      const items = await latestContentService.getLatestContent(12, selectedCategory || undefined);
      setLatestItems(items);
    } catch (err) {
      console.error('Error in loadLatestContent:', err);
      setError('Unable to load content at this time');
      setLatestItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableCategories = async () => {
    try {
      const categories = await latestContentService.getAvailableCategories();
      // Use slugs for category identifiers in the filter UI
      setAvailableCategories(categories.map((c) => c.slug));
    } catch (err) {
      console.error('Error loading categories:', err);
      // Don't break if categories fail to load
      setAvailableCategories([]);
    }
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  if (isLoading) {
    return (
      <div className={`py-20 px-6 latest-section ${className}`}>
        <div className="max-w-7xl mx-auto">
          {showHeader && (
            <div className="text-center mb-16 latest-header">
              <h2 className="font-orbitron font-bold text-4xl md:text-5xl mb-6 festive-sparkle">
                <span className="neon-headline-slime">Latest</span>
              </h2>
              <p className="font-rajdhani text-xl text-gray-400 max-w-2xl mx-auto">
                Fresh content from our vibrant 3D printing community
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass-rich p-6 rounded-2xl border-2 border-neon-slime/30 animate-pulse"
              >
                <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-20 px-6 latest-section ${className}`}>
      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <div className="text-center mb-16 latest-header">
            <h2 className="font-orbitron font-bold text-4xl md:text-5xl mb-6 festive-sparkle">
              <span className="neon-headline-slime">Latest</span>
            </h2>
            <p className="font-rajdhani text-xl text-gray-400 max-w-2xl mx-auto">
              Fresh content from our vibrant 3D printing community
            </p>
          </div>
        )}

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <LatestCategoryFilter
            categories={availableCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        )}

        {/* Error State - Graceful Degradation */}
        {error && (
          <div className="glass-rich p-8 rounded-2xl border-2 border-red-500/30 text-center mb-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-orbitron font-bold text-xl text-red-400 mb-2">
              Content Temporarily Unavailable
            </h3>
            <p className="font-rajdhani text-gray-300">{error}. Please try refreshing the page.</p>
            <button
              onClick={loadLatestContent}
              className="mt-4 px-6 py-2 bg-neon-slime/20 text-neon-slime border border-neon-slime/50 rounded-lg hover:bg-neon-slime/30 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Content Grid */}
        {!error && latestItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {latestItems.map((item) => (
              <LatestContentCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!error && !isLoading && latestItems.length === 0 && (
          <div className="glass-rich p-12 rounded-2xl border-2 border-neon-slime/30 text-center mt-8">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="font-orbitron font-bold text-2xl neon-text-slime mb-4">
              {selectedCategory ? `No ${selectedCategory} content yet` : 'No content available'}
            </h3>
            <p className="font-rajdhani text-gray-300 text-lg">
              {selectedCategory
                ? `Create some ${selectedCategory} content through the Data Maestro admin panel.`
                : 'Create content through the Data Maestro admin panel to see it here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
