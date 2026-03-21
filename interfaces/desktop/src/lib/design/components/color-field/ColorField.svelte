<!--
	@component ColorField (Root)
	@kind color-field
	@layer components

	Text input for editing color values — hex or per-channel.
	Svelte 5 runes: $state for internal value, $effect for controlled sync,
	$derived for reactive recipe classes and validation.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
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
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	children,
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

// ── Recipe (reactive) ───────────────────────────────────────────
const recipe = getRecipe("color-field.glass.void");
const recipeClasses = $derived(
	// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
	recipe?.classes?.({} as any) ?? {},
);

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
	get classes() { return recipeClasses; },
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

// ── Visual ──────────────────────────────────────────────────────
const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "md",
}));

const rootClasses = $derived(
	cn(recipeClasses.root, visual.segments, visual.radius, className),
);
</script>

<div
	id={resolvedIds.root}
	{dir}
	data-kind="color-field"
	data-slot="root"
	data-invalid={isInvalid || undefined}
	data-disabled={isDisabled || undefined}
	data-readonly={isReadOnly || undefined}
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	{...rest}
>
	{@render children?.()}
</div>
