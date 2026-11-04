<!--
  @file Memory
  @route /devpulse/settings/memory
  @domain devpulse

  What your agents can remember (plan 0001 B6.2): your own notes, and each
  project's. The page names itself from its route folder.
-->
<script lang="ts">
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { cn, container, stack } from "@devpulse/coldlight/utils";
import { YourMemory } from "#lib/domains/app/memory/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import { routeCopy, routeHere } from "#lib/sys/routing/index.js";

const here = $derived(routeHere());
const name = $derived(here ? routeCopy(here)?.label : undefined);
const copy = $derived(copyState.catalog?.memory ?? null);
</script>

<div class={cn(container({}), "container-md")} data-page="devpulse-settings-memory">
	{#if copy}
		<div class={stack({ gap: "4" })}>
			<div class={stack({ gap: "2" })}>
				<Heading level={1} size="2xl">{name}</Heading>
				<Text as="p" color="secondary">{copy.subtitle}</Text>
			</div>
			<YourMemory {copy} />
		</div>
	{/if}
</div>
