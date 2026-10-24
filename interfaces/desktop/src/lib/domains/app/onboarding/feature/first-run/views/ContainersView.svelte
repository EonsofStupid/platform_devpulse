<!--
	@file ContainersView.svelte
	@module @devpulse/domains/app/onboarding/feature/first-run

	Stage 3b — your dev environment (plan 0001): the containers domain's setup,
	under the stage's heading. Optional: you can continue without it and come
	back from Settings → Run setup again.
-->
<script lang="ts">
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { ContainersSetup } from "$lib/domains/app/containers/index.js";
import type { ContainersCopy } from "$lib/sys/bindings/copy/index.js";

let { copy }: { copy: ContainersCopy } = $props();
</script>

<div class="flex flex-col gap-[clamp(1rem,2.5vh,1.75rem)]">
	<div class="flex flex-col gap-[var(--space-2)]">
		<Heading level={1} size="2xl">{copy.title}</Heading>
		<Text as="p" size="base" color="secondary">{copy.subtitle}</Text>
	</div>
	<ContainersSetup {copy} />
</div>
