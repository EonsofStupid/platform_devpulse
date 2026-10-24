/**
 * useRadioGroup — ColdLight radio group primitive hook.
 *
 * Roving tabindex across radio items with arrow key navigation.
 * Parts: root (radiogroup), radio (parameterized), label (parameterized), description (parameterized).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * @example
 * ```svelte
 * <script>
 *   import { useRadioGroup } from '#coldlight/coldlight';
 *   const radio = useRadioGroup({ value: 'a', onValueChange: (v) => console.log(v) });
 * </script>
 * <div {...radio.root}>
 *   {#each ['a', 'b', 'c'] as opt}
 *     <div {...radio.getRadio(opt)}>
 *       <span {...radio.getLabel(opt)}>{opt}</span>
 *     </div>
 *   {/each}
 * </div>
 * ```
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { uid } from "../../_internal/utils/uid.js";
import { radioGroupAnatomy } from "./radio-group.anatomy.js";
import type { UseRadioGroupProps, UseRadioGroupReturn } from "./radio-group.types.js";

export function useRadioGroup(props: UseRadioGroupProps = {}): UseRadioGroupReturn {
	const id = uid("radio-group");
	const orientation = props.orientation ?? "vertical";
	const loop = props.loop ?? true;

	// ── State ────────────────────────────────────────────────────
	let value = $state(props.value ?? "");
	const disabled = $derived(props.disabled ?? false);

	function doSetValue(v: string): void {
		if (v === value || disabled) return;
		value = v;
		props.onValueChange?.(v);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return;

		const isVertical = orientation === "vertical";
		const nextKey = isVertical ? kbd.ARROW_DOWN : kbd.ARROW_RIGHT;
		const prevKey = isVertical ? kbd.ARROW_UP : kbd.ARROW_LEFT;

		if (e.key !== nextKey && e.key !== prevKey) return;
		e.preventDefault();

		const target = e.currentTarget as HTMLElement;
		const group = target.closest('[role="radiogroup"]');
		if (!group) return;

		const enabledRadios = Array.from(
			group.querySelectorAll<HTMLElement>('[role="radio"]:not([data-disabled])'),
		);
		if (enabledRadios.length === 0) return;

		const currentIndex = enabledRadios.indexOf(target);
		let nextIndex: number;

		if (currentIndex === -1) {
			nextIndex = 0;
		} else if (e.key === nextKey) {
			nextIndex = currentIndex + 1;
			if (nextIndex >= enabledRadios.length) nextIndex = loop ? 0 : currentIndex;
		} else {
			nextIndex = currentIndex - 1;
			if (nextIndex < 0) nextIndex = loop ? enabledRadios.length - 1 : currentIndex;
		}

		const nextRadio = enabledRadios[nextIndex];
		if (!nextRadio) return;

		nextRadio.focus();
		const radioValue = nextRadio.getAttribute("data-value");
		if (radioValue) doSetValue(radioValue);
	}

	// ── Root attributes ──────────────────────────────────────────
	const root = $derived({
		...radioGroupAnatomy.attrs.root,
		id,
		role: "radiogroup" as const,
		"aria-orientation": orientation,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"aria-required": props.required ? (true as const) : undefined,
		"aria-disabled": disabledAttr(disabled),
		"data-orientation": orientation,
		"data-disabled": dataAttr(disabled),
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get value() {
			return value;
		},
		get root() {
			return root;
		},

		getRadio(radioValue: string, itemDisabled?: boolean) {
			const isChecked = radioValue === value;
			const isItemDisabled = disabled || (itemDisabled ?? false);
			const noSelection = value === "";
			return {
				...radioGroupAnatomy.attrs.radio,
				role: "radio" as const,
				id: `${id}-radio-${radioValue}`,
				tabindex: isChecked ? 0 : noSelection && !isItemDisabled ? 0 : -1,
				"aria-checked": isChecked,
				"aria-disabled": disabledAttr(isItemDisabled),
				"aria-labelledby": `${id}-label-${radioValue}`,
				"aria-describedby": `${id}-desc-${radioValue}`,
				"data-state": isChecked ? ("checked" as const) : ("unchecked" as const),
				"data-value": radioValue,
				"data-disabled": dataAttr(isItemDisabled),
				onclick: () => {
					if (!isItemDisabled) doSetValue(radioValue);
				},
				onkeydown: (e: KeyboardEvent) => {
					if (e.key === kbd.SPACE) {
						e.preventDefault();
						if (!isItemDisabled) doSetValue(radioValue);
						return;
					}
					handleKeydown(e);
				},
			};
		},

		getLabel(radioValue: string) {
			return {
				...radioGroupAnatomy.attrs.label,
				id: `${id}-label-${radioValue}`,
				onclick: () => {
					if (disabled) return;
					const radio = document.getElementById(`${id}-radio-${radioValue}`);
					radio?.click();
					radio?.focus();
				},
			};
		},

		getDescription(radioValue: string) {
			return {
				...radioGroupAnatomy.attrs.description,
				id: `${id}-desc-${radioValue}`,
			};
		},

		setValue: doSetValue,
	};
}
