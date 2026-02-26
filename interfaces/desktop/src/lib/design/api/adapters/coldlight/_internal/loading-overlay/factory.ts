/**
 * @file builders/loading-overlay/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight LoadingOverlay builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Full-screen or container-scoped loading indicator with live region
 * semantics so assistive technology announces loading state changes.
 *
 * Slots: root, spinner, label.
 *
 * WAI-ARIA:
 * - root: `role="alert"`, `aria-busy` toggles with visibility.
 * - spinner: `aria-hidden="true"` (decorative animation).
 * - label: visible loading text.
 *
 * Data attributes:
 * - `data-cl-loading-overlay-root`
 * - `data-cl-loading-overlay-spinner`
 * - `data-cl-loading-overlay-label`
 * - `data-state="visible" | "hidden"` on root.
 */

import { Synced } from "../../../../../builders/_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../../../../../builders/_internal/index.js";
import type { LoadingOverlayProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("loading-overlay", [
	"root",
	"spinner",
	"label",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight LoadingOverlay builder.
 *
 * Provides `root`, `spinner`, and `label` slot getters for a loading overlay
 * with live-region ARIA semantics.
 *
 * @example
 * ```ts
 * const overlay = createLoadingOverlay({ visible: true });
 * overlay.show();  // programmatic show
 * overlay.hide();  // programmatic hide
 * // Spread overlay.root, overlay.spinner, overlay.label onto elements.
 * ```
 */
export class LoadingOverlay {
	// ==========================================================================
	// Instance IDs
	// ==========================================================================

	/**
	 * Unique element IDs for every slot in this builder instance.
	 *
	 * @remarks Generated once at construction via `metadata.createIds()`.
	 */
	readonly ids: {
		readonly root: string;
		readonly spinner: string;
		readonly label: string;
	} = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#visible: Synced<boolean>;
	#props: LoadingOverlayProps;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new LoadingOverlay builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: LoadingOverlayProps = {}) {
		this.#props = props;

		this.#visible = new Synced<boolean>({
			value: props.visible,
			onChange: props.onVisibleChange,
			defaultValue: false,
		});
	}

	// ==========================================================================
	// Reactive state
	// ==========================================================================

	/** Whether the loading overlay is currently visible. */
	get visible(): boolean {
		return this.#visible.current;
	}

	// ==========================================================================
	// Public methods
	// ==========================================================================

	/** Show the loading overlay. Sets `visible` to `true`. */
	show(): void {
		this.#visible.current = true;
	}

	/** Hide the loading overlay. Sets `visible` to `false`. */
	hide(): void {
		this.#visible.current = false;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the overlay wrapper `<div>`.
	 * Provides `role="alert"`, `aria-busy`, `aria-label`, `data-state`,
	 * and the `data-cl-loading-overlay-root` data attribute.
	 * When hidden, the `hidden` HTML attribute is applied.
	 */
	get root() {
		const ariaLabel = extract(this.#props["aria-label"], "Loading");
		const isVisible = this.visible;

		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "alert" as const,
			"aria-busy": isVisible ? ("true" as const) : ("false" as const),
			"aria-label": ariaLabel,
			"data-state": isVisible ? ("visible" as const) : ("hidden" as const),
			hidden: isVisible ? undefined : true,
		};
	}

	/**
	 * Spinner slot attributes.
	 *
	 * Spread onto the spinner/animation element.
	 * Hidden from assistive technology via `aria-hidden="true"`.
	 */
	get spinner() {
		return {
			[metadata.dataAttrs.spinner]: "" as const,
			id: this.ids.spinner,
			"aria-hidden": "true" as const,
		};
	}

	/**
	 * Label slot attributes.
	 *
	 * Spread onto the visible loading text element (e.g. `<span>`).
	 */
	get label() {
		return {
			[metadata.dataAttrs.label]: "" as const,
			id: this.ids.label,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link LoadingOverlay} builder instance.
 *
 * Factory function -- preferred API over direct `new LoadingOverlay()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised LoadingOverlay builder.
 */
export function createLoadingOverlay(props?: LoadingOverlayProps): LoadingOverlay {
	return new LoadingOverlay(props);
}
