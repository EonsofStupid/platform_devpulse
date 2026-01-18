/**
 * @fileoverview scan.svelte.ts
 * @file src/lib/sys/debug/vpb/state/scan.svelte.ts
 * @module @devpulse/sys/debug/vpb/state/scan.svelte
 * @layer lib
 *
 * @description
 * [TODO: Describe the purpose and responsibility of this module]
 *
 * @dependencies
 * - [TODO: List imports this file depends on]
 *
 * @consumers
 * - [TODO: List modules that import this file]
 *
 * @vpb-editable [TODO: List props VPB can modify, or 'none']
 * @since 1.0.0
 */

/**
 * Scan State Management
 * Runes-powered state for element scanning and inspection.
 */

export interface ElementInfo {
  /** Tag name (e.g., 'div', 'button') */
  tagName: string;
  /** Element ID if present */
  id: string | null;
  /** Class list */
  classList: string[];
  /** Computed CSS properties (subset) */
  computedStyles: Record<string, string>;
  /** Source file if available from source maps */
  sourceFile: string | null;
  /** Line numbers if available */
  lineNumbers: { start: number; end: number } | null;
  /** CSS files in the chain */
  cssChain: string[];
  /** Full outer HTML (truncated) */
  outerHTML: string;
}

class ScanManager {
  /** Currently hovered element */
  hoveredElement = $state<HTMLElement | null>(null);
  
  /** Currently selected (clicked) element */
  selectedElement = $state<HTMLElement | null>(null);
  
  /** Parsed info for selected element */
  elementInfo = $state<ElementInfo | null>(null);
  
  /** Whether inspector panel is open */
  inspectorOpen = $state(false);
  
  // ─────────────────────────────────────────────────────────────
  // Methods
  // ─────────────────────────────────────────────────────────────
  
  /** Set hovered element (for tooltip) */
  setHovered(el: HTMLElement | null): void {
    this.hoveredElement = el;
  }
  
  /** Select element (for inspection) */
  selectElement(el: HTMLElement): void {
    this.selectedElement = el;
    this.elementInfo = this.parseElement(el);
    this.inspectorOpen = true;
  }
  
  /** Close inspector */
  closeInspector(): void {
    this.inspectorOpen = false;
    this.selectedElement = null;
    this.elementInfo = null;
  }
  
  /** Parse element into structured info */
  private parseElement(el: HTMLElement): ElementInfo {
    const computed = getComputedStyle(el);
    
    // Extract key computed styles
    const computedStyles: Record<string, string> = {
      display: computed.display,
      position: computed.position,
      width: computed.width,
      height: computed.height,
      padding: computed.padding,
      margin: computed.margin,
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderRadius: computed.borderRadius,
    };
    
    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      classList: Array.from(el.classList),
      computedStyles,
      sourceFile: null, // Will be populated by source map lookup
      lineNumbers: null,
      cssChain: [], // Will be populated by CSS analysis
      outerHTML: el.outerHTML.slice(0, 500), // Truncate
    };
  }
  
  /** Reset all scan state */
  reset(): void {
    this.hoveredElement = null;
    this.selectedElement = null;
    this.elementInfo = null;
    this.inspectorOpen = false;
  }
}

export const scan = new ScanManager();
