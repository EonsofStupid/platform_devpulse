/**
 * @file builders/_internal/selection-state.svelte.ts
 * @package @devpulse/coldlight
 *
 * Single/multi-select state machine.
 * Mirrors melt's SelectionState class.
 *
 * Type-branches:
 * - Multiple extends true → SvelteSet<T>
 * - Multiple extends false → T | undefined
 *
 * Used by toggle-group, toolbar, data-table, any builder with selectable items.
 */

import { SvelteSet } from "svelte/reactivity";
import { isFunction, isIterable } from "./is.js";
import { extract } from "./extract.js";
import type { MaybeGetter } from "./types.js";

/** Iterate an iterable safely (SvelteSet doesn't support for...of in all contexts). */
function forEach<T>(iterable: Iterable<T>, cb: (item: T) => void): void {
	const arr = Array.from(iterable);
	for (let i = 0; i < arr.length; i++) {
		cb(arr[i]);
	}
}

/** Check if value is a SvelteSet. */
function isSvelteSet<T>(value: unknown): value is SvelteSet<T> {
	return value instanceof SvelteSet;
}

/** Convert any value to a Set. */
function toSet<T>(value: T | SvelteSet<T> | Iterable<T> | undefined): SvelteSet<T> {
	if (isSvelteSet<T>(value)) return value;
	if (isIterable<T>(value)) {
		const set = new SvelteSet<T>();
		forEach(value, (v) => set.add(v));
		return set;
	}
	const set = new SvelteSet<T>();
	if (value !== undefined) set.add(value);
	return set;
}

/** Extract the single value from a set (first item or undefined). */
function toSingle<T>(value: SvelteSet<T> | T | undefined): T | undefined {
	if (isSvelteSet<T>(value)) {
		const arr = Array.from(value);
		return arr[0];
	}
	return value;
}

/** Deep equality check for snapshots. Handles Set (JSON.stringify serializes Set as "{}"). */
function snapshotEqual(a: unknown, b: unknown): boolean {
	if (a instanceof Set && b instanceof Set) {
		if (a.size !== b.size) return false;
		for (const item of a) {
			if (!b.has(item)) return false;
		}
		return true;
	}
	return JSON.stringify(a) === JSON.stringify(b);
}

export interface SelectionStateProps<T, Multiple extends boolean = false> {
	value?: Multiple extends true
		? MaybeGetter<Iterable<T> | SvelteSet<T> | undefined>
		: MaybeGetter<T | undefined>;
	onChange?: Multiple extends true
		? (value: SvelteSet<T>) => void
		: (value: T | undefined) => void;
	multiple?: MaybeGetter<Multiple | undefined>;
}

export class SelectionState<T, Multiple extends boolean = false> {
	#props: SelectionStateProps<T, Multiple>;
	#internal_set = new SvelteSet<T>();

	isControlled = $derived.by(() => {
		return isSvelteSet(this.#props.value) || isFunction(this.#props.value);
	});

	isMultiple = $derived.by(() => {
		return extract(this.#props.multiple, false as Multiple) as boolean;
	});

	constructor(props: SelectionStateProps<T, Multiple>) {
		this.#props = props;

		// Initialize internal set from static value
		const value = props.value;
		if (!isIterable(value) && !isFunction(value) && value !== undefined) {
			this.#internal_set.add(value as T);
		} else if (isIterable(value)) {
			forEach(value as Iterable<T>, (v) => this.#internal_set.add(v));
		}
	}

	get current(): Multiple extends true ? SvelteSet<T> : T | undefined {
		type Result = Multiple extends true ? SvelteSet<T> : T | undefined;
		let value: SvelteSet<T> | Iterable<T> | T | undefined;

		if (isFunction(this.#props.value)) {
			value = (this.#props.value as () => SvelteSet<T> | Iterable<T> | T | undefined)();
		} else if (isSvelteSet<T>(this.#props.value as unknown)) {
			value = this.#props.value as SvelteSet<T>;
		} else {
			value = this.#internal_set;
		}

		if (this.isMultiple) {
			return toSet(value as Iterable<T> | T | undefined) as Result;
		}
		return toSingle(value as SvelteSet<T> | T | undefined) as Result;
	}

	/** Internal onChange dispatch. */
	#onChange(newValue: SvelteSet<T> | T | undefined): void {
		if (this.#props.onChange) {
			(this.#props.onChange as (value: SvelteSet<T> | T | undefined) => void)(newValue);
		}
	}

	/**
	 * Manipulate the selection set via callback.
	 * Handles controlled/uncontrolled, single/multi, and deep equality checks.
	 */
	manipulate(cb: (set: SvelteSet<T>) => void): void {
		const set = this.isControlled ? toSet(this.current as Iterable<T> | T | undefined) : this.#internal_set;
		// Snapshot before mutation — Array.from for Sets (JSON.stringify serializes Set as "{}")
		const prevSnapshot = this.isMultiple
			? Array.from(set)
			: $state.snapshot(toSingle(set));
		cb(set);
		const newValue = this.isMultiple ? set : toSingle(set);
		const newSnapshot = this.isMultiple
			? Array.from(set)
			: $state.snapshot(newValue);
		if (snapshotEqual(prevSnapshot, newSnapshot)) return;
		this.#onChange(newValue);
	}

	/** Toggle an item's selection state. */
	toggle(item: T): void {
		this.manipulate((set) => {
			if (set.has(item)) {
				set.delete(item);
			} else {
				if (!this.isMultiple) set.clear();
				set.add(item);
			}
		});
	}

	/** Check if an item is selected. */
	has(item: T): boolean {
		if (this.isMultiple) {
			return toSet(this.current as Iterable<T> | undefined).has(item);
		}
		return (this.current as T | undefined) === item;
	}

	/** Add an item to selection. */
	add(value: T): void {
		this.manipulate((set) => {
			if (!this.isMultiple) set.clear();
			set.add(value);
		});
	}

	/** Remove an item from selection. */
	delete(value: T): void {
		this.manipulate((set) => {
			set.delete(value);
		});
	}

	/** Clear all selections. */
	clear(): void {
		this.manipulate((set) => {
			set.clear();
		});
	}

	/** Get selected items as array. */
	toArray(): T[] {
		if (this.isMultiple) {
			return Array.from(this.current as SvelteSet<T>);
		}
		const val = this.current as T | undefined;
		return val !== undefined ? [val] : [];
	}
}
