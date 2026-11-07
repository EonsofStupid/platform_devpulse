// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/features/DataExplorer/components/DataExplorerCard/DataExplorerCard.ui.tsx
import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Eye, Heart, ExternalLink, Image as ImageIcon, BookOpen } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { ItemTooltip } from '../ItemTooltip';
import type { UIItem } from '../../types/DataExplorer.contracts';

interface DataExplorerCardProps {
  item: UIItem;
  onClick?: (item: UIItem) => void;
  showTooltip?: boolean;
  compact?: boolean;
  className?: string;
}

export const DataExplorerCard: React.FC<DataExplorerCardProps> = ({
  item,
  onClick,
  showTooltip = true,
  compact = false,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    onClick?.(item);
  };

  const handleViewInImpulseViewer = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate({
      to: '/impulse',
      search: { itemId: item.id, itemName: item.name },
    });
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return `$${price.toFixed(2)}`;
  };

  const getItemTypeColor = (itemType: string) => {
    const colors: Record<string, string> = {
      '3d-printers': 'var(--mi-cyan)',
      filaments: 'var(--mi-pink)',
      accessories: 'var(--mi-purple)',
      parts: 'var(--mi-lime)',
    };
    return colors[itemType] || 'var(--mi-text)';
  };

  const cardContent = (
    <motion.div
      className={`data-explorer-card ${compact ? 'compact' : ''} ${className}`}
      onClick={handleClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Image Section */}
      <div className="card-image-container">
        {item.image_url && !imageError ? (
          <img
            src={item.image_url}
            alt={item.name}
            className={`card-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="card-image-placeholder">
            <ImageIcon className="w-8 h-8" />
            <span>No Image</span>
          </div>
        )}

        {/* Badges */}
        <div className="card-badges">
          {item.featured && (
            <div className="badge featured">
              <Star className="w-3 h-3" fill="currentColor" />
              <span>Featured</span>
            </div>
          )}
          <div className={`badge type type-${item.item_type_slug.replace('-', '_')}`}>
            {item.item_type_slug.replace('-', ' ').toUpperCase()}
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="card-overlay">
          <div className="overlay-content">
            <ExternalLink className="w-5 h-5" />
            <span>View Details</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{item.name}</h3>
          {item.avg_cost_usd && <div className="card-price">{formatPrice(item.avg_cost_usd)}</div>}
        </div>

        {item.summary && !compact && <p className="card-summary">{item.summary}</p>}

        {/* Stats */}
        <div className="card-stats">
          <div className="stat">
            <Eye className="w-3 h-3" />
            <span>{item.view_count || 0}</span>
          </div>
          <div className="stat">
            <Heart className="w-3 h-3" />
            <span>{item.like_count || 0}</span>
          </div>
          <div className="stat">
            <Star className="w-3 h-3" />
            <span>{item.trending_score || 0}</span>
          </div>
        </div>

        {/* Key Attributes Preview */}
        {item.attributes && Object.keys(item.attributes).length > 0 && !compact && (
          <div className="card-attributes">
            {Object.entries(item.attributes)
              .slice(0, 2)
              .map(([key, value]) => (
                <div key={key} className="attribute">
                  <span className="attribute-key">{key}:</span>
                  <span className="attribute-value">{String(value)}</span>
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <div className="card-footer">
          <div className="card-date">
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="card-actions">
            <button
              onClick={handleViewInImpulseViewer}
              className="impulse-viewer-btn"
              title="View in ImpulseViewer"
            >
              <BookOpen className="w-3 h-3" />
              <span>View Guide</span>
            </button>
            <div className={`card-visibility ${item.visibility}`}>{item.visibility}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (showTooltip) {
    return (
      <ItemTooltip item={item} position="top" delay={200}>
        {cardContent}
      </ItemTooltip>
    );
  }

  return cardContent;
};
