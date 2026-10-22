<!--
	@file Model Loader — your brain, vision, voice and memory models
	@route /model-loader
	@domain models

	The Model Loader panel, restored from 2035d613^ (master plan R4). The
	route composes the domain's panel; the domain owns its logic and state.
	Its header links to Clyffy's cortex, named from that route's folder.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { goto } from "$app/navigation";
import { ModelLoaderPanel } from "$lib/domains/app/models/index.js";
import { hrefOf, routeAt, routeCopy } from "$lib/sys/routing/index.js";

const cortex = routeAt("/cortex");
const cortexCopy = $derived(cortex ? routeCopy(cortex) : undefined);
</script>

<ModelLoaderPanel>
	{#snippet actions()}
		{#if cortex && cortexCopy}
			{@const Icon = cortex.nav.icon}
			<Button
				variant="secondary"
				size="sm"
				title={cortexCopy.blurb ?? undefined}
				onclick={() => goto(hrefOf(cortex))}
			>
				{#if Icon}<Icon size={14} />{/if}
				{cortexCopy.label}
			</Button>
		{/if}
	{/snippet}
</ModelLoaderPanel>
