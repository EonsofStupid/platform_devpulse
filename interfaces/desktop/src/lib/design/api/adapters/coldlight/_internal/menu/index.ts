/**
 * @file api/adapters/coldlight/_internal/menu/index.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Menu _internal barrel.
 * This is the ONLY allowed import path from outside this folder.
 */

export {
	createMenuTransport,
	type MenuActions,
	type MenuItemMeta,
	type MenuTransport,
	type MenuTransportConfig,
	type MenuTransportStates,
} from "./_transport/index.js";
export {
	ColdLightMenu,
	type ColdLightMenuConfig,
} from "./menu.svelte.js";
