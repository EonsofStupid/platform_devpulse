/**
 * useColorField — ColdLight color field primitive hook.
 *
 * Text input for hex color entry with a swatch preview.
 * Parts: root, input (native text), label, swatch (preview).
 *
 * @example
 * ```svelte
 * <script>
 *   import { useColorField } from '$lib/design/coldlight';
 *   const color = useColorField({ value: '#00ffcc' });
 * </script>
 * <div {...color.root}>
 *   <label {...color.label}>Color</label>
 *   <div {...color.swatch} style:background={color.value}></div>
 *   <input {...color.input} />
 * </div>
 * ```
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { createIds } from "../../_internal/utils/uid.js";
import { colorFieldAnatomy } from "./color-field.anatomy.js";
import type { UseColorFieldProps, UseColorFieldReturn } from "./color-field.types.js";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
/** Default color value for uncontrolled color fields (black). */
const DEFAULT_COLOR = `#${"0".repeat(6)}`;

export function useColorField(props: UseColorFieldProps = {}): UseColorFieldReturn {
	const ids = createIds("color-field", ["root", "input", "label", "swatch"] as const);

	// ── State ────────────────────────────────────────────────────
	let value = $state(props.value ?? DEFAULT_COLOR);
	const disabled = $derived(props.disabled ?? false);
	const readOnly = $derived(props.readOnly ?? false);
	const isValid = $derived(HEX_RE.test(value));

	function doSetValue(v: string): void {
		value = v;
		props.onValueChange?.(v);
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...colorFieldAnatomy.attrs.root,
		id: ids.root,
		"data-disabled": dataAttr(disabled),
		"data-invalid": !isValid ? ("" as const) : undefined,
	});

	const input = $derived({
		...colorFieldAnatomy.attrs.input,
		id: ids.input,
		type: "text" as const,
		value,
		placeholder: props.placeholder ?? DEFAULT_COLOR,
		disabled: disabled || undefined,
		readonly: readOnly || undefined,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-label"] ? undefined : (props["aria-labelledby"] ?? ids.label),
		"aria-invalid": !isValid ? (true as const) : undefined,
		"aria-disabled": disabledAttr(disabled),
		"data-disabled": dataAttr(disabled),
		oninput: (e: Event) => {
			const target = e.target as HTMLInputElement;
			doSetValue(target.value);
		},
	});

	const label = $derived({
		...colorFieldAnatomy.attrs.label,
		id: ids.label,
		for: ids.input,
		"data-disabled": dataAttr(disabled),
	});

	const swatch = $derived({
		...colorFieldAnatomy.attrs.swatch,
		id: ids.swatch,
		"aria-hidden": "true" as const,
		"data-valid": dataAttr(isValid),
		style: isValid ? `background-color:${value}` : undefined,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get value() {
			return value;
		},
		get isValid() {
			return isValid;
		},
		get root() {
			return root;
		},
		get input() {
			return input;
		},
		get label() {
			return label;
		},
		get swatch() {
			return swatch;
		},
		setValue: doSetValue,
	};
}
