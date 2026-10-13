<!--
	@file WelcomeView.svelte
	@module @devpulse/domains/app/onboarding/feature/first-run

	Stage 1 — Clyffy's first page. While Rust looks around this machine the
	view says so; then it shows a chip for each thing really found (your git
	identity, folders that hold repositories). Text from the copy catalog;
	the buttons (in the flow) send intents to Rust.
-->
<script lang="ts">
import { ClyffyMascot } from "$lib/design/blocks/clyffy/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { WelcomeCopy } from "$lib/sys/bindings/copy/index.js";
import type { Detected } from "$lib/sys/bindings/onboarding/index.js";
import { fill } from "$lib/sys/copy/index.js";

let { copy, detected }: { copy: WelcomeCopy; detected: Detected } = $props();

const chips = $derived([
	...(detected.gitName ? [fill(copy.found_git, { name: detected.gitName })] : []),
	...detected.folders.map((f) => fill(copy.found_folder, { path: f.path, count: f.repoCount })),
]);
</script>

<div class="flex flex-col items-center gap-[clamp(0.75rem,2vh,1.5rem)] text-center">
	<div class="aspect-square w-[clamp(6rem,12vw,10rem)]">
		<ClyffyMascot pose={detected.done ? "pointing" : "scanning"} size="full" label={copy.mascot_alt} />
	</div>
	<Heading level={1} size="display">{copy.title}</Heading>
	<Text as="p" size="lg" class="max-w-[42rem]" style="color: var(--text-secondary);">{copy.subtitle}</Text>

	<div class="flex min-h-[3.5rem] flex-col items-center gap-[var(--space-2)]" aria-live="polite">
		{#if !detected.done}
			<div class="flex items-center gap-[var(--space-2)]">
				<Spinner size="xs" tone="accent" />
				<Text size="sm" style="color: var(--text-muted);">{copy.looking}</Text>
			</div>
		{:else if chips.length > 0}
			<Text size="xs" weight="semibold" style="color: var(--text-muted);">{copy.found_heading}</Text>
			<div class="flex flex-wrap justify-center gap-[var(--space-2)]">
				{#each chips as chip (chip)}
					<Badge size="md" variant="informative" fillStyle="subtle">{chip}</Badge>
				{/each}
			</div>
		{:else}
			<Text size="sm" style="color: var(--text-muted);">{copy.nothing_found}</Text>
		{/if}
	</div>
</div>
