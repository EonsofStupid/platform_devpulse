/**
 * Merge attribute objects for one element, left to right — React Aria's
 * `mergeProps`, for Svelte spreads (plan 0006 C12).
 *
 * - Event handlers (`on…` functions) run in order, so a caller's handler adds
 *   to the behavior's instead of replacing it.
 * - `class` values join with a space; `style` strings join with `;`.
 * - Anything else: the later value wins. A later `undefined` does not erase
 *   an earlier value.
 *
 * Pure, no framework: behaviors and components both use it (utils/ stays framework-free, F0).
 */

type Attributes = Record<string, unknown>;
type Handler = (...args: unknown[]) => unknown;

/** `{ ...A, ...B }` as a type: B's keys replace A's. */
type Spread<A, B> = Omit<A, keyof B> & B;

/** The merged attribute type: the sources spread left to right. */
type Merged<
	T extends readonly unknown[],
	Acc extends object = Record<never, never>,
> = T extends readonly [infer Head, ...infer Tail]
	? Merged<Tail, Head extends object ? Spread<Acc, Head> : Acc>
	: Acc;

/** Two handlers for the same event: they chain instead of the later replacing the earlier. */
const chains = (key: string, earlier: unknown, value: unknown): boolean =>
	/^on[a-z]/.test(key) && typeof earlier === "function" && typeof value === "function";

export function mergeProps<T extends readonly (object | undefined)[]>(...sources: T): Merged<T> {
	const out: Attributes = {};
	for (const source of sources) {
		if (!source) continue;
		for (const [key, value] of Object.entries(source as Attributes)) {
			const earlier = out[key];
			if (value === undefined) {
				if (!(key in out)) out[key] = undefined;
			} else if (chains(key, earlier, value)) {
				out[key] = (...args: unknown[]) => {
					(earlier as Handler)(...args);
					(value as Handler)(...args);
				};
			} else if (key === "class" && earlier && value) {
				out[key] = `${String(earlier)} ${String(value)}`;
			} else if (key === "style" && typeof earlier === "string" && typeof value === "string") {
				out[key] = `${earlier};${value}`;
			} else {
				out[key] = value;
			}
		}
	}
	return out as Merged<T>;
}
