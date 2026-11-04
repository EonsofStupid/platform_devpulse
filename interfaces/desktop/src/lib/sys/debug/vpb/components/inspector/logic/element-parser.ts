/**
 * @fileoverview element-parser.ts
 * @file src/lib/sys/debug/vpb/scan/element-parser.ts
 * @module @devpulse/sys/debug/vpb/scan/element-parser
 * @layer lib
 *
 * @description
 * Element Parser.
 * Extracts structured info from DOM elements for inspection.
 *
 * @dependencies
 * - none (DOM only)
 *
 * @consumers
 * - components/inspector/state.svelte.ts
 * - components/inspector/VpbInspector.svelte
 *
 * @since 1.0.0
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

/** Where Svelte 5 says an element came from; development builds only. */
interface SvelteLocation {
	file: string;
	line: number;
}

function svelteLocation(el: Element): SvelteLocation | null {
	if (!("__svelte_meta" in el)) return null;
	const meta = el.__svelte_meta;
	if (typeof meta !== "object" || meta === null || !("loc" in meta)) return null;
	const loc = meta.loc;
	if (typeof loc !== "object" || loc === null) return null;
	if (!("file" in loc) || typeof loc.file !== "string") return null;
	if (!("line" in loc) || typeof loc.line !== "number") return null;
	return { file: loc.file, line: loc.line };
}

/**
 * Parse an element into structured info. Hovering asks for no CSS chain: it
 * walks every stylesheet, which is for a selection, not every mouse move.
 */
export function parseElement(
	el: Element,
	options: { cssChain: boolean } = { cssChain: true },
): ParsedElement {
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

	// The source file, where the running build says it. A release build does not.
	const location = svelteLocation(el);

	// Try to find CSS files in the chain by checking stylesheets
	const cssChain = options.cssChain ? getCSSChain(el) : [];

	return {
		tagName: el.tagName.toLowerCase(),
		id: el.id || null,
		classList: Array.from(el.classList),
		computedStyles,
		sourceFile: location?.file ?? null,
		lineNumbers: location ? { start: location.line, end: location.line } : null,
		cssChain,
		outerHTML: el.outerHTML.slice(0, 500), // Truncate
	};
}

/** A stylesheet's file name: its link, or the file Vite injected it from. */
function sheetName(sheet: CSSStyleSheet): string | null {
	const source =
		sheet.href ??
		(sheet.ownerNode instanceof Element ? sheet.ownerNode.getAttribute("data-vite-dev-id") : null);
	return source ? source.split("/").pop() || source : null;
}

/** Whether any style rule, also inside `@layer` and `@media`, names one of these classes. */
function rulesNameAClass(rules: CSSRuleList, classList: readonly string[]): boolean {
	for (const rule of Array.from(rules)) {
		if (rule instanceof CSSStyleRule) {
			const selector = rule.selectorText;
			if (classList.some((cls) => selector.includes(`.${cls}`))) return true;
		}
		if (rule instanceof CSSGroupingRule && rulesNameAClass(rule.cssRules, classList)) return true;
	}
	return false;
}

/**
 * Get CSS files that affect this element
 */
function getCSSChain(el: Element): string[] {
	const chain: string[] = [];
	const classList = Array.from(el.classList);

	// Check all stylesheets
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			const filename = sheetName(sheet);
			if (!filename || chain.includes(filename)) continue;

			// Check if any rules in this sheet match our element's classes
			if (rulesNameAClass(sheet.cssRules, classList)) chain.push(filename);
		} catch {
			// CORS error accessing external stylesheets - skip
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
		lines.push(`**Classes**: \`${info.classList.join(" ")}\``);
	}

	if (info.cssChain.length > 0) {
		lines.push("");
		lines.push("### CSS Chain");
		for (const file of info.cssChain) {
			lines.push(`- \`${file}\``);
		}
	}

	lines.push("");
	lines.push("### Computed Styles");
	lines.push("```css");
	for (const [prop, value] of Object.entries(info.computedStyles)) {
		if (value && value !== "none" && value !== "auto" && value !== "normal") {
			lines.push(`${prop}: ${value};`);
		}
	}
	lines.push("```");

	lines.push("");
	lines.push("### HTML");
	lines.push("```html");
	lines.push(info.outerHTML);
	lines.push("```");

	return lines.join("\n");
}
