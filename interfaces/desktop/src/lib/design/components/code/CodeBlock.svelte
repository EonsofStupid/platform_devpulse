<!--
	@component CodeBlock (Root)
	@kind code
	@layer components

	ColdLight CodeBlock Root — compound code display container.
	Sets context for sub-components (Header, Content, CopyButton).
	Shiki integration point: consumer renders Shiki output inside Content.

	API follows Ark UI / Zag conventions:
	  - ids for composition
	  - dir for RTL
	  - disabled state
	  - onCopy callback with details
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setCodeBlockContext } from "./context.js";
import type { CodeBlockRootProps } from "./types.js";

let {
	ids,
	language,
	filename,
	lineNumbers = false,
	highlightLines,
	dir = "ltr",
	disabled = false,
	onCopy,
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
}: CodeBlockRootProps = $props();

const recipe = getRecipe("code.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = recipe?.classes?.({} as any) ?? {};

function copyCode(value?: string) {
	if (disabled) return;
	const text = value ?? "";
	if (text) {
		navigator.clipboard.writeText(text);
		onCopy?.({ value: text });
	}
}

setCodeBlockContext({
	get classes() { return recipeClasses; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get language() { return language; },
	get filename() { return filename; },
	get lineNumbers() { return lineNumbers; },
	get disabled() { return disabled; },
	copyCode,
});

const visual = useColdLight(() => ({
	preset: preset ?? "code-block",
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
	cn(
		recipeClasses.root,
		visual.segments,
		visual.radius,
		disabled ? "opacity-60" : undefined,
		className,
	),
);
</script>

<div
	id={ids?.root}
	{dir}
	data-kind="code"
	data-slot="root"
	data-language={language || undefined}
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	{...rest}
>
	{@render children?.()}
</div>
