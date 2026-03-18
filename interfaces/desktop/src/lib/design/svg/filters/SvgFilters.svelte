<!--
	@component SvgFilters
	@file design/svg/filters/SvgFilters.svelte
	@layer svg
	@package @devpulse/coldlight

	Hidden SVG element containing all registered SVG filter definitions.
	Mount ONCE in root +layout.svelte. All filters referenced by CSS:
	  filter: url(#bevel-soft);

	Reads the filter registry and renders <filter> elements with their
	step chains via <svelte:element> for data-driven SVG generation.

	Performance: This SVG is invisible — zero paint cost.
	Filters only incur GPU cost when an element references them.
-->
<script lang="ts">
import { getAllFilters } from "./registry.js";
// Side-effect: register all filter definitions
import "./definitions/index.js";

const filters = getAllFilters();
</script>

<svg
	aria-hidden="true"
	style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;"
	xmlns="http://www.w3.org/2000/svg"
>
	<defs>
		{#each filters as filterDef (filterDef.id)}
			{@const margin = filterDef.filterMargin ?? 10}
			<filter
				id={filterDef.id}
				filterUnits={filterDef.filterUnits ?? "objectBoundingBox"}
				x={`-${margin}%`}
				y={`-${margin}%`}
				width={`${100 + margin * 2}%`}
				height={`${100 + margin * 2}%`}
			>
				{#each filterDef.steps as step, stepIdx (stepIdx)}
					<svelte:element
						this={step.primitive}
						{...step.attrs}
						result={step.result}
						in={step.in}
						in2={step.in2}
					>
						{#if step.children}
							{#each step.children as child, childIdx (childIdx)}
								<svelte:element this={child.tag} {...child.attrs} />
							{/each}
						{/if}
					</svelte:element>
				{/each}
			</filter>
		{/each}
	</defs>
</svg>
