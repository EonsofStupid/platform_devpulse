<!--
  @file Your AI
  @route /devpulse/settings/ai
  @domain devpulse

  The AI you bring, any time after first run (plan 0001 B3.6): the providers
  domain's cards — installed, version, signed in, the vendor's own Update and
  Sign in, Try it. The page names itself from its route folder.
-->
<script lang="ts">
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { cn, container, stack } from "@devpulse/coldlight/utils";
import { YourProviders } from "$lib/domains/app/providers/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { routeCopy, routeHere } from "$lib/sys/routing/index.js";

const here = $derived(routeHere());
const name = $derived(here ? routeCopy(here)?.label : undefined);
const copy = $derived(copyState.catalog?.onboarding.your_ai ?? null);
</script>

<div class={cn(container({}), "container-md")} data-page="devpulse-settings-ai">
	{#if copy}
		<div class={stack({ gap: "4" })}>
			<div class={stack({ gap: "2" })}>
				<Heading level={1} size="2xl">{name ?? copy.title}</Heading>
				<Text as="p" color="secondary">{copy.subtitle}</Text>
			</div>
			<YourProviders {copy} />
		</div>
	{/if}
</div>
