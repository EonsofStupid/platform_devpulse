/**
 * Element Parser
 * Extracts structured info from DOM elements for inspection
 */

export interface ParsedElement {
  tagName: string;
  id: string | null;
  classList: string[];
  computedStyles: Record<string, string>;
  sourceFile: string | null;
  lineNumbers: { start: number; end: number } | null;
  cssChain: string[];
  outerHTML: string;
}

/**
 * Parse an HTMLElement into structured info
 */
export function parseElement(el: HTMLElement): ParsedElement {
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
    border: computed.border,
  };
  
  // Try to get source file from data attributes or component name
  let sourceFile: string | null = null;
  let lineNumbers: { start: number; end: number } | null = null;
  
  // Check for Svelte component __svelte_component__ or similar
  // Note: This is a best-effort heuristic
  const svelteDataAttr = el.getAttribute('data-svelte-h');
  if (svelteDataAttr) {
    sourceFile = `Component (${svelteDataAttr})`;
  }
  
  // Try to find CSS files in the chain by checking stylesheets
  const cssChain = getCSSChain(el);
  
  return {
    tagName: el.tagName.toLowerCase(),
    id: el.id || null,
    classList: Array.from(el.classList),
    computedStyles,
    sourceFile,
    lineNumbers,
    cssChain,
    outerHTML: el.outerHTML.slice(0, 500), // Truncate
  };
}

/**
 * Get CSS files that affect this element
 */
function getCSSChain(el: HTMLElement): string[] {
  const chain: string[] = [];
  const classList = Array.from(el.classList);
  
  // Check all stylesheets
  for (const sheet of document.styleSheets) {
    try {
      const href = sheet.href;
      if (!href) continue;
      
      // Extract filename from href
      const filename = href.split('/').pop() || href;
      
      // Check if any rules in this sheet match our element's classes
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          const selector = rule.selectorText;
          
          // Check if selector matches any of our classes
          for (const cls of classList) {
            if (selector.includes(`.${cls}`)) {
              if (!chain.includes(filename)) {
                chain.push(filename);
              }
              break;
            }
          }
        }
      }
    } catch {
      // CORS error accessing external stylesheets - skip
      continue;
    }
  }
  
  return chain;
}

/**
 * Format element info for clipboard (AI context format)
 */
export function formatForAI(info: ParsedElement): string {
  const lines: string[] = [];
  
  lines.push(`## Element: ${info.tagName}`);
  
  if (info.sourceFile) {
    lines.push(`**File**: \`${info.sourceFile}\``);
  }
  
  if (info.lineNumbers) {
    lines.push(`**Lines**: ${info.lineNumbers.start}-${info.lineNumbers.end}`);
  }
  
  if (info.id) {
    lines.push(`**ID**: \`${info.id}\``);
  }
  
  if (info.classList.length > 0) {
    lines.push(`**Classes**: \`${info.classList.join(' ')}\``);
  }
  
  if (info.cssChain.length > 0) {
    lines.push('');
    lines.push('### CSS Chain');
    for (const file of info.cssChain) {
      lines.push(`- \`${file}\``);
    }
  }
  
  lines.push('');
  lines.push('### Computed Styles');
  lines.push('```css');
  for (const [prop, value] of Object.entries(info.computedStyles)) {
    if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
      lines.push(`${prop}: ${value};`);
    }
  }
  lines.push('```');
  
  lines.push('');
  lines.push('### HTML');
  lines.push('```html');
  lines.push(info.outerHTML);
  lines.push('```');
  
  return lines.join('\n');
}
