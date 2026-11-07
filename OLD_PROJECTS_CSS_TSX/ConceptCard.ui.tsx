/**
 * @fileoverview Visual Concept Card - Teaching UI Component
 *
 * Displays glossary terms as interactive cards with icon, definition, and real-world context.
 * Teaches non-coders while they explore the UI.
 */

import { useState } from 'react';
import type { GlossaryTerm } from '@makers/devpulse-glossary/types';
import { useGlossaryStore } from '../../stores/glossaryStore';

interface ConceptCardProps {
  term: GlossaryTerm;
  /**
   * Size variant
   * - compact: Small card for sidebars/lists
   * - default: Standard card for grid layouts
   * - expanded: Full card with all details
   */
  variant?: 'compact' | 'default' | 'expanded';
  /**
   * Click handler - e.g., open modal with full details
   */
  onClick?: (termId: string) => void;
}

export function ConceptCard({
  term,
  variant = 'default',
  onClick,
}: ConceptCardProps) {
  const { mode, showRealWorld } = useGlossaryStore();
  const [isHovered, setIsHovered] = useState(false);

  const definition =
    mode === 'layman' ? term.definition.layman : term.definition.technical;

  const isCompact = variant === 'compact';
  const isExpanded = variant === 'expanded';

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border transition-all duration-200
        ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-md'}
        ${onClick ? 'cursor-pointer' : ''}
        bg-white dark:bg-gray-800
        border-gray-200 dark:border-gray-700
        ${isCompact ? 'p-3' : isExpanded ? 'p-6' : 'p-4'}
      `}
      style={{
        borderTopColor: term.ui.color,
        borderTopWidth: '3px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(term.id)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <span
          className={`flex-shrink-0 ${
            isCompact ? 'text-2xl' : isExpanded ? 'text-4xl' : 'text-3xl'
          }`}
        >
          {term.ui.icon}
        </span>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-gray-900 dark:text-gray-100 ${
              isCompact ? 'text-sm' : isExpanded ? 'text-xl' : 'text-lg'
            }`}
          >
            {term.name}
            {term.fullName && !isCompact && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-normal">
                ({term.fullName})
              </span>
            )}
          </h3>

          {/* Category Badge */}
          {!isCompact && (
            <span
              className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${term.ui.color}20`,
                color: term.ui.color,
              }}
            >
              {term.category}
            </span>
          )}
        </div>
      </div>

      {/* Definition */}
      <p
        className={`text-gray-700 dark:text-gray-300 ${
          isCompact ? 'text-xs line-clamp-2' : 'text-sm'
        }`}
      >
        {definition}
      </p>

      {/* Analogy (Layman mode only) */}
      {mode === 'layman' && !isCompact && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
          💡 {term.definition.analogy}
        </p>
      )}

      {/* Why It Matters */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Why it matters:
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {term.why.benefit}
          </p>

          {mode === 'technical' && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              ⚠️ Without it: {term.why.withoutIt}
            </p>
          )}
        </div>
      )}

      {/* Real-World Examples */}
      {(isExpanded || (showRealWorld && !isCompact)) && term.realWorld && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Real-world examples:
          </p>
          <div className="flex flex-wrap gap-1">
            {term.realWorld.examples.slice(0, isExpanded ? 10 : 3).map((example, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                {example}
              </span>
            ))}
          </div>

          {isExpanded && term.realWorld.standard && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <span>✅</span>
              <span>
                Industry standard - {term.realWorld.adoption}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Learn More Link */}
      {isExpanded && (
        <a
          href={term.ui.learnMoreUrl}
          className="block mt-4 text-sm font-medium hover:underline"
          style={{ color: term.ui.color }}
          onClick={(e) => e.stopPropagation()}
        >
          Learn more →
        </a>
      )}

      {/* Hover Effect Indicator */}
      {onClick && !isCompact && (
        <div
          className={`absolute top-2 right-2 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Grid layout for concept cards
 */
interface ConceptCardGridProps {
  terms: GlossaryTerm[];
  onCardClick?: (termId: string) => void;
  variant?: 'compact' | 'default' | 'expanded';
}

export function ConceptCardGrid({
  terms,
  onCardClick,
  variant = 'default',
}: ConceptCardGridProps) {
  return (
    <div
      className={`grid gap-4 ${
        variant === 'compact'
          ? 'grid-cols-1'
          : variant === 'expanded'
          ? 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {terms.map((term) => (
        <ConceptCard
          key={term.id}
          term={term}
          variant={variant}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
