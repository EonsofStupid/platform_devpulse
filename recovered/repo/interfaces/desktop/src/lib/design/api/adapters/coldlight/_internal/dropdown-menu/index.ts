/**
 * @file api/adapters/coldlight/_internal/dropdown-menu/index.ts
 * @package @devpulse/coldlight
 *
 * ColdLight DropdownMenu _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 */

export {
    createDropdownMenuTransport,
    type DropdownMenuActions,
    type DropdownMenuAttachments,
    type DropdownMenuTransport,
    type DropdownMenuTransportConfig,
    type DropdownMenuTransportStates,
    type MenuItemMeta,
} from "./_transport/index.js";
export {
    ColdLightDropdownMenu,
    type ColdLightDropdownMenuConfig,
} from "./dropdown-menu.svelte.js";
