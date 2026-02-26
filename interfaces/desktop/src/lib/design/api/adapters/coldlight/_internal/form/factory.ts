/**
 * @file builders/form/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Form builder — Svelte 5 runes-native.
 *
 * The Form builder owns all ARIA semantics and data-attribute derivation
 * for the native `<form>` element pattern. Components create a Form instance
 * and spread `builder.root` onto the `<form>` element.
 *
 * ## ARIA Semantics
 *
 * - Root: implicit `role="form"` (via native `<form>`), `aria-label`, `aria-busy`
 * - Disabled state propagates to children
 * - Pending state for submission tracking
 *
 * ## Behavior
 *
 * - **Submit** — fires `onSubmit` callback, prevented when disabled or pending
 * - **Reset** — fires `onReset` callback, prevented when disabled
 *
 * ## Data Attributes
 *
 * - `data-cl-form-root` — builder identity (root)
 * - `data-disabled` — present (`""`) when disabled
 * - `data-state` — `"pending"` during submission, `"idle"` otherwise
 *
 * @see {@link FormProps} for configuration options
 */

import { Synced } from "../../../../../builders/_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
} from "../../../../../builders/_internal/index.js";
import type { FormProps } from "./types.js";

const metadata = createBuilderMetadata("form", ["root"] as const);

/**
 * ColdLight Form builder.
 *
 * Manages ARIA attributes, submit/reset event handling, and data-state
 * derivation for the native `<form>` element pattern. Tracks disabled
 * and pending states reactively.
 *
 * @example
 * ```typescript
 * const form = new Form({
 *   label: "Sign up",
 *   onSubmit: (e) => { e.preventDefault(); handleSubmit(); },
 *   onReset: () => resetFields(),
 * });
 * // Spread: <form {...form.root}>...</form>
 * ```
 */
export class Form {
	/** Unique IDs for this builder instance. */
	readonly ids: { readonly root: string } = metadata.createIds();

	#label: Synced<string | undefined>;
	#disabled: Synced<boolean>;
	#pending: Synced<boolean>;
	#onSubmit: ((e: SubmitEvent) => void) | undefined;
	#onReset: (() => void) | undefined;

	/**
	 * Create a new Form builder instance.
	 *
	 * @param props - Configuration options for the form
	 */
	constructor(props: FormProps = {}) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});

		this.#disabled = new Synced<boolean>({
			value: props.disabled,
			defaultValue: false,
		});

		this.#pending = new Synced<boolean>({
			value: props.pending,
			defaultValue: false,
		});

		this.#onSubmit = props.onSubmit;
		this.#onReset = props.onReset;
	}

	// =========================================================================
	// Reactive State — Accessors for builder state
	// =========================================================================

	/** Whether the form is disabled. */
	get disabled(): boolean {
		return this.#disabled.current;
	}

	/**
	 * Whether the form is in a pending/submitting state.
	 *
	 * When `true`, the root emits `aria-busy="true"` and `data-state="pending"`.
	 * Submit events are prevented while pending.
	 */
	get pending(): boolean {
		return this.#pending.current;
	}

	/**
	 * Set the pending state programmatically.
	 *
	 * @param value - `true` to mark as pending, `false` to mark as idle
	 */
	set pending(value: boolean) {
		this.#pending.current = value;
	}

	// =========================================================================
	// Slot Attribute Getters — Spread onto HTML elements
	// =========================================================================

	/**
	 * Spread attributes for the root `<form>` element.
	 *
	 * Returns an exact typed object containing:
	 * - Builder identity: `data-cl-form-root`, `id`
	 * - ARIA: `aria-label`, `aria-busy`
	 * - Data: `data-disabled`, `data-state`
	 * - Handlers: `onsubmit`, `onreset`
	 *
	 * @example
	 * ```svelte
	 * <form {...form.root}>
	 *   <!-- fields -->
	 *   <button type="submit">Submit</button>
	 * </form>
	 * ```
	 */
	get root() {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			"aria-label": this.#label.current,
			"data-disabled": dataAttr(this.disabled),
			"data-state": this.pending ? "pending" as const : "idle" as const,
			"aria-busy": this.pending ? "true" as const : undefined,

			onsubmit: (e: SubmitEvent) => {
				if (this.disabled || this.pending) {
					e.preventDefault();
					return;
				}
				this.#onSubmit?.(e);
			},

			onreset: () => {
				if (this.disabled) return;
				this.#onReset?.();
			},
		};
	}
}

/**
 * Factory function for the Form builder.
 *
 * Preferred API — matches MeltUI convention of `createBuilder()` factory functions.
 *
 * @param props - Configuration options for the form
 * @returns A new {@link Form} instance
 *
 * @example
 * ```typescript
 * const form = createForm({ label: "Login", onSubmit: handleLogin });
 * ```
 */
export function createForm(props?: FormProps): Form {
	return new Form(props);
}
