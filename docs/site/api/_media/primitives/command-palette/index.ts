/**
 * @file primitives/command-palette/index.ts
 * @kind command-palette
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Command palette primitive barrel export.
 * ariaStateProvider: "meltui" — no .svelte file, MeltUI adapter handles ARIA.
 */

export { contract } from "./contract.js";
export {
	commandPaletteSlots,
	commandPaletteStateTokens,
	commandPaletteSlotStates,
} from "./types.js";
export type {
	CommandPaletteSlot,
	CommandPaletteState,
	CommandPaletteRootProps,
	CommandPaletteInputProps,
	CommandPaletteItemProps,
} from "./types.js";
