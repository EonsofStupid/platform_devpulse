/**
 * @file builders/banner/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Banner builder -- Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Page-level or section-level alert banner with optional dismiss action.
 * Visibility controlled via Synced<boolean>.
 *
 * Slots: root, icon, content, action.
 *
 * WAI-ARIA:
 * - root: `role="alert"` (implicit `aria-live="assertive"`), optional `aria-live` override.
 * - icon: `aria-hidden="true"` (decorative).
 * - content: banner message body.
 * - action: dismiss button container -- clicking calls `dismiss()`.
 *
 * Data attributes:
 * - `data-cl-banner-root`
 * - `data-cl-banner-icon`
 * - `data-cl-banner-content`
 * - `data-cl-banner-action`
 * - `data-state="visible" | "hidden"` on root.
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { BannerProps } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("banner", [
	"root",
	"icon",
	"content",
	"action",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight Banner builder.
 *
 * Provides `root`, `icon`, `content`, and `action` slot getters for a
 * page-level alert banner with dismissibility.
 *
 * @example
 * ```ts
 * const banner = createBanner({ visible: true, "aria-label": "System update" });
 * banner.dismiss(); // hide
 * banner.show();    // re-show
 * // Spread banner.root, banner.icon, banner.content, banner.action onto elements.
 * ```
 */
export class Banner {
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
		readonly icon: string;
		readonly content: string;
		readonly action: string;
	} = metadata.createIds();

	// ==========================================================================
	// Private state
	// ==========================================================================

	#visible: Synced<boolean>;
	#props: BannerProps;

	// ==========================================================================
	// Constructor
	// ==========================================================================

	/**
	 * Create a new Banner builder instance.
	 *
	 * @param props - Configuration options. All fields are optional.
	 */
	constructor(props: BannerProps = {}) {
		this.#props = props;

		this.#visible = new Synced<boolean>({
			value: props.visible,
			onChange: props.onVisibleChange,
			defaultValue: true,
		});
	}

	// ==========================================================================
	// Reactive state
	// ==========================================================================

	/** Whether the banner is currently visible. */
	get visible(): boolean {
		return this.#visible.current;
	}

	// ==========================================================================
	// Public methods
	// ==========================================================================

	/** Dismiss the banner. Sets `visible` to `false`. */
	dismiss(): void {
		this.#visible.current = false;
	}

	/** Show the banner. Sets `visible` to `true`. */
	show(): void {
		this.#visible.current = true;
	}

	// ==========================================================================
	// Slot attribute getters
	// ==========================================================================

	/**
	 * Root slot attributes.
	 *
	 * Spread onto the banner wrapper `<div>`.
	 * Provides `role="alert"`, optional `aria-label` and `aria-live`,
	 * `data-state`, and the `data-cl-banner-root` data attribute.
	 * When hidden, the `hidden` HTML attribute is applied.
	 */
	get root() {
		const ariaLabel = extract(this.#props["aria-label"], undefined);
		const ariaLive = extract(this.#props["aria-live"], undefined);

		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
			role: "alert" as const,
			"aria-label": ariaLabel,
			"aria-live": ariaLive,
			"data-state": this.visible ? ("visible" as const) : ("hidden" as const),
			hidden: this.visible ? undefined : true,
		};
	}

	/**
	 * Icon slot attributes.
	 *
	 * Spread onto the decorative icon container.
	 * Hidden from assistive technology via `aria-hidden="true"`.
	 */
	get icon() {
		return {
			[metadata.dataAttrs.icon]: "" as const,
			id: this.ids.icon,
			"aria-hidden": "true" as const,
		};
	}

	/**
	 * Content slot attributes.
	 *
	 * Spread onto the banner message body element.
	 */
	get content() {
		return {
			[metadata.dataAttrs.content]: "" as const,
			id: this.ids.content,
		};
	}

	/**
	 * Action slot attributes.
	 *
	 * Spread onto the dismiss button or action wrapper.
	 * Clicking calls {@link Banner.dismiss} to hide the banner.
	 */
	get action() {
		return {
			[metadata.dataAttrs.action]: "" as const,
			id: this.ids.action,
			onclick: () => {
				this.dismiss();
			},
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new {@link Banner} builder instance.
 *
 * Factory function -- preferred API over direct `new Banner()`.
 *
 * @param props - Configuration options.
 * @returns A fully initialised Banner builder.
 */
export function createBanner(props?: BannerProps): Banner {
	return new Banner(props);
}
