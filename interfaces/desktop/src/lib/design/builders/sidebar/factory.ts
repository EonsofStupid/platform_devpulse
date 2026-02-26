/**
 * @file builders/sidebar/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Sidebar builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Side navigation panel with expand/collapse:
 * - Root: <aside> role="navigation", aria-label
 * - Trigger: aria-expanded toggle
 * - Header, Content, Footer: structural sub-slots
 *
 * Contract states: expanded, collapsed.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { SidebarProps } from "./types.js";

const metadata = createBuilderMetadata(
	"sidebar",
	["root", "trigger", "header", "content", "footer"] as const,
);

export class Sidebar {
	readonly ids = metadata.createIds();
	#expanded: Synced<boolean>;
	#label: Synced<string | undefined>;

	constructor(props: SidebarProps = {} as SidebarProps) {
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

	// --- Reactive state ---

	get expanded(): boolean {
		return this.#expanded.current;
	}

	set expanded(value: boolean) {
		this.#expanded.current = value;
	}

	// --- Slot attribute getters ---

	/** Root container attributes. Spread onto the <aside> element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "navigation",
			"aria-label": this.#label.current,
			"data-state": this.expanded ? "expanded" : "collapsed",
		};
	}

	/** Trigger button attributes. Spread onto the expand/collapse toggle. */
	get trigger(): SlotAttrs {
		return {
			[metadata.dataAttrs.trigger]: "",
			id: this.ids.trigger,
			"aria-expanded": this.expanded,
			"aria-controls": this.ids.root,
			"data-state": this.expanded ? "expanded" : "collapsed",

			onclick: () => {
				this.#expanded.current = !this.expanded;
			},
		};
	}

	/** Header slot attributes. */
	get header(): SlotAttrs {
		return {
			[metadata.dataAttrs.header]: "",
			id: this.ids.header,
			"data-state": this.expanded ? "expanded" : "collapsed",
		};
	}

	/** Content slot attributes. */
	get content(): SlotAttrs {
		return {
			[metadata.dataAttrs.content]: "",
			id: this.ids.content,
			"data-state": this.expanded ? "expanded" : "collapsed",
		};
	}

	/** Footer slot attributes. */
	get footer(): SlotAttrs {
		return {
			[metadata.dataAttrs.footer]: "",
			id: this.ids.footer,
			"data-state": this.expanded ? "expanded" : "collapsed",
		};
	}

	// --- Actions ---

	/** Expand the sidebar. */
	expand(): void {
		this.#expanded.current = true;
	}

	/** Collapse the sidebar. */
	collapse(): void {
		this.#expanded.current = false;
	}

	/** Toggle expanded/collapsed. */
	toggle(): void {
		this.#expanded.current = !this.expanded;
	}
}

/** Factory function — preferred API. */
export function createSidebar(props?: SidebarProps): Sidebar {
	return new Sidebar(props);
}
