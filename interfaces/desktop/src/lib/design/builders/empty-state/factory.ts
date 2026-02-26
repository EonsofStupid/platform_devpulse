/**
 * @file builders/empty-state/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight EmptyState builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Root: role="status" (polite live region)
 * - Icon: role="presentation" (decorative)
 * - Title: heading for the empty state
 * - Description: explanatory text
 * - Action: container for CTA buttons
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { EmptyStateProps } from "./types.js";

const metadata = createBuilderMetadata("empty-state", ["root", "icon", "title", "description", "action"] as const);

export class EmptyState {
	#label: Synced<string>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: EmptyStateProps = {}) {
		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "",
		});
	}

	// --- Reactive state ---

	get label(): string {
		return this.#label.current;
	}

	// --- Element attribute getters ---

	/** Root container attributes. Spread onto the wrapper <div>. */
	get root(): SlotAttrs {
		const label = this.label;
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "status",
			...(label ? { "aria-label": label } : {}),
		};
	}

	/** Icon container attributes. Decorative, hidden from assistive tech. */
	get icon(): SlotAttrs {
		return {
			[metadata.dataAttrs.icon]: "",
			id: this.ids.icon,
			role: "presentation",
			"aria-hidden": true,
		};
	}

	/** Title attributes. Spread onto the heading element. */
	get title(): SlotAttrs {
		return {
			[metadata.dataAttrs.title]: "",
			id: this.ids.title,
		};
	}

	/** Description attributes. Spread onto the <p> element. */
	get description(): SlotAttrs {
		return {
			[metadata.dataAttrs.description]: "",
			id: this.ids.description,
		};
	}

	/** Action container attributes. Spread onto the CTA wrapper. */
	get action(): SlotAttrs {
		return {
			[metadata.dataAttrs.action]: "",
			id: this.ids.action,
		};
	}
}

/** Factory function -- preferred API. */
export function createEmptyState(props?: EmptyStateProps): EmptyState {
	return new EmptyState(props);
}
