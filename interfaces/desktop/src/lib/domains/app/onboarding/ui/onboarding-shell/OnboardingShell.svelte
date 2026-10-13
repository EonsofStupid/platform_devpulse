<!--
	@file OnboardingShell.svelte
	@module @devpulse/domains/app/onboarding/ui/onboarding-shell

	The frame every first-run stage renders in: the animated main-content
	background (shared loop video over the Clyffy variant), one centred
	panel that scales with the window, progress, and the stage's buttons.
	Holds no text of its own.
-->
<script lang="ts">
import Card from "$lib/design/components/card/Card.svelte";
import { DynamicBackground } from "$lib/design/components/dynamic-background/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { ONBOARDING_VIDEO, type OnboardingShellProps } from "./onboarding-shell.types.js";

let { videoSrc = ONBOARDING_VIDEO, progress, children, actions }: OnboardingShellProps = $props();
</script>

<div class="relative flex min-h-full w-full items-center justify-center px-[clamp(1rem,4vw,4rem)] py-[clamp(1.5rem,6vh,5rem)]">
	<DynamicBackground variant="clyffy" {videoSrc} animated />
	<Card
		preset="glass-deep"
		class="relative flex w-full max-w-[clamp(28rem,60vw,52rem)] flex-col gap-[clamp(1rem,3vh,2rem)] p-[clamp(1.25rem,3vw,3rem)]"
	>
		{@render children()}
		{#if actions || progress}
			<div class="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
				<Text size="xs" style="color: var(--text-muted);">{progress ?? ""}</Text>
				<div class="flex flex-wrap items-center gap-[var(--space-2)]">
					{@render actions?.()}
				</div>
			</div>
		{/if}
	</Card>
</div>
