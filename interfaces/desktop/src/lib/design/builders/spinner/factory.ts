/**
 * @file builders/spinner/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Spinner builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="status", aria-label="Loading" (default).
 * aria-hidden="true" when not active.
 *
 * Slots: root (single slot).
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { SpinnerProps } from "./types.js";

const metadata = createBuilderMetadata("spinner", ["root"] as const);

export class Spinner {
	readonly ids = metadata.createIds();

	#active: Synced<boolean>;
	#props: SpinnerProps;

	constructor(props: SpinnerProps = {} as SpinnerProps) {
		this.#props = props;

		this.#active = new Synced<boolean>({
			value: props.active,
			onChange: props.onActiveChange,
			defaultValue: true,
		});
	}

	// --- Reactive state ---

	get active(): boolean {
		return this.#active.current;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLabel = extract(this.#props["aria-label"], "Loading");
		const isActive = this.active;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "status",
			"aria-label": isActive ? ariaLabel : undefined,
			"aria-hidden": isActive ? undefined : "true",
			"data-state": isActive ? "active" : "inactive",
		};
	}
}

/** Factory function — preferred API. */
export function createSpinner(props?: SpinnerProps): Spinner {
	return new Spinner(props);
}
