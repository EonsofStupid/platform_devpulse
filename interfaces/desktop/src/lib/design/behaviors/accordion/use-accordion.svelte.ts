/**
 * useAccordion — ColdLight accordion primitive hook.
 *
 * Collapsible sections with aria-expanded, aria-controls, aria-labelledby.
 * Supports single (one open at a time) and multiple (any number open) modes.
 * Parts: root, item (parameterized), trigger (parameterized), content (parameterized).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */

import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { accordionAnatomy } from "./accordion.anatomy.js";
import type { UseAccordionProps, UseAccordionReturn } from "./accordion.types.js";

export function useAccordion(props: UseAccordionProps = {}): UseAccordionReturn {
	const id = uid("accordion");
	const type = props.type ?? "single";
	const collapsible = props.collapsible ?? false;
	const globalDisabled = $derived(props.disabled ?? false);

	let value = $state<string | string[]>(props.value ?? (type === "multiple" ? [] : ""));

	function isExpanded(itemValue: string): boolean {
		if (Array.isArray(value)) return value.includes(itemValue);
		return value === itemValue;
	}

	function toggle(itemValue: string): void {
		if (globalDisabled) return;

		if (type === "multiple") {
			const arr = Array.isArray(value) ? [...value] : [];
			const idx = arr.indexOf(itemValue);
			if (idx >= 0) arr.splice(idx, 1);
			else arr.push(itemValue);
			value = arr;
			props.onValueChange?.(arr);
		} else {
			if (value === itemValue) {
				if (collapsible) {
					value = "";
					props.onValueChange?.("");
				}
			} else {
				value = itemValue;
				props.onValueChange?.(itemValue);
			}
		}
	}

	const root = $derived({
		...accordionAnatomy.attrs.root,
		"data-disabled": globalDisabled ? ("" as const) : undefined,
	});

	return {
		get value() {
			return value;
		},
		get root() {
			return root;
		},

		getItem(itemValue: string) {
			const expanded = isExpanded(itemValue);
			return {
				...accordionAnatomy.attrs.item,
				"data-state": expanded ? ("open" as const) : ("closed" as const),
				"data-value": itemValue,
			};
		},

		getTrigger(itemValue: string, disabled?: boolean) {
			const expanded = isExpanded(itemValue);
			const isDisabled = globalDisabled || (disabled ?? false);
			return {
				...accordionAnatomy.attrs.trigger,
				type: "button" as const,
				id: `${id}-trigger-${itemValue}`,
				"aria-expanded": expanded,
				"aria-controls": `${id}-content-${itemValue}`,
				"aria-disabled": isDisabled || undefined,
				"data-state": expanded ? ("open" as const) : ("closed" as const),
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onclick: () => {
					if (!isDisabled) toggle(itemValue);
				},
				onkeydown: (e: KeyboardEvent) => {
					if (isDisabled) return;
					if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
						e.preventDefault();
						toggle(itemValue);
					}
				},
			};
		},

		getContent(itemValue: string) {
			const expanded = isExpanded(itemValue);
			return {
				...accordionAnatomy.attrs.content,
				role: "region" as const,
				id: `${id}-content-${itemValue}`,
				"aria-labelledby": `${id}-trigger-${itemValue}`,
				hidden: !expanded || undefined,
				"data-state": expanded ? ("open" as const) : ("closed" as const),
			};
		},
	};
}
