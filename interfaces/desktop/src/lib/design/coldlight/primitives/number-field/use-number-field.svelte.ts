/**
 * useNumberField — ColdLight numeric spinbutton primitive hook.
 *
 * Spinbutton with increment/decrement controls, min/max clamping, step support.
 * Parts: root (group), input (spinbutton), increment (button), decrement (button).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import { createIds } from "../../_internal/utils/uid.js";
import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { numberFieldAnatomy } from "./number-field.anatomy.js";
import type { UseNumberFieldProps, UseNumberFieldReturn } from "./number-field.types.js";

export function useNumberField(props: UseNumberFieldProps = {}): UseNumberFieldReturn {
	const ids = createIds("number-field", ["root", "input", "increment", "decrement"] as const);

	const min = $derived(props.min ?? -Infinity);
	const max = $derived(props.max ?? Infinity);
	const step = $derived(props.step ?? 1);
	const disabled = $derived(props.disabled ?? false);
	const readOnly = $derived(props.readonly ?? false);

	let value = $state(props.value ?? 0);

	function clamp(v: number): number {
		return Math.min(max, Math.max(min, v));
	}

	const canIncrement = $derived(!disabled && !readOnly && value < max);
	const canDecrement = $derived(!disabled && !readOnly && value > min);

	function doIncrement(): void {
		if (!canIncrement) return;
		value = clamp(value + step);
		props.onValueChange?.(value);
	}

	function doDecrement(): void {
		if (!canDecrement) return;
		value = clamp(value - step);
		props.onValueChange?.(value);
	}

	const root = $derived({
		...numberFieldAnatomy.attrs.root,
		id: ids.root,
		role: "group" as const,
		"aria-label": props["aria-label"],
		"data-disabled": dataAttr(disabled),
	});

	const input = $derived({
		...numberFieldAnatomy.attrs.input,
		id: ids.input,
		role: "spinbutton" as const,
		type: "text" as const,
		inputmode: "numeric" as const,
		value,
		"aria-valuenow": value,
		"aria-valuemin": min === -Infinity ? undefined : min,
		"aria-valuemax": max === Infinity ? undefined : max,
		"aria-valuetext": props.valueText || undefined,
		"aria-disabled": disabledAttr(disabled),
		"aria-readonly": readOnly ? (true as const) : undefined,
		"aria-required": props.required ? (true as const) : undefined,
		"aria-describedby": props["aria-describedby"],
		disabled: disabled || undefined,
		readonly: readOnly || undefined,
		"data-disabled": dataAttr(disabled),
		oninput: (e: Event) => {
			if (readOnly) return;
			const parsed = parseFloat((e.target as HTMLInputElement).value);
			if (!Number.isNaN(parsed)) {
				value = clamp(parsed);
				props.onValueChange?.(value);
			}
		},
		onkeydown: (e: KeyboardEvent) => {
			if (disabled || readOnly) return;
			if (e.key === kbd.ARROW_UP) { e.preventDefault(); doIncrement(); }
			else if (e.key === kbd.ARROW_DOWN) { e.preventDefault(); doDecrement(); }
			else if (e.key === kbd.HOME && min !== -Infinity) { e.preventDefault(); value = min; props.onValueChange?.(value); }
			else if (e.key === kbd.END && max !== Infinity) { e.preventDefault(); value = max; props.onValueChange?.(value); }
		},
	});

	const increment = $derived({
		...numberFieldAnatomy.attrs.increment,
		id: ids.increment,
		type: "button" as const,
		tabindex: -1 as const,
		"aria-label": "Increase value" as const,
		"aria-disabled": disabledAttr(!canIncrement),
		"data-disabled": dataAttr(!canIncrement),
		onclick: () => doIncrement(),
	});

	const decrement = $derived({
		...numberFieldAnatomy.attrs.decrement,
		id: ids.decrement,
		type: "button" as const,
		tabindex: -1 as const,
		"aria-label": "Decrease value" as const,
		"aria-disabled": disabledAttr(!canDecrement),
		"data-disabled": dataAttr(!canDecrement),
		onclick: () => doDecrement(),
	});

	return {
		get value() { return value; },
		get canIncrement() { return canIncrement; },
		get canDecrement() { return canDecrement; },
		get root() { return root; },
		get input() { return input; },
		get increment() { return increment; },
		get decrement() { return decrement; },
		incrementValue: doIncrement,
		decrementValue: doDecrement,
	};
}
