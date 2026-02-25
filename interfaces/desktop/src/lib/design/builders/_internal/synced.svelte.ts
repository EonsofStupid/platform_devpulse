/**
 * @file builders/_internal/synced.svelte.ts
 * @package @devpulse/coldlight
 *
 * Controlled/uncontrolled state wrapper.
 * Mirrors melt's Synced class exactly. This is the core state primitive
 * every builder wraps its main state in.
 *
 * Getter arg → controlled (always reads from getter, setter only fires onChange)
 * Static arg → uncontrolled (internal $state, setter updates internal + fires onChange)
 * equalityCheck: true → reference equality skip
 * equalityCheck: function → custom equality skip
 */

import { isFunction } from "./is.js";
import { extract } from "./extract.js";
import type { MaybeGetter } from "./types.js";

export interface SyncedArgs<T> {
	value: MaybeGetter<T | undefined>;
	onChange?: (value: T) => void;
	defaultValue: T;
	equalityCheck?: boolean | ((a: T, b: T) => boolean);
}

export class Synced<T> {
	#internalValue = $state<T>() as T;
	#valueArg: MaybeGetter<T | undefined>;
	#onChange: ((value: T) => void) | undefined;
	#defaultValue: T;
	#equalityCheck: boolean | ((a: T, b: T) => boolean) | undefined;

	constructor(args: SyncedArgs<T>) {
		this.#valueArg = args.value;
		this.#onChange = args.onChange;
		this.#defaultValue = args.defaultValue;
		this.#equalityCheck = args.equalityCheck;
		this.#internalValue = extract(args.value, args.defaultValue) as T;
	}

	get current(): T {
		if (isFunction(this.#valueArg)) {
			return (this.#valueArg() ?? this.#defaultValue ?? this.#internalValue) as T;
		}
		return this.#internalValue;
	}

	set current(value: T) {
		// Reference equality skip
		if (this.#equalityCheck === true && this.current === value) return;

		// Custom equality skip
		if (isFunction(this.#equalityCheck)) {
			if ((this.#equalityCheck as (a: T, b: T) => boolean)(this.current, value)) return;
		}

		// Controlled: only fire onChange, don't store
		if (isFunction(this.#valueArg)) {
			this.#onChange?.(value);
			return;
		}

		// Uncontrolled: store internally + fire onChange
		this.#internalValue = value;
		this.#onChange?.(value);
	}
}
