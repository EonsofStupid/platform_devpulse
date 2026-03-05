/**
 * @file builders/sidebar/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Sidebar builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Side navigation panel with expand/collapse:
 * - Root: `<aside>` role="navigation", aria-label
 * - Trigger: aria-expanded toggle
 * - Header, Content, Footer: structural sub-slots
 * - Section: named group within content
 * - Item: individual navigation entry
 *
 * Contract states: expanded, collapsed.
 */

import { Synced } from "../../builders/synced.svelte.js";
import { createBuilderMetadata } from "../../builders/index.js";
import type { SidebarProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata(
	"sidebar",
	["root", "trigger", "header", "content", "footer"] as const,
);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Sidebar builder.
 *
 * Provides ARIA-compliant attribute objects for a collapsible sidebar
 * navigation panel. Manages expanded/collapsed state with full
 * `aria-expanded` semantics on the trigger.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createSidebar } from '$lib/design/builders/sidebar';
 *   const sidebar = createSidebar({ label: 'Main navigation' });
 * </script>
 *
 * <aside {...sidebar.root}>
 *   <button {...sidebar.trigger}>Toggle</button>
 *   <div {...sidebar.header}>Header</div>
 *   <nav {...sidebar.content}>
 *     <div {...sidebar.getSection('files')}>
 *       <a {...sidebar.getItem('home')}>Home</a>
 *     </div>
 *   </nav>
 *   <div {...sidebar.footer}>Footer</div>
 * </aside>
 * ```
 */
export class Sidebar {
	/** Unique IDs for each slot of this instance. */
	readonly ids: Record<
		"root" | "trigger" | "header" | "content" | "footer",
		string
	> = metadata.createIds();

	#expanded: Synced<boolean>;
	#label: Synced<string | undefined>;

	/**
	 * Create a new Sidebar builder instance.
	 *
	 * @param props - Configuration options for the sidebar.
	 */
	constructor(props: SidebarProps = {}) {
		this.#expanded = new Synced<boolean>({
			value: props.expanded,
			onChange: props.onExpandedChange,
			defaultValue: true,
		});

		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** Whether the sidebar is currently expanded. */
	get expanded(): boolean {
		return this.#expanded.current;
	}

	/** Set the expanded state directly. */
	set expanded(value: boolean) {
		this.#expanded.current = value;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/**
	 * Root container attributes.
	 *
	 * Spread onto the `<aside>` element. Provides navigation landmark role,
	 * accessible label, and data-state for CSS hooks.
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "navigation" as const,
			"aria-label": this.#label.current,
			"data-state": this.expanded
				? ("expanded" as const)
				: ("collapsed" as const),
		};
	}

	/**
	 * Trigger button attributes.
	 *
	 * Spread onto the expand/collapse toggle button. Includes `aria-expanded`,
	 * `aria-controls`, data-state, and an onclick handler that toggles state.
	 */
	get trigger() {
		return {
			[metadata.dataAttrs.trigger]: "" as const,
			id: this.ids.trigger,
			"aria-expanded": this.expanded,
			"aria-controls": this.ids.root,
			"data-state": this.expanded
				? ("expanded" as const)
				: ("collapsed" as const),

			onclick: () => {
				this.#expanded.current = !this.expanded;
			},
		};
	}

	/**
	 * Header slot attributes.
	 *
	 * Spread onto the sidebar header region. Tracks expanded/collapsed state
	 * via data-state for CSS transitions.
	 */
	get header() {
		return {
			[metadata.dataAttrs.header]: "" as const,
			id: this.ids.header,
			"data-state": this.expanded
				? ("expanded" as const)
				: ("collapsed" as const),
		};
	}

	/**
	 * Content slot attributes.
	 *
	 * Spread onto the main content/navigation area of the sidebar. Tracks
	 * expanded/collapsed state via data-state for CSS transitions.
	 */
	get content() {
		return {
			[metadata.dataAttrs.content]: "" as const,
			id: this.ids.content,
			"data-state": this.expanded
				? ("expanded" as const)
				: ("collapsed" as const),
		};
	}

	/**
	 * Footer slot attributes.
	 *
	 * Spread onto the sidebar footer region. Tracks expanded/collapsed state
	 * via data-state for CSS transitions.
	 */
	get footer() {
		return {
			[metadata.dataAttrs.footer]: "" as const,
			id: this.ids.footer,
			"data-state": this.expanded
				? ("expanded" as const)
				: ("collapsed" as const),
		};
	}

	// ========================================================================
	// Helper methods
	// ========================================================================

	/**
	 * Get attributes for a named section group within the sidebar content.
	 *
	 * Use this to group related navigation items under a heading.
	 *
	 * @param sectionId - A unique identifier for this section.
	 * @returns Exact-typed attribute object for the section wrapper.
	 */
	getSection(sectionId: string) {
		return {
			"data-cl-sidebar-section": "" as const,
			"data-section-id": sectionId,
			role: "group" as const,
		};
	}

	/**
	 * Get attributes for an individual navigation item within the sidebar.
	 *
	 * @param itemId - A unique identifier for this navigation item.
	 * @returns Exact-typed attribute object for the item element.
	 */
	getItem(itemId: string) {
		return {
			"data-cl-sidebar-item": "" as const,
			"data-item-id": itemId,
		};
	}

	// ========================================================================
	// Actions
	// ========================================================================

	/** Expand the sidebar. Sets expanded state to true. */
	open(): void {
		this.#expanded.current = true;
	}

	/** Collapse the sidebar. Sets expanded state to false. */
	close(): void {
		this.#expanded.current = false;
	}

	/** Toggle expanded/collapsed state. */
	toggle(): void {
		this.#expanded.current = !this.expanded;
	}

	/**
	 * Expand the sidebar.
	 * @deprecated Use `open()` instead for consistency with other builders.
	 */
	expand(): void {
		this.#expanded.current = true;
	}

	/**
	 * Collapse the sidebar.
	 * @deprecated Use `close()` instead for consistency with other builders.
	 */
	collapse(): void {
		this.#expanded.current = false;
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for the Sidebar builder — preferred API.
 *
 * @param props - Optional configuration for the sidebar.
 * @returns A new Sidebar builder instance.
 */
export function createSidebar(props?: SidebarProps): Sidebar {
	return new Sidebar(props);
}
