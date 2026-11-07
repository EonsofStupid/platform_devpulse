/**
 * @file api/adapters/coldlight/_internal/menu/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight menu transport from the ColdLightMenu class.
 * Maps ColdLightMenu getters → ColdLight slot vocabulary.
 */

import { ColdLightMenu } from "../menu.svelte.js";
import type { MenuTransport, MenuTransportConfig, MenuItemMeta } from "./types.js";

/**
 * Create a ColdLight menu transport.
 *
 * Usage:
 * ```svelte
 * const menu = createMenuTransport({ onClose: () => open = false });
 *
 * <div {...menu.slots.content}>
 *   {#each items as item}
 *     <div {...menu.getItem({ value: item.id })}>
 *       {item.label}
 *     </div>
 *   {/each}
 * </div>
 * ```
 */
export function createMenuTransport(config?: MenuTransportConfig): MenuTransport {
	const menu = new ColdLightMenu({
		orientation: config?.orientation,
		loop: config?.loop,
		typeaheadTimeout: config?.typeaheadTimeout,
		onClose: config?.onClose,
	});

	return {
		slots: {
			get content() {
				return menu.content;
			},
			get separator() {
				return menu.separator;
			},
		},
		states: {
			get orientation() {
				return menu.orientation;
			},
		},
		getItem: (meta: MenuItemMeta) => menu.getItem(meta),
		getGroup: (label: string) => menu.getGroup(label),
		focusFirst: (menuEl: HTMLElement | null) => menu.focusFirst(menuEl),
		focusLast: (menuEl: HTMLElement | null) => menu.focusLast(menuEl),
	};
}
