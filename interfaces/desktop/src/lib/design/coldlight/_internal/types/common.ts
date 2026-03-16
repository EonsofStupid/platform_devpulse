/**
 * Shared types for ColdLight primitive hooks.
 */

/** HTML attributes that hooks return for spreading onto elements. */
export type SlotAttrs = Record<string, unknown>;

/** Standard data attributes every ColdLight primitive emits. */
export interface ColdLightDataAttrs {
	"data-kind": string;
	"data-slot": string;
	"data-state"?: string;
	"data-disabled"?: "" | undefined;
}
