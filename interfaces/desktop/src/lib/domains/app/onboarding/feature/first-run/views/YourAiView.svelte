<!--
	@file YourAiView.svelte
	@module @devpulse/domains/app/onboarding/feature/first-run

	Stage 3 — your AI (plan 0001): the providers domain's cards under the
	stage's heading. Optional: you can continue without it and come back from
	Settings → Your AI.
-->
<script lang="ts">
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { YourProviders } from "$lib/domains/app/providers/index.js";
import type { YourAiCopy } from "$lib/sys/bindings/copy/index.js";

let { copy }: { copy: YourAiCopy } = $props();
</script>

<div class="flex flex-col gap-[clamp(1rem,2.5vh,1.75rem)]">
	<div class="flex flex-col gap-[var(--space-2)]">
		<Heading level={1} size="2xl">{copy.title}</Heading>
		<Text as="p" size="base" color="secondary">{copy.subtitle}</Text>
	</div>
	<YourProviders {copy} />
	<Text size="sm" color="muted">{copy.later_hint}</Text>
</div>
