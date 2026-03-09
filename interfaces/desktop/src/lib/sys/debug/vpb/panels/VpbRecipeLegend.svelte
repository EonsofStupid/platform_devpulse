<!--
	@file VPB Recipe Legend — Visual Recipe Preview
	@layer vpb

	Shows all registered recipes for a kind with visual previews.
	Each swatch renders the recipe's shortcode classes with defaults.
-->
<script lang="ts">
	import { getRecipesForKind, type RecipeDefinition, type DsSurfaceProps } from "$lib/design/recipes/index.js";

	let { kind }: { kind: string } = $props();

	const recipes = $derived(getRecipesForKind(kind));

	function previewClasses(recipe: RecipeDefinition): string {
		const classes = recipe.classes?.(recipe.defaults as unknown as DsSurfaceProps) ?? {};
		return classes["root"] ?? classes["content"] ?? Object.values(classes)[0] ?? "";
	}

	function formatLabel(recipe: RecipeDefinition): string {
		return recipe.label ?? recipe.id;
	}
</script>

<div class="vpb-legend">
	<h4 class="vpb-legend__heading">Recipes ({recipes.length})</h4>
	{#if recipes.length === 0}
		<p class="vpb-legend__empty">No recipes registered for "{kind}"</p>
	{:else}
		<div class="vpb-legend__grid">
			{#each recipes as recipe (recipe.id)}
				<div class="vpb-legend__item">
					<div class="vpb-legend__swatch {previewClasses(recipe)}">
						<span class="vpb-legend__swatch-label">{kind}</span>
					</div>
					<div class="vpb-legend__meta">
						<span class="vpb-legend__name">{formatLabel(recipe)}</span>
						<code class="vpb-legend__id">{recipe.id}</code>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.vpb-legend {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.vpb-legend__heading {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--vpb-label-dim);
		margin: 0;
		padding-bottom: 4px;
		border-bottom: 1px solid var(--vpb-border-faint);
	}
	.vpb-legend__empty {
		font-size: 11px;
		color: var(--vpb-label-dim);
		margin: 0;
	}
	.vpb-legend__grid {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.vpb-legend__item {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.vpb-legend__swatch {
		width: 48px;
		height: 32px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border: 1px solid var(--vpb-btn-border);
	}
	.vpb-legend__swatch-label {
		font-size: 8px;
		color: var(--vpb-value-color);
		font-family: monospace;
	}
	.vpb-legend__meta {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.vpb-legend__name {
		font-size: 11px;
		font-weight: 500;
		color: var(--vpb-text-bright);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.vpb-legend__id {
		font-size: 9px;
		font-family: monospace;
		color: var(--vpb-label-dim);
	}
</style>
