<script lang="ts" generics="T">
import { getBlueprint } from "$lib/design/blueprints/index.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import type { DsSurfaceProps } from "$lib/design/recipes/types.js";
import { createCombobox } from "$lib/design/taxonomy/.generated/imports.gen.js";
import { setComboboxComponentContext } from "./context.js";
import type { ComboboxProps } from "./types.js";

let {
	open = $bindable(false),
	value = $bindable<T>(),
	inputValue = $bindable(""),
	closeOnEscape = true,
	closeOnOutsideClick = true,
	sameWidth = true,
	recipe: recipeId,
	accent,
	surface,
	variant,
	size,
	radius,
	depth,
	glow,
	bevel,
	children,
}: ComboboxProps<T> = $props();

const blueprint = getBlueprint("combobox.default");
const defaults = blueprint?.defaultProps ?? {};

const transport = createCombobox<T>({
	open,
	onOpenChange: (v: boolean) => {
		open = v;
	},
	value,
	onValueChange: (v: T | undefined) => {
		value = v as T;
	},
	inputValue,
	onInputValueChange: (v: string) => {
		inputValue = v;
	},
	closeOnEscape,
	closeOnOutsideClick,
	sameWidth,
});

$effect(() => {
	transport.states.open = open;
});
$effect(() => {
	transport.states.value = value;
});
$effect(() => {
	transport.states.inputValue = inputValue;
});

const resolvedRecipe = getRecipe(recipeId ?? blueprint?.defaultRecipe ?? "combobox.glass.void");

const resolvedProps: DsSurfaceProps = {
	accent: accent ?? defaults.accent ?? "teal",
	surface: surface ?? defaults.surface ?? "glass",
	variant: variant ?? defaults.variant ?? "void",
	size: size ?? defaults.size ?? "md",
	radius: radius ?? defaults.radius ?? "lg",
	depth: depth ?? defaults.depth ?? 2,
	glow: glow ?? defaults.glow ?? "teal",
	bevel: bevel ?? defaults.bevel ?? "soft",
};

const classes = resolvedRecipe?.classes(resolvedProps) ?? {};

setComboboxComponentContext({ transport, classes });
</script>

{@render children?.()}
