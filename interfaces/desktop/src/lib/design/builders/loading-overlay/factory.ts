/**
 * @file builders/loading-overlay/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight LoadingOverlay builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * role="alert", aria-busy="true" when visible.
 * Synced<boolean> for visible state.
 *
 * Slots: root, spinner, label.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { LoadingOverlayProps } from "./types.js";

const metadata = createBuilderMetadata("loading-overlay", [
	"root",
	"spinner",
	"label",
] as const);

export class LoadingOverlay {
	readonly ids = metadata.createIds();

	#visible: Synced<boolean>;
	#props: LoadingOverlayProps;

	constructor(props: LoadingOverlayProps = {} as LoadingOverlayProps) {
		this.#props = props;

		this.#visible = new Synced<boolean>({
			value: props.visible,
			onChange: props.onVisibleChange,
			defaultValue: false,
		});
	}

	// --- Reactive state ---

	get visible(): boolean {
		return this.#visible.current;
	}

	/** Show the loading overlay. */
	show(): void {
		this.#visible.current = true;
	}

	/** Hide the loading overlay. */
	hide(): void {
		this.#visible.current = false;
	}

	// --- Slot attribute getters ---

	get root(): SlotAttrs {
		const ariaLabel = extract(this.#props["aria-label"], "Loading");
		const isVisible = this.visible;

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "alert",
			"aria-busy": isVisible ? "true" : "false",
			"aria-label": ariaLabel,
			"data-state": isVisible ? "visible" : "hidden",
			hidden: isVisible ? undefined : true,
		};
	}

	get spinner(): SlotAttrs {
		return {
			[metadata.dataAttrs.spinner]: "",
			id: this.ids.spinner,
			"aria-hidden": "true",
		};
	}

	get label(): SlotAttrs {
		return {
			[metadata.dataAttrs.label]: "",
			id: this.ids.label,
		};
	}
}

/** Factory function — preferred API. */
export function createLoadingOverlay(props?: LoadingOverlayProps): LoadingOverlay {
	return new LoadingOverlay(props);
}
