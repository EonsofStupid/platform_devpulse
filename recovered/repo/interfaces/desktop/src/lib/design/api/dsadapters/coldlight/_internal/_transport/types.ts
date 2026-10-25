/** Value or getter — reactive when getter, static when value */
export type MaybeGetter<T> = T | (() => T);

/** Extract value from MaybeGetter */
export function extract<T>(value: MaybeGetter<T>): T;
export function extract<T>(value: MaybeGetter<T | undefined>, fallback: T): T;
export function extract<T>(value: MaybeGetter<T | undefined>, fallback?: T): T | undefined {
	const v = typeof value === "function" ? (value as () => T)() : value;
	return v ?? fallback;
}

/** Slot attribute object — spread onto element */
export type SlotAttrs = Record<string, unknown>;

/** Transport adapter interface — all adapters satisfy this */
export interface TransportAdapter<TSlot extends string, TStates> {
	readonly slots: { readonly [K in TSlot]: SlotAttrs };
	readonly states: TStates;
}
