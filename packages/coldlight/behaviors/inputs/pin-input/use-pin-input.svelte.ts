/**
 * usePinInput — ColdLight segmented code entry primitive hook.
 *
 * Svelte 5 runes-native. Exposes a group role plus a per-cell factory
 * that hands back typed input attributes, keyboard handlers, and
 * paste auto-distribution logic.
 *
 * Behaviour follows the same interaction model as common pin-input
 * implementations (React Aria, Spectrum-style patterns, Zag.js):
 *
 * - Printable character → write current cell, advance focus
 * - Backspace on empty → clear previous cell and focus it
 * - Backspace on filled → clear current cell, stay
 * - Delete → clear current cell, stay
 * - ArrowLeft / ArrowRight → move focus one cell
 * - Home / End → jump to first / last cell
 * - Paste anywhere → distribute pasted characters from the focused cell
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/textbox/
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { createIds, uid } from "../../_internal/utils/uid.js";
import { pinInputAnatomy } from "./pin-input.anatomy.js";
import type {
	PinInputCellAttrs,
	PinInputType,
	UsePinInputProps,
	UsePinInputReturn,
} from "./pin-input.types.js";

const TYPE_PATTERNS: Record<PinInputType, RegExp> = {
	numeric: /^[0-9]$/,
	alphanumeric: /^[a-zA-Z0-9]$/,
	alphabetic: /^[a-zA-Z]$/,
};

function sanitise(raw: string, type: PinInputType): string {
	const pattern = new RegExp(TYPE_PATTERNS[type].source.replace("^", "").replace("$", ""), "g");
	return (raw.match(pattern) ?? []).join("");
}

export function usePinInput(props: UsePinInputProps = {}): UsePinInputReturn {
	const length = Math.max(1, props.length ?? 4);
	const type = props.type ?? "numeric";
	const mask = props.mask ?? false;
	const placeholder = props.placeholder ?? "\u25CB";
	const otp = props.otp ?? type === "numeric";
	const ids = createIds("pin-input", ["root", "label"] as const);
	const cellIdBase = uid("pin-input-cell");

	// ── Reactive state ──────────────────────────────────────────
	let cells = $state<string[]>(normalizeValue(props.value ?? ""));
	const disabled = $derived(props.disabled ?? false);
	const joined = $derived(cells.join(""));
	const isComplete = $derived(joined.length === length);

	function normalizeValue(raw: string): string[] {
		const clean = sanitise(raw, type).slice(0, length);
		const next = new Array<string>(length).fill("");
		for (let i = 0; i < clean.length; i++) next[i] = clean[i];
		return next;
	}

	function cellId(i: number): string {
		return `${cellIdBase}-${i}`;
	}

	function cellElement(i: number): HTMLInputElement | null {
		return typeof document === "undefined"
			? null
			: (document.getElementById(cellId(i)) as HTMLInputElement | null);
	}

	function doFocus(i: number): void {
		const target = Math.max(0, Math.min(length - 1, i));
		const el = cellElement(target);
		if (el) {
			el.focus();
			el.select();
		}
	}

	function emit(): void {
		props.onValueChange?.(joined);
		if (isComplete) props.onComplete?.(joined);
	}

	function doSetValue(raw: string): void {
		cells = normalizeValue(raw);
		emit();
	}

	function doClear(): void {
		cells = new Array<string>(length).fill("");
		emit();
		doFocus(0);
	}

	// ── Per-cell event handlers ─────────────────────────────────
	function onCellInput(index: number, e: Event): void {
		if (disabled) return;
		const target = e.target as HTMLInputElement;
		const raw = target.value;

		// Browsers sometimes deliver paste events here with multiple chars.
		if (raw.length > 1) {
			distributeFrom(index, raw);
			target.value = cells[index] ?? "";
			return;
		}

		if (raw === "") {
			cells[index] = "";
			emit();
			return;
		}

		if (!TYPE_PATTERNS[type].test(raw)) {
			target.value = cells[index] ?? "";
			return;
		}

		cells[index] = raw;
		emit();
		if (index < length - 1) doFocus(index + 1);
	}

	function onCellKeydown(index: number, e: KeyboardEvent): void {
		if (disabled) return;

		switch (e.key) {
			case "Backspace": {
				e.preventDefault();
				if (cells[index]) {
					cells[index] = "";
					emit();
					return;
				}
				if (index > 0) {
					cells[index - 1] = "";
					emit();
					doFocus(index - 1);
				}
				return;
			}
			case "Delete": {
				e.preventDefault();
				if (cells[index]) {
					cells[index] = "";
					emit();
				}
				return;
			}
			case "ArrowLeft": {
				e.preventDefault();
				if (index > 0) doFocus(index - 1);
				return;
			}
			case "ArrowRight": {
				e.preventDefault();
				if (index < length - 1) doFocus(index + 1);
				return;
			}
			case "Home": {
				e.preventDefault();
				doFocus(0);
				return;
			}
			case "End": {
				e.preventDefault();
				doFocus(length - 1);
				return;
			}
			default:
				return;
		}
	}

	function onCellPaste(index: number, e: ClipboardEvent): void {
		if (disabled) return;
		const raw = e.clipboardData?.getData("text") ?? "";
		if (!raw) return;
		e.preventDefault();
		distributeFrom(index, raw);
	}

	function onCellFocus(_index: number, e: FocusEvent): void {
		const el = e.currentTarget as HTMLInputElement;
		// Select any existing content so the next character overwrites.
		requestAnimationFrame(() => el.select());
	}

	function distributeFrom(startIndex: number, raw: string): void {
		const chars = sanitise(raw, type);
		if (!chars) return;
		let cursor = startIndex;
		for (const ch of chars) {
			if (cursor >= length) break;
			cells[cursor] = ch;
			cursor += 1;
		}
		emit();
		doFocus(Math.min(length - 1, cursor));
	}

	// ── Slot attributes ─────────────────────────────────────────
	const root = $derived({
		...pinInputAnatomy.attrs.root,
		id: ids.root,
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-labelledby"],
		"aria-disabled": disabledAttr(disabled),
		"data-disabled": dataAttr(disabled),
		"data-complete": isComplete ? ("" as const) : undefined,
	});

	const label = $derived({
		...pinInputAnatomy.attrs.label,
		id: ids.label,
		"data-disabled": dataAttr(disabled),
	});

	function cell(index: number): PinInputCellAttrs {
		const filled = (cells[index] ?? "") !== "";
		const displayValue = mask && filled ? "\u2022" : (cells[index] ?? "");
		return {
			...pinInputAnatomy.attrs.cell,
			id: cellId(index),
			type: mask ? "password" : "text",
			inputmode: type === "numeric" ? "numeric" : "text",
			pattern: type === "numeric" ? "[0-9]*" : undefined,
			autocomplete: otp ? "one-time-code" : "off",
			autocorrect: "off",
			spellcheck: false,
			maxlength: 1,
			value: displayValue,
			placeholder,
			disabled,
			"aria-label": `Digit ${index + 1} of ${length}`,
			"aria-disabled": disabledAttr(disabled),
			"data-index": index,
			"data-filled": filled ? ("" as const) : undefined,
			"data-disabled": dataAttr(disabled),
			oninput: (e: Event) => onCellInput(index, e),
			onkeydown: (e: KeyboardEvent) => onCellKeydown(index, e),
			onpaste: (e: ClipboardEvent) => onCellPaste(index, e),
			onfocus: (e: FocusEvent) => onCellFocus(index, e),
		} satisfies PinInputCellAttrs;
	}

	// ── Public API ──────────────────────────────────────────────
	return {
		get value() {
			return joined;
		},
		get isComplete() {
			return isComplete;
		},
		get root() {
			return root;
		},
		get label() {
			return label;
		},
		cell,
		setValue: doSetValue,
		clear: doClear,
		focus: doFocus,
	};
}
