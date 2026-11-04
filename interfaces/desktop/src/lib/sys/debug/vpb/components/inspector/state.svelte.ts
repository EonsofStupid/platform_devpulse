/**
 * @fileoverview scan.svelte.ts
 * @file src/lib/sys/debug/vpb/state/scan.svelte.ts
 * @module @devpulse/sys/debug/vpb/state/scan.svelte
 * @layer lib
 *
 * @description
 * Scan State Management.
 * Runes-powered state for element scanning and inspection. Elements parse
 * through `logic/element-parser.ts`; this file only holds what is hovered and
 * selected.
 *
 * @dependencies
 * - logic/element-parser.ts
 *
 * @consumers
 * - components/inspector/ScanOverlay.svelte, ScanTooltip.svelte, VpbInspector.svelte
 *
 * @since 1.0.0
 */

import { type ParsedElement, parseElement } from "./logic/element-parser.js";

class ScanManager {
	/** Currently hovered element */
	hoveredElement = $state<Element | null>(null);

	/** Currently selected (clicked) element */
	selectedElement = $state<Element | null>(null);

	/** Parsed info for selected element */
	elementInfo = $state<ParsedElement | null>(null);

	/** Position of the click that triggered selection */
	clickPosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });

	/** Whether inspector panel is open */
	inspectorOpen = $state(false);

	// ─────────────────────────────────────────────────────────────
	// Methods
	// ─────────────────────────────────────────────────────────────

	/** Set hovered element (for tooltip) */
	setHovered(el: Element | null): void {
		this.hoveredElement = el;
		if (el) {
			this.elementInfo = parseElement(el, { cssChain: false });
		} else if (!this.selectedElement) {
			// Only clear if not selected
			this.elementInfo = null;
		}
	}

	/** Select element (for inspection) */
	selectElement(el: Element): void {
		this.selectedElement = el;
		this.elementInfo = parseElement(el, { cssChain: false });
		this.inspectorOpen = true;
	}

	/** Close inspector */
	closeInspector(): void {
		this.inspectorOpen = false;
		this.selectedElement = null;
		this.elementInfo = null;
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
