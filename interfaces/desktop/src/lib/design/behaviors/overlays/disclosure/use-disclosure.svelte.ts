/**
 * useDisclosure — ColdLight disclosure (details/summary) primitive hook.
 *
 * Implements the WAI-ARIA APG Disclosure Pattern.
 * A trigger button controls visibility of a collapsible panel.
 *
 * Supports controlled (props.open) and uncontrolled (props.defaultOpen) modes.
 * In controlled mode the consumer manages open state via onOpenChange.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * @example
 * ```svelte
 * <script>
 *   import { useDisclosure } from '$lib/design/coldlight';
 *   const disclosure = useDisclosure({ defaultOpen: false });
 * </script>
 * <div {...disclosure.root}>
 *   <button {...disclosure.trigger}>Show details</button>
 *   {#if disclosure.isOpen}
 *     <div {...disclosure.panel}>
 *       Hidden content revealed here.
 *     </div>
 *   {/if}
 * </div>
 * ```
 */

import { createIds } from "../../_internal/utils/uid.js";
import { disclosureAnatomy } from "./disclosure.anatomy.js";
import type {
	DisclosureState,
	UseDisclosureProps,
	UseDisclosureReturn,
} from "./disclosure.types.js";

export function useDisclosure(props: UseDisclosureProps = {}): UseDisclosureReturn {
	const ids = createIds("disclosure", ["trigger", "panel"] as const);

	// ── State — controlled vs uncontrolled ───────────────────────
	let internalOpen = $state(props.defaultOpen ?? false);

	const isOpen = $derived(props.open !== undefined ? props.open : internalOpen);
	const state = $derived<DisclosureState>(isOpen ? "open" : "closed");

	function setOpen(next: boolean): void {
		if (props.disabled) return;
		if (props.open === undefined) {
			internalOpen = next;
		}
		props.onOpenChange?.(next);
	}

	function open(): void {
		setOpen(true);
	}

	function close(): void {
		setOpen(false);
	}

	function toggle(): void {
		setOpen(!isOpen);
	}

	// ── Keyboard handler ─────────────────────────────────────────
	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			toggle();
		}
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...disclosureAnatomy.attrs.root,
		"data-state": state,
	});

	const trigger = $derived({
		...disclosureAnatomy.attrs.trigger,
		id: ids.trigger,
		type: "button" as const,
		"aria-expanded": isOpen,
		"aria-controls": ids.panel,
		"aria-label": props["aria-label"],
		"aria-disabled": props.disabled ? ("true" as const) : undefined,
		"data-state": state,
		disabled: props.disabled,
		onclick: toggle,
		onkeydown: handleKeyDown,
	});

	const panel = $derived({
		...disclosureAnatomy.attrs.panel,
		id: ids.panel,
		role: "region" as const,
		"aria-labelledby": ids.trigger,
		"data-state": state,
		hidden: !isOpen,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get isOpen() {
			return isOpen;
		},
		get state() {
			return state;
		},
		get root() {
			return root;
		},
		get trigger() {
			return trigger;
		},
		get panel() {
			return panel;
		},
		open,
		close,
		toggle,
	};
}
