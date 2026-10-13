<!--
	@file WelcomeView.svelte
	@module @devpulse/domains/app/onboarding/feature/first-run

	Stage 1 — Clyffy's first page. Text from the copy catalog; the buttons
	(in the flow) send intents to Rust.
-->
<script lang="ts">
import { ClyffyMascot } from "$lib/design/blocks/clyffy/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { WelcomeCopy } from "$lib/sys/bindings/copy/index.js";

let { copy }: { copy: WelcomeCopy } = $props();
</script>

<div class="flex flex-col items-center gap-[clamp(0.75rem,2vh,1.5rem)] text-center">
	<div class="aspect-square w-[clamp(6rem,12vw,10rem)]">
		<ClyffyMascot pose="idle" size="full" label={copy.mascot_alt} />
	</div>
	<Heading level={1} size="display">{copy.title}</Heading>
	<Text as="p" size="lg" class="max-w-[42rem]" style="color: var(--text-secondary);">{copy.subtitle}</Text>
</div>
