<!--
	@file FirstRunFlow.svelte
	@module @devpulse/domains/app/onboarding/feature/first-run

	Renders the stage Rust's `onboarding` state names, inside the onboarding
	shell, with that stage's buttons. Every button is an intent; Rust decides
	what happens and publishes the result. When first run is no longer open
	(finished, or "Set up later"), the dashboard shows.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { copyState, fill } from "#lib/sys/copy/index.js";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { onboardingState } from "../../data-access/onboarding.state.svelte.js";
import { youForm } from "../../data-access/you-form.state.svelte.js";
import { OnboardingShell } from "../../ui/onboarding-shell/index.js";
import ContainersView from "./views/ContainersView.svelte";
import WelcomeView from "./views/WelcomeView.svelte";
import YourAiView from "./views/YourAiView.svelte";
import YouView from "./views/YouView.svelte";

const state = $derived(onboardingState.current);
const copy = $derived(copyState.catalog?.onboarding ?? null);
const index = $derived(state ? state.stages.indexOf(state.stage) : -1);
const isLast = $derived(state !== null && index === state.stages.length - 1);
const progress = $derived(
	state && copy
		? fill(copy.common.progress, { current: index + 1, total: state.stages.length })
		: undefined,
);

$effect(() => {
	if (state && state.status !== "open") void goto(resolve("devpulse"), { replace: true });
});
</script>

{#if copyState.error}
	<InlineMessage tone="error">{copyState.error}</InlineMessage>
{:else if !state || !copy}
	<div class="flex min-h-full items-center justify-center"><Spinner size="md" tone="accent" /></div>
{:else}
	<OnboardingShell progress={state.stage === "welcome" ? undefined : progress}>
		{#if state.flowProblem}
			<InlineMessage tone="warning">{copy.common.flow_problem} {state.flowProblem}</InlineMessage>
		{/if}

		{#if state.stage === "welcome"}
			<WelcomeView copy={copy.welcome} detected={state.detected} />
		{:else if state.stage === "you" && copyState.catalog}
			<YouView copy={copy.you} errorCopy={copyState.catalog.forms.errors} />
		{:else if state.stage === "your_ai"}
			<YourAiView copy={copy.your_ai} />
		{:else if state.stage === "containers"}
			<ContainersView copy={copy.containers} />
		{/if}

		{#if onboardingState.error}
			<InlineMessage tone="error">{onboardingState.error}</InlineMessage>
		{/if}

		{#snippet actions()}
			{#if state.stage === "welcome"}
				<Button variant="ghost" size="md" onclick={onboardingState.later} disabled={onboardingState.busy}>
					{copy.common.later}
				</Button>
				<Button variant="primary" size="lg" onclick={onboardingState.next} disabled={onboardingState.busy}>
					{copy.welcome.cta}
				</Button>
			{:else}
				<Button variant="ghost" size="md" onclick={onboardingState.later} disabled={onboardingState.busy}>
					{copy.common.later}
				</Button>
				<Button variant="secondary" size="md" onclick={onboardingState.back} disabled={onboardingState.busy}>
					{copy.common.back}
				</Button>
				{#if state.stage === "you"}
					<!-- Saving is the gate: Rust validates, writes, then continues. -->
					<Button
						variant="primary"
						size="lg"
						onclick={youForm.saveAndContinue}
						disabled={onboardingState.busy || youForm.saving || !youForm.view}
					>
						{isLast ? copy.common.finish : copy.common.continue}
					</Button>
				{:else}
					<Button
						variant="primary"
						size="lg"
						onclick={onboardingState.next}
						disabled={onboardingState.busy || state.needs.length > 0}
					>
						{isLast ? copy.common.finish : copy.common.continue}
					</Button>
				{/if}
			{/if}
		{/snippet}
	</OnboardingShell>
{/if}
