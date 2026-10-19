/**
 * @file utils/slotMerge.ts
 * @package @devpulse/coldlight
 *
 * Merge slot attributes: data-kind, data-slot, class, and rest props.
 * Used by primitives to build the final attribute spread.
 */
export function slotMerge(
	kind: string,
	slot: string,
	className: string | undefined,
	rest: Record<string, unknown>,
): Record<string, unknown> {
	return {
		...rest,
		"data-kind": kind,
		"data-slot": slot,
		...(className ? { class: className } : {}),
	};
}
