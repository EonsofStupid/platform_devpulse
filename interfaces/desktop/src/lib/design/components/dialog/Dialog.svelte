<script lang="ts">
	import type { DialogProps } from "./types.js";
	import { setDialogComponentContext } from "./context.js";
	import { createDialog } from "$lib/design/taxonomy/.generated/imports.gen.js";
	import { getRecipe } from "$lib/design/recipes/index.js";
	import { getBlueprint } from "$lib/design/blueprints/index.js";
	import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

	let {
		open = $bindable(false),
		defaultOpen,
		closeOnEscape = true,
		closeOnOutsideClick = true,
		preventScroll = true,
		recipe: recipeId,
		accent, surface, variant, size, radius, depth, glow, bevel,
		children,
	}: DialogProps = $props();

	const blueprint = getBlueprint("dialog.default");
	const defaults = blueprint?.defaultProps ?? {};

	const transport = createDialog({
		open: defaultOpen ?? open,
		onOpenChange: (v: boolean) => { open = v; },
		closeOnEscape,
		closeOnOutsideClick,
		preventScroll,
	});

	// Prop → transport (consumer sets open programmatically)
	$effect(() => { transport.states.open = open; });

	const resolvedRecipe = getRecipe(recipeId ?? blueprint?.defaultRecipe ?? "dialog.glass.void");

	const resolvedProps: DsSurfaceProps = {
		accent: accent ?? defaults.accent ?? "teal",
		surface: surface ?? defaults.surface ?? "glass",
		variant: variant ?? defaults.variant ?? "void",
		size: size ?? defaults.size ?? "md",
		radius: radius ?? defaults.radius ?? "lg",
		depth: depth ?? defaults.depth ?? 3,
		glow: glow ?? defaults.glow ?? "teal",
		bevel: bevel ?? defaults.bevel ?? "soft",
	};

	const classes = resolvedRecipe?.classes(resolvedProps) ?? {};

	setDialogComponentContext({ transport, classes });
</script>

{@render children?.()}
