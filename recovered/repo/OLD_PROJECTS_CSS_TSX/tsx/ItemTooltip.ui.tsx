// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/web/features/DataExplorer/components/ItemTooltip/ItemTooltip.ui.tsx
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Star, Eye, Heart, DollarSign, Tag, Calendar } from 'lucide-react';
import type { UIItem } from '../../types/DataExplorer.contracts';

interface ItemTooltipProps {
  item: UIItem;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({
  item,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 320,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updateTooltipPosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updateTooltipPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 12;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 12;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 12;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 12;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Keep tooltip within viewport
    if (x < 8) x = 8;
    if (x + tooltipRect.width > viewport.width - 8) {
      x = viewport.width - tooltipRect.width - 8;
    }
    if (y < 8) y = 8;
    if (y + tooltipRect.height > viewport.height - 8) {
      y = viewport.height - tooltipRect.height - 8;
    }

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updateTooltipPosition();
      const handleResize = () => updateTooltipPosition();
      const handleScroll = () => updateTooltipPosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isVisible, position]);

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="tooltip-positioned"
            style={{
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              zIndex: 1000,
              maxWidth: maxWidth,
              pointerEvents: 'none',
            }}
          >
            <div className="mi-pt-tooltip" data-visibility={item.visibility}>
              {/* Header */}
              <div className="mi-pt-tooltip__header">
                <div className="mi-pt-tooltip__title">
                  <h3 className="mi-pt-tooltip__name">{item.name}</h3>
                  <div className="mi-pt-tooltip__type">
                    {item.item_type_slug.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
                {item.featured && (
                  <div className="mi-pt-tooltip__featured">
                    <Star className="w-4 h-4" fill="currentColor" />
                    <span>Featured</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              {item.summary && (
                <div className="mi-pt-tooltip__summary">
                  <p>{item.summary}</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="mi-pt-tooltip__stats">
                <div className="mi-pt-tooltip__stat">
                  <Eye className="w-3 h-3" />
                  <span>{item.view_count || 0} views</span>
                </div>
                <div className="mi-pt-tooltip__stat">
                  <Heart className="w-3 h-3" />
                  <span>{item.like_count || 0} likes</span>
                </div>
                <div className="mi-pt-tooltip__stat">
                  <Star className="w-3 h-3" />
                  <span>{item.trending_score || 0} trending</span>
                </div>
                {item.avg_cost_usd && (
                  <div className="mi-pt-tooltip__stat">
                    <DollarSign className="w-3 h-3" />
                    <span>{formatPrice(item.avg_cost_usd)}</span>
                  </div>
                )}
              </div>

              {/* Attributes Preview */}
              {item.attributes && Object.keys(item.attributes).length > 0 && (
                <div className="mi-pt-tooltip__attributes">
                  <div className="mi-pt-tooltip__attributes-header">
                    <Tag className="w-3 h-3" />
                    <span>Key Specs</span>
                  </div>
                  <div className="mi-pt-tooltip__attributes-list">
                    {Object.entries(item.attributes)
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key} className="mi-pt-tooltip__attribute">
                          <span className="mi-pt-tooltip__attribute-key">{key}</span>
                          <span className="mi-pt-tooltip__attribute-value">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mi-pt-tooltip__footer">
                <div className="mi-pt-tooltip__date">
                  <Calendar className="w-3 h-3" />
                  <span>Added {formatDate(item.created_at)}</span>
                </div>
                <div className="mi-pt-tooltip__visibility">
                  <span className="mi-pt-tooltip__badge">{item.visibility}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
