/**
 * @file api/adapters/coldlight/_internal/menu/_transport/index.ts
 * @package @devpulse/coldlight
 */

export { createMenuTransport } from "./factory.js";
export type {
	MenuActions,
	MenuItemMeta,
	MenuTransport,
	MenuTransportConfig,
	MenuTransportStates,
} from "./types.js";
