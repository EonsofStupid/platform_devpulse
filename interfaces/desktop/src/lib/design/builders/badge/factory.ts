/**
 * @file builders/badge/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Badge builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * - Decorative: aria-hidden="true" (default)
 * - Informational: visible label via aria-label, role="status"
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { BadgeProps, BadgeVariant } from "./types.js";

const metadata = createBuilderMetadata("badge", ["root"] as const);

export class Badge {
	#decorative: Synced<boolean>;
	#label: Synced<string>;
	#variant: Synced<BadgeVariant>;

	/** Unique IDs for this instance. */
	readonly ids = metadata.createIds();

	constructor(props: BadgeProps = {}) {
		this.#decorative = new Synced<boolean>({
			value: props.decorative,
			defaultValue: true,
		});

		this.#label = new Synced<string>({
			value: props.label,
			defaultValue: "",
		});

		this.#variant = new Synced<BadgeVariant>({
			value: props.variant,
			defaultValue: "default",
		});
	}

	// --- Reactive state ---

	get decorative(): boolean {
		return this.#decorative.current;
	}

	get label(): string {
		return this.#label.current;
	}

	get variant(): BadgeVariant {
		return this.#variant.current;
	}

	// --- Element attribute getters ---

	/** Root element attributes. Spread onto the <span> element. */
	get root(): SlotAttrs {
		const isDecorative = this.decorative;
		const label = this.label;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			"data-variant": this.variant,
			...(isDecorative
				? { "aria-hidden": true }
				: {
						role: "status",
						...(label ? { "aria-label": label } : {}),
					}),
		};
	}
}

/** Factory function -- preferred API. */
export function createBadge(props?: BadgeProps): Badge {
	return new Badge(props);
}
