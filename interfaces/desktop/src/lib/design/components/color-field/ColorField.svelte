<!--
	@component Color Field
	@kind color-field
	@layer component
	@category interactive
	@description Text input for entering and editing color values in hex, RGB, or HSL notation
	@container false
	@compound true
	@blockCategory form
	@defaultStyle color-field-default
	@styleIds color-field-default
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, input:none, swatch:none, label:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { setColorFieldContext } from "./context.js";
import type { ColorFieldRootProps } from "./types.js";

let {
	ids: userIds,
	size = "md",
	channel,
	colorSpace,
	isWheelDisabled = false,
	value: controlledValue,
	defaultValue = null,
	onChange,
	isDisabled = false,
	isReadOnly = false,
	isRequired = false,
	isInvalid: controlledInvalid = false,
	validate,
	validationBehavior = "native",
	placeholder = "",
	autoFocus = false,
	dir = "ltr",
	form,
	name,
	children,
	intent = "default",
	class: className,
	...rest
}: ColorFieldRootProps = $props();

// ── Auto-generated IDs with user overrides ──────────────────────
const autoIds = createIds("color-field", ["root", "input", "label", "description", "errorMessage"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	input: userIds?.input ?? autoIds.input,
	label: userIds?.label ?? autoIds.label,
	description: userIds?.description ?? autoIds.description,
	errorMessage: userIds?.errorMessage ?? autoIds.errorMessage,
});

// ── Controlled / uncontrolled value ─────────────────────────────
let internalValue = $state<string | null>(defaultValue);

$effect(() => {
	if (controlledValue !== undefined) {
		internalValue = controlledValue;
	}
});

const currentValue = $derived(controlledValue !== undefined ? controlledValue : internalValue);

// ── Validation ──────────────────────────────────────────────────
const validationError = $derived(() => {
	if (controlledInvalid) return null;
	if (!validate) return null;
	return validate(currentValue) ?? null;
});

const isInvalid = $derived(controlledInvalid || validationError() !== null);

// ── Slot registration (conditional aria refs) ───────────────────
let hasDescription = $state(false);
let hasError = $state(false);

function registerDescription() { hasDescription = true; }
function registerError() { hasError = true; }

// ── Value mutation ──────────────────────────────────────────────
function setValue(raw: string) {
	if (isDisabled || isReadOnly) return;
	const val = raw || null;
	internalValue = val;
	onChange?.({ value: val });
}


// ── Context ─────────────────────────────────────────────────────
setColorFieldContext({
	get value() { return currentValue; },
	get channel() { return channel; },
	get colorSpace() { return colorSpace; },
	get size() { return size; },
	get isDisabled() { return isDisabled; },
	get isReadOnly() { return isReadOnly; },
	get isRequired() { return isRequired; },
	get isInvalid() { return isInvalid; },
	get validationError() { return validationError(); },
	get dir() { return dir; },
	get placeholder() { return placeholder; },
	get name() { return name; },
	get form() { return form; },
	get ids() { return resolvedIds; },
	get hasDescription() { return hasDescription; },
	get hasError() { return hasError; },
	setValue,
	registerDescription,
	registerError,
});

</script>

<StyleMacro kind="color-field" intent={intent}>
	<div
		id={resolvedIds.root}
		{dir}
		data-kind="color-field"
		data-slot="root"
		data-invalid={isInvalid || undefined}
		data-disabled={isDisabled || undefined}
		data-readonly={isReadOnly || undefined}
		class={cn(className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
