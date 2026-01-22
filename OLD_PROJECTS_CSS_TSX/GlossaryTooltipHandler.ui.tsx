/**
 * @fileoverview Glossary Tooltip Handler - Global handler for data-term attributes
 * @module devpulse-ui/components/GlossaryTooltipHandler
 * 
 * Attaches glossary tooltips to all elements with data-term attributes.
 */

import { useEffect } from 'react';
import { useGlossary } from '../contexts/GlossaryContext';
import type { TermId } from '@makers/devpulse-glossary/types';

export function GlossaryTooltipHandler() {
  const { getTerm } = useGlossary();

  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const termAttr = target.getAttribute('data-term');
      if (!termAttr) return;

      const termData = getTerm(termAttr as TermId);
      if (!termData) return;

      // Create tooltip element
      const tooltip = document.createElement('div');
      tooltip.className = 'dp-glossary-tooltip';
      tooltip.innerHTML = `
        <div class="dp-glossary-tooltip-header">
          <strong>${termData.name}</strong>
          <span class="dp-glossary-tooltip-category">${termData.category}</span>
        </div>
        <div class="dp-glossary-tooltip-content">${termData.definition.layman}</div>
        ${termData.children && termData.children.length > 0 ? `
          <div class="dp-glossary-tooltip-related">
            <strong>Related:</strong> ${termData.children.join(', ')}
          </div>
        ` : ''}
      `;

      document.body.appendChild(tooltip);

      // Position tooltip
      const rect = target.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 10}px`;
      tooltip.style.transform = 'translateX(-50%) translateY(-100%)';

      // Store reference for cleanup
      (target as HTMLElement & { __glossaryTooltip?: HTMLElement }).__glossaryTooltip = tooltip;
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement & { __glossaryTooltip?: HTMLElement };
      const tooltip = target.__glossaryTooltip;
      if (tooltip) {
        tooltip.remove();
        delete target.__glossaryTooltip;
      }
    };

    // Use event delegation with delay
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const termAttr = target.closest('[data-term]')?.getAttribute('data-term');
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (termAttr) {
        timeoutId = setTimeout(() => {
          handleMouseEnter(e);
        }, 600);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      handleMouseLeave(e);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Clean up any remaining tooltips
      document.querySelectorAll('.dp-glossary-tooltip').forEach(t => t.remove());
    };
  }, [getTerm]);

  return null;
}

