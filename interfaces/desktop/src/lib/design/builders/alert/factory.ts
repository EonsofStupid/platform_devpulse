/**
 * @file builders/alert/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Alert builder — Svelte 5 runes-native.
 *
 * The Alert builder owns all ARIA semantics and data-attribute derivation
 * for the alert pattern. Components create an Alert instance and spread
 * the slot getters onto the respective elements: root, icon, title,
 * description, and action.
 *
 * ## ARIA Semantics
 *
 * - Root: `role="alert"` (provides implicit `aria-live="assertive"`)
 * - Icon: `aria-hidden="true"` (presentational)
 * - Action: dismiss button (toggles visible state)
 *
 * ## Visibility
 *
 * The alert tracks a `visible` state via `Synced<boolean>`. When dismissed,
 * the root receives `hidden` and `data-state="hidden"`. The `dismiss()` and
 * `show()` helpers allow programmatic control.
 *
 * ## Data Attributes
 *
 * - `data-cl-alert-root` — builder identity (root)
 * - `data-cl-alert-icon` — builder identity (icon)
 * - `data-cl-alert-title` — builder identity (title)
 * - `data-cl-alert-description` — builder identity (description)
 * - `data-cl-alert-action` — builder identity (action)
 * - `data-state` — `"visible"` or `"hidden"`
 *
 * @see {@link AlertProps} for configuration options
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	extract,
} from "../_internal/index.js";
import type { AlertProps } from "./types.js";

const metadata = createBuilderMetadata("alert", [
	"root",
	"icon",
	"title",
	"description",
	"action",
] as const);

/**
 * ColdLight Alert builder.
 *
 * Manages ARIA attributes, visibility state, and data-attribute derivation
 * for the alert pattern. Provides `dismiss()` and `show()` helpers for
 * programmatic visibility control.
 *
 * @example
 * ```typescript
 * const alert = new Alert({
 *   visible: true,
 *   "aria-label": "Success notification",
 * });
 * // Spread: <div {...alert.root}>
 * //   <span {...alert.icon}>...</span>
 * //   <h3 {...alert.title}>Success</h3>
 * //   <p {...alert.description}>Your changes were saved.</p>
 * //   <button {...alert.action}>Dismiss</button>
 * // </div>
 * ```
 */
export class Alert {
	/** Unique IDs for this builder instance. */
	readonly ids: {
		readonly root: string;
		readonly icon: string;
		readonly title: string;
		readonly description: string;
		readonly action: string;
	} = metadata.createIds();

	#visible: Synced<boolean>;
	#props: AlertProps;

	/**
	 * Create a new Alert builder instance.
	 *
	 * @param props - Configuration options for the alert
	 */
	constructor(props: AlertProps = {}) {
		this.#props = props;

		this.#visible = new Synced<boolean>({
			value: props.visible,
			onChange: props.onVisibleChange,
			defaultValue: true,
		});
	}

	// =========================================================================
	// Reactive State — Accessors for builder state
	// =========================================================================

	/** Whether the alert is currently visible. */
	get visible(): boolean {
		return this.#visible.current;
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root alert container element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-alert-root`, `id`
	 * - ARIA: `role="alert"`, `aria-label`, `aria-labelledby`
	 * - Data: `data-state`
	 * - HTML: `hidden` (when not visible)
	 *
	 * @example
	 * ```svelte
	 * <div {...alert.root}>...</div>
	 * ```
	 */
	get root() {
		const ariaLabel = extract(this.#props["aria-label"], undefined);
		const ariaLabelledby = extract(this.#props["aria-labelledby"], undefined);

		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			role: "alert" as const,
			"aria-label": ariaLabel,
			"aria-labelledby": ariaLabelledby,
			"data-state": this.visible ? "visible" as const : "hidden" as const,
			hidden: this.visible ? undefined : true,
		};
	}

	/**
	 * Spread attributes for the icon element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-alert-icon`, `id`
	 * - ARIA: `aria-hidden="true"` (decorative)
	 *
	 * @example
	 * ```svelte
	 * <span {...alert.icon}><InfoIcon /></span>
	 * ```
	 */
	get icon() {
		return {
			[metadata.dataAttrs.icon]: "",
			id: this.ids.icon,
			"aria-hidden": "true" as const,
		};
	}

	/**
	 * Spread attributes for the title element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-alert-title`, `id`
	 *
	 * @example
	 * ```svelte
	 * <h3 {...alert.title}>Warning</h3>
	 * ```
	 */
	get title() {
		return {
			[metadata.dataAttrs.title]: "",
			id: this.ids.title,
		};
	}

	/**
	 * Spread attributes for the description element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-alert-description`, `id`
	 *
	 * @example
	 * ```svelte
	 * <p {...alert.description}>Your session is about to expire.</p>
	 * ```
	 */
	get description() {
		return {
			[metadata.dataAttrs.description]: "",
			id: this.ids.description,
		};
	}

	/**
	 * Spread attributes for the action/dismiss button element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-alert-action`, `id`
	 * - Handlers: `onclick` (calls `dismiss()`)
	 *
	 * @example
	 * ```svelte
	 * <button {...alert.action}>Close</button>
	 * ```
	 */
	get action() {
		return {
			[metadata.dataAttrs.action]: "",
			id: this.ids.action,
			onclick: () => {
				this.dismiss();
			},
		};
	}

	// =========================================================================
	// Programmatic Helpers
	// =========================================================================

	/**
	 * Dismiss the alert by setting `visible` to `false`.
	 *
	 * Fires the `onVisibleChange` callback with `false`.
	 */
	dismiss(): void {
		this.#visible.current = false;
	}

	/**
	 * Show the alert by setting `visible` to `true`.
	 *
	 * Fires the `onVisibleChange` callback with `true`.
	 */
	show(): void {
		this.#visible.current = true;
	}
}

/**
 * Factory function for the Alert builder.
 *
 * Preferred API — matches MeltUI convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the alert
 * @returns A new {@link Alert} instance
 *
 * @example
 * ```typescript
 * const alert = createAlert({ variant: "success", visible: true });
 * ```
 */
export function createAlert(props?: AlertProps): Alert {
	return new Alert(props);
}
