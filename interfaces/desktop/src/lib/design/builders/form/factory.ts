/**
 * @file builders/form/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Form builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Native <form> container:
 * - Root: role="form" (implicit via <form>), aria-label
 * - Disabled state propagates to children
 * - Pending state for submission tracking
 * - Submit/reset event handling
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
	dataAttr,
	disabledAttr,
	extract,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { FormProps } from "./types.js";

const metadata = createBuilderMetadata("form", ["root"] as const);

export class Form {
	readonly ids = metadata.createIds();
	#label: Synced<string | undefined>;
	#disabled: Synced<boolean>;
	#pending: Synced<boolean>;
	#onSubmit: ((e: SubmitEvent) => void) | undefined;
	#onReset: (() => void) | undefined;

	constructor(props: FormProps = {} as FormProps) {
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

	// --- Reactive state ---

	get disabled(): boolean {
		return this.#disabled.current;
	}

	get pending(): boolean {
		return this.#pending.current;
	}

	set pending(value: boolean) {
		this.#pending.current = value;
	}

	// --- Slot attribute getters ---

	/** Root form attributes. Spread onto the <form> element. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
			"aria-label": this.#label.current,
			"data-disabled": dataAttr(this.disabled),
			"data-state": this.pending ? "pending" : "idle",
			"aria-busy": this.pending ? "true" : undefined,

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

/** Factory function — preferred API. */
export function createForm(props?: FormProps): Form {
	return new Form(props);
}
