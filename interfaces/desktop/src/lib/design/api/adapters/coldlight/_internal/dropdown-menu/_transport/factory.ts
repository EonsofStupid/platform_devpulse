/**
 * @file api/adapters/coldlight/_internal/dropdown-menu/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight dropdown menu transport from ColdLightDropdownMenu.
 * Maps internal class → ColdLight slot vocabulary.
 */

import { ColdLightDropdownMenu } from "../dropdown-menu.svelte.js";
import type {
    DropdownMenuTransport,
    DropdownMenuTransportConfig,
    MenuItemMeta,
} from "./types.js";

/**
 * Create a ColdLight dropdown menu transport.
 *
 * @example
 * ```svelte
 * const menu = createDropdownMenuTransport({
 *   onOpenChange: (v) => console.log("open:", v),
 * });
 *
 * <button use:menu.attachTrigger {...menu.slots.trigger}>Actions</button>
 * {#if menu.states.open}
 *   <div use:menu.attachContent {...menu.slots.content}>
 *     <div {...menu.getItem({ value: "edit" })}>Edit</div>
 *     <div {...menu.getItem({ value: "delete" })}>Delete</div>
 *   </div>
 * {/if}
 * ```
 */
export function createDropdownMenuTransport(
    config?: DropdownMenuTransportConfig,
): DropdownMenuTransport {
    const ddMenu = new ColdLightDropdownMenu({
        open: config?.open,
        onOpenChange: config?.onOpenChange,
        orientation: config?.orientation,
        loop: config?.loop,
        typeaheadTimeout: config?.typeaheadTimeout,
        closeOnOutsideClick: config?.closeOnOutsideClick,
        closeOnEscape: config?.closeOnEscape,
    });

    return {
        slots: {
            get trigger() {
                return ddMenu.trigger;
            },
            get content() {
                return ddMenu.content;
            },
            get separator() {
                return ddMenu.separator;
            },
        },
        states: {
            get open() {
                return ddMenu.open;
            },
            set open(v: boolean) {
                ddMenu.open = v;
            },
            get orientation() {
                return ddMenu.orientation;
            },
        },
        getItem: (meta: MenuItemMeta) => ddMenu.getItem(meta),
        getGroup: (label: string) => ddMenu.getGroup(label),
        attachContent: (node) => ddMenu.attachContent(node),
        attachTrigger: (node) => ddMenu.attachTrigger(node),
    };
}
