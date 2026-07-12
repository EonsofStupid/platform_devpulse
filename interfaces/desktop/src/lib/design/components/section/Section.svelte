<!--
	@component Section
	@kind section
	@layer component
	@category structural
	@description Accent-scoped content section — the authored-once layout unit. Rebinds the --accent-section-* role trio from a named accent, owns the header (accent edge, uppercase title, blurb, actions) and the body rhythm via fluid (cqi) padding tokens. Everything inside brings its own chrome (Cards, tiles, grids) and reads the section's accent trio.
	@container false
	@compound false
	@defaultStyle section-default
	@styleIds section-default
	@slots root:none
	@defaults {
		"background-color": "transparent",
		"box-shadow": "none",
		"border-width": "0",
		"color": "inherit"
	}

	Extracted from the devtools dashboard's one-off `.ds-section` vocabulary
	(the `--accent-section-*` trio convention) so a second dashboard never
	re-hand-authors it. Layout + accent context by default — the inert
	@defaults keep the surface transparent, but the kind participates in
	renderForge so a skinned section preset can land later without a
	component change. Children bring their own chrome, per
	COMPOSITION-CONTRACT.md.
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { PresetId, SemanticIntent } from "$lib/design/visual/preset-id.js";
import type { SectionProps } from "./section.types.js";

let {
	title,
	blurb,
	accent = "primary",
	preset = "default" as SemanticIntent | PresetId,
	container,
	actions,
	children,
	class: className,
	...rest
}: SectionProps = $props();

// "default" resolves this component's emitted inert @defaults
// (--style-section-default-*) — transparent surface, no chrome.
const m = $derived(renderForge({ kind: "section", preset }));

// Rebind the section-scoped accent role trio from the named accent,
// appended to renderForge's cssVars on the same style attribute.
const styleVars = $derived(
	[
		cssVarString(m.cssVars),
		`--accent-section-main: var(--accent-${accent}-main)`,
		`--accent-section-glow: var(--accent-${accent}-glow)`,
		`--accent-section-fill: var(--accent-${accent}-fill)`,
		container ? `container: ${container} / inline-size` : "",
	]
		.filter(Boolean)
		.join(";"),
);
</script>

<section
	{...m.dataAttrs}
	data-slot="section"
	data-accent={accent}
	style={styleVars}
	class={cn("cl-section", className)}
	{...rest}
>
	{#if title || blurb || actions}
		<header class="cl-section__header">
			<div class="cl-section__heading">
				{#if title}<h2 class="cl-section__title">{title}</h2>{/if}
				{#if blurb}<p class="cl-section__blurb">{blurb}</p>{/if}
			</div>
			{#if actions}<div class="cl-section__actions">{@render actions()}</div>{/if}
		</header>
	{/if}
	{@render children()}
</section>

<style>
	/* Rhythm rides the fluid (cqi) padding tokens — inside a container
	   seam the section scales with its zone; the clamp floors keep it
	   sane where a seam hasn't landed yet. */
	.cl-section {
		display: flex;
		flex-direction: column;
		gap: var(--padding-sm-y);
		min-width: 0;
	}

	.cl-section__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--padding-sm-x);
		border-left: var(--border-width-thin) solid var(--accent-section-main);
		padding-left: var(--padding-sm-x);
	}

	.cl-section__heading {
		display: flex;
		align-items: baseline;
		gap: var(--padding-sm-x);
		min-width: 0;
	}

	.cl-section__title {
		margin: 0;
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--accent-section-main);
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.cl-section__blurb {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
	}

	.cl-section__actions {
		display: flex;
		align-items: center;
		gap: var(--padding-xs-x);
	}
</style>
