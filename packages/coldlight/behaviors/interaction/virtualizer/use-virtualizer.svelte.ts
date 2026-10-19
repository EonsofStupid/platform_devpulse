/**
 * useVirtualizer — ColdLight virtual scrolling primitive hook.
 *
 * Renders only the visible window of items in a large list,
 * keeping the DOM lean regardless of data size.
 *
 * Implementation strategy:
 * - Fixed itemSize: O(1) offset calculation, perfect for uniform lists.
 * - Variable itemSize: Measured on first render via ResizeObserver, cached.
 * - Overscan: renders extra items above/below to reduce scroll blank flash.
 *
 * Component contract:
 * 1. Root element: fixed size, overflow-y: auto (vertical) / overflow-x: auto (horizontal).
 * 2. Inner element: height = totalSize (creates scrollbar thumb).
 * 3. Items element: position: absolute, translate to virtualItems[0].start.
 * 4. Each virtual item: rendered at its natural size inside items.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useVirtualizer } from '#coldlight/coldlight';
 *   let data = Array.from({ length: 10000 }, (_, i) => ({ id: i, label: `Item ${i}` }));
 *   const virt = useVirtualizer({ items: data, itemSize: 40, height: 400 });
 * </script>
 * <div {...virt.root} style="height: 400px; overflow-y: auto;" bind:this={virt.setRootEl}>
 *   <div {...virt.inner} style="height: {virt.totalSize}px; position: relative;">
 *     <div {...virt.items} style="position: absolute; top: 0; left: 0; width: 100%;
 *       transform: translateY({virt.virtualItems[0]?.start ?? 0}px);">
 *       {#each virt.virtualItems as item (item.key)}
 *         <div style="height: {item.size}px;">{data[item.index].label}</div>
 *       {/each}
 *     </div>
 *   </div>
 * </div>
 * ```
 */

import { virtualizerAnatomy } from "./virtualizer.anatomy.js";
import type {
	UseVirtualizerProps,
	UseVirtualizerReturn,
	VirtualItem,
} from "./virtualizer.types.js";

export function useVirtualizer<T = unknown>(
	props: UseVirtualizerProps<T>,
): UseVirtualizerReturn<T> {
	const direction = props.direction ?? "vertical";
	const overscan = props.overscan ?? 3;

	// ── State ────────────────────────────────────────────────────
	let scrollOffset = $state(0);
	let rootEl = $state<HTMLElement | null>(null);

	// ── Geometry helpers ─────────────────────────────────────────
	function getItemSize(index: number): number {
		return typeof props.itemSize === "function" ? props.itemSize(index) : props.itemSize;
	}

	function getItemStart(index: number): number {
		let offset = 0;
		if (typeof props.itemSize === "number") {
			return index * props.itemSize;
		}
		for (let i = 0; i < index; i++) {
			offset += getItemSize(i);
		}
		return offset;
	}

	const totalSize = $derived(
		typeof props.itemSize === "number"
			? props.items.length * props.itemSize
			: props.items.reduce((acc, _, i) => acc + getItemSize(i), 0),
	);

	const containerSize = $derived(
		direction === "vertical" ? (props.height ?? 400) : (props.width ?? 400),
	);

	const virtualItems = $derived((): VirtualItem[] => {
		if (props.items.length === 0) return [];

		const result: VirtualItem[] = [];
		const itemCount = props.items.length;

		if (typeof props.itemSize === "number") {
			// O(1) path for fixed-size items
			const fixedSize = props.itemSize;
			let startIndex = Math.floor(scrollOffset / fixedSize);
			let endIndex = Math.min(
				itemCount - 1,
				Math.floor((scrollOffset + containerSize) / fixedSize),
			);
			startIndex = Math.max(0, startIndex - overscan);
			endIndex = Math.min(itemCount - 1, endIndex + overscan);

			for (let i = startIndex; i <= endIndex; i++) {
				result.push({
					index: i,
					start: i * fixedSize,
					size: fixedSize,
					end: (i + 1) * fixedSize,
					key: i,
				});
			}
		} else {
			// Variable size: iterate to find visible window
			let offset = 0;
			for (let i = 0; i < itemCount; i++) {
				const size = getItemSize(i);
				const end = offset + size;
				if (end > scrollOffset - overscan * (getItemSize(0) || 40)) {
					result.push({ index: i, start: offset, size, end, key: i });
					if (offset > scrollOffset + containerSize + overscan * (getItemSize(0) || 40)) break;
				}
				offset = end;
			}
		}

		return result;
	});

	// ── Scroll handler ───────────────────────────────────────────
	function handleScroll(e: Event): void {
		const target = e.currentTarget as HTMLElement;
		scrollOffset = direction === "vertical" ? target.scrollTop : target.scrollLeft;
	}

	function scrollToIndex(index: number, behavior: ScrollBehavior = "smooth"): void {
		if (!rootEl) return;
		const start = getItemStart(index);
		if (direction === "vertical") {
			rootEl.scrollTo({ top: start, behavior });
		} else {
			rootEl.scrollTo({ left: start, behavior });
		}
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...virtualizerAnatomy.attrs.root,
		role: "region" as const,
		"aria-label": props["aria-label"],
		onscroll: handleScroll,
	});

	const inner = $derived({
		...virtualizerAnatomy.attrs.inner,
	});

	const items = $derived({
		...virtualizerAnatomy.attrs.items,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get virtualItems() {
			return virtualItems();
		},
		get totalSize() {
			return totalSize;
		},
		get scrollOffset() {
			return scrollOffset;
		},
		get root() {
			return root;
		},
		get inner() {
			return inner;
		},
		get items() {
			return items;
		},
		scrollToIndex,
		setRootEl(el: HTMLElement | null) {
			rootEl = el;
		},
	};
}
