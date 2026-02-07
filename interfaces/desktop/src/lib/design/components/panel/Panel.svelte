<script lang="ts">
import { getBlueprint } from "$lib/design/blueprints/index.js";
import { cn } from "$lib/design/primitives/types.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import type { DsSurfaceProps } from "$lib/design/recipes/types.js";
import { setPanelComponentContext } from "./context.js";
import type { PanelProps } from "./types.js";

let {
	padding = "md",
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
	class: className,
	...rest
}: PanelProps = $props();

const blueprint = getBlueprint("panel.default");
const defaults = blueprint?.defaultProps ?? {};

const resolvedRecipe = getRecipe(recipeId ?? blueprint?.defaultRecipe ?? "panel.glass.void");

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

const recipeClasses = resolvedRecipe?.classes(resolvedProps) ?? {};

const PADDING_MAP: Record<string, string> = {
	none: "p-0",
	sm: "px-2 py-1.5",
	md: "",
	lg: "px-6 py-5",
};

const paddingOverride = PADDING_MAP[padding] ?? "";

const classes = {
	root: recipeClasses.root ?? "",
	header: paddingOverride
		? cn(recipeClasses.header, paddingOverride)
		: (recipeClasses.header ?? ""),
	body: paddingOverride ? cn(recipeClasses.body, paddingOverride) : (recipeClasses.body ?? ""),
	footer: paddingOverride
		? cn(recipeClasses.footer, paddingOverride)
		: (recipeClasses.footer ?? ""),
};

setPanelComponentContext({ classes });
</script>

<div
	{...rest}
	data-kind="panel"
	data-slot="root"
	class={cn(classes.root, className)}
>
	{@render children?.()}
</div>
