/**
 * @file api/adapters/meltui/_internal/toaster/_transport/factory.ts
 * @package @devpulse/coldlight
 *
 * Creates a ColdLight toaster transport from melt v0.44 Toaster.
 * Maps melt Toaster getters → ColdLight slot vocabulary.
 *
 * Melt v0.44 Toaster exposes:
 *   toaster.root → slots.root (data-melt-toaster-root, popover="manual")
 *
 * Toast slot mapping (per toast instance):
 *   toast.content     → toast.content     (role="alert", aria-live, data-melt-*)
 *   toast.title       → toast.title       (id for aria-labelledby)
 *   toast.description → toast.description (id for aria-describedby)
 *   toast.close       → toast.close       (onclick, data-melt-*)
 *
 * Melt v0.44 addToast expects AddToastArgs<T> = { data: T, id?, closeDelay?, type? }.
 * This transport wraps the data payload into that shape.
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltToaster } from "../factory.js";
import type {
	ToasterTransport,
	ToasterTransportConfig,
	ToastTransport,
} from "./types.js";

/**
 * Map a melt Toast instance to a ColdLight ToastTransport.
 */
function mapToast(meltToast: {
	id: string;
	content: unknown;
	title: unknown;
	description: unknown;
	close: unknown;
	percentage: number;
	removeSelf(): void;
	pause(): void;
	resume(): void;
	reset(): void;
}): ToastTransport {
	return {
		get id() {
			return meltToast.id;
		},
		get content(): SlotAttrs {
			return meltToast.content as unknown as SlotAttrs;
		},
		get title(): SlotAttrs {
			return meltToast.title as unknown as SlotAttrs;
		},
		get description(): SlotAttrs {
			return meltToast.description as unknown as SlotAttrs;
		},
		get close(): SlotAttrs {
			return meltToast.close as unknown as SlotAttrs;
		},
		get percentage() {
			return meltToast.percentage;
		},
		removeSelf: () => meltToast.removeSelf(),
		pause: () => meltToast.pause(),
		resume: () => meltToast.resume(),
		reset: () => meltToast.reset(),
	};
}

/**
 * Create a ColdLight toaster transport wrapping melt v0.44 Toaster.
 *
 * Usage in component:
 * ```svelte
 * const transport = createToasterTransport({ closeDelay: 5000 });
 *
 * <div {...transport.slots.root}>
 *   {#each transport.states.toasts as toast (toast.id)}
 *     <div {...toast.content}>
 *       <h3 {...toast.title}>Notification</h3>
 *       <p {...toast.description}>Something happened</p>
 *       <button {...toast.close}>Dismiss</button>
 *     </div>
 *   {/each}
 * </div>
 *
 * <button onclick={() => transport.addToast({ message: "Hello" })}>
 *   Notify
 * </button>
 * ```
 */
export function createToasterTransport<T = unknown>(
	config?: ToasterTransportConfig,
): ToasterTransport<T> {
	const toaster = createMeltToaster<T>({
		closeDelay: config?.closeDelay,
		type: config?.type,
		hover: config?.hover,
		tabHidden: config?.tabHidden,
	});

	return {
		slots: {
			get root(): SlotAttrs {
				return toaster.root as unknown as SlotAttrs;
			},
		},
		states: {
			get toasts(): readonly ToastTransport[] {
				return toaster.toasts.map(mapToast);
			},
		},
		addToast(data: T): void {
			toaster.addToast({ data });
		},
	};
}
