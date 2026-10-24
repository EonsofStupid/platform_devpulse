/**
 * A value a component may control or leave to its behavior: React Aria's
 * controlled-state model (owner, 2026-10-22), which `useDisclosure` already
 * followed by hand.
 *
 * - Controlled: `value()` is defined. Reads follow it; `set` reports through
 *   `onChange` and changes nothing itself — the owner decides.
 * - Uncontrolled: `value()` is undefined. Local state, seeded once from
 *   `defaultValue()`; `set` updates it and still reports through `onChange`.
 *
 * Setting the value it already has does nothing.
 *
 * @example
 * const open = controllable({
 *   value: () => props.open,
 *   defaultValue: () => props.defaultOpen ?? false,
 *   onChange: (next) => props.onOpenChange?.(next),
 * });
 * open.current; // read
 * open.set(true); // change
 */

import { untrack } from "svelte";

export interface Controllable<T> {
	/** The value now: the owner's when controlled, the local one otherwise. */
	readonly current: T;
	/** Ask for a new value. */
	set(next: T): void;
}

export interface ControllableOptions<T> {
	/** The owner's value; `undefined` leaves it to the behavior. Read reactively. */
	value: () => T | undefined;
	/** The starting value when uncontrolled. Read once. */
	defaultValue: () => T;
	/** Called with every change the behavior asks for. */
	onChange?: (next: T) => void;
}

export function controllable<T>(options: ControllableOptions<T>): Controllable<T> {
	let local = $state(untrack(options.defaultValue));
	const current = $derived.by(() => {
		const owned = options.value();
		return owned === undefined ? local : owned;
	});
	return {
		get current() {
			return current;
		},
		set(next: T): void {
			if (Object.is(next, current)) return;
			if (options.value() === undefined) local = next;
			options.onChange?.(next);
		},
	};
}
