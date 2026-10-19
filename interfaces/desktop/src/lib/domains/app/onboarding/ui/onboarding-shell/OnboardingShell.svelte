<!--
	@file OnboardingShell.svelte
	@module @devpulse/domains/app/onboarding/ui/onboarding-shell

	The frame every first-run stage renders in: the animated main-content
	background (shared loop video over the Clyffy variant), one centred
	panel that scales with the window, progress, and the stage's buttons.
	Holds no text of its own.
-->
<script lang="ts">
import { Card } from "@devpulse/coldlight/components/card";
import { DynamicBackground } from "@devpulse/coldlight/components/dynamic-background";
import { Text } from "@devpulse/coldlight/components/text";
import { ONBOARDING_VIDEO, type OnboardingShellProps } from "./onboarding-shell.types.js";

let { videoSrc = ONBOARDING_VIDEO, progress, children, actions }: OnboardingShellProps = $props();
</script>

<div class="relative flex h-full min-h-[24rem] w-full items-center justify-center px-[clamp(1rem,4vw,4rem)] py-[clamp(1rem,4vh,3rem)]">
	<DynamicBackground variant="clyffy" {videoSrc} animated />
	<!-- The panel scrolls inside; the stage's buttons stay in view. -->
	<Card
		preset="glass-deep"
		class="relative flex max-h-full w-full max-w-[clamp(28rem,60vw,52rem)] flex-col overflow-hidden"
	>
		<div class="flex min-h-0 flex-1 flex-col gap-[clamp(1rem,3vh,2rem)] overflow-y-auto p-[clamp(1.25rem,3vw,3rem)]">
			{@render children()}
		</div>
		{#if actions || progress}
			<div
				class="flex flex-wrap items-center justify-between gap-[var(--space-3)] px-[clamp(1.25rem,3vw,3rem)] py-[var(--space-4)]"
				style="border-top: 0.0625rem solid var(--border-subtle);"
			>
				<Text size="xs" style="color: var(--text-muted);">{progress ?? ""}</Text>
				<div class="flex flex-wrap items-center gap-[var(--space-2)]">
					{@render actions?.()}
				</div>
			</div>
		{/if}
	</Card>
</div>
