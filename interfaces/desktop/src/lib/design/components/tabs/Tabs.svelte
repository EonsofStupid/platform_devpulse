<script lang="ts">
import { getBlueprint } from "$lib/design/blueprints/index.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import type { DsSurfaceProps } from "$lib/design/recipes/types.js";
import { createTabs } from "$lib/design/taxonomy/.generated/imports.gen.js";
import { setTabsComponentContext } from "./context.js";
import type { TabsProps } from "./types.js";

let {
	value = $bindable(""),
	orientation = "horizontal",
	activateOnFocus = true,
	loop = true,
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
}: TabsProps = $props();

const blueprint = getBlueprint("tabs.default");
const defaults = blueprint?.defaultProps ?? {};

const transport = createTabs({
	value,
	onValueChange: (v: string) => {
		value = v;
	},
	orientation,
	activateOnFocus,
	loop,
});

$effect(() => {
	transport.states.value = value;
});

const resolvedRecipe = getRecipe(recipeId ?? blueprint?.defaultRecipe ?? "tabs.glass.void");

const resolvedProps: DsSurfaceProps = {
	accent: accent ?? defaults.accent ?? "teal",
	surface: surface ?? defaults.surface ?? "glass",
	variant: variant ?? defaults.variant ?? "void",
	size: size ?? defaults.size ?? "md",
	radius: radius ?? defaults.radius ?? "lg",
	depth: depth ?? defaults.depth ?? 2,
	glow: glow ?? defaults.glow ?? "off",
	bevel: bevel ?? defaults.bevel ?? "off",
};

const classes = resolvedRecipe?.classes(resolvedProps) ?? {};

setTabsComponentContext({ transport, classes });
</script>

{@render children?.()}
