<!--
	@file FirstRunFlow.svelte
	@module @devpulse/domains/app/onboarding/feature/first-run

	Renders the stage Rust's `onboarding` state names, inside the onboarding
	shell, with that stage's buttons. Every button is an intent; Rust decides
	what happens and publishes the result. When first run is no longer open
	(finished, or "Set up later"), the dashboard shows.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { Button } from "$lib/design/components/button/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { copyState, fill } from "$lib/sys/copy/index.js";
import { onboardingState } from "../../data-access/onboarding.state.svelte.js";
import { youForm } from "../../data-access/you-form.state.svelte.js";
import { OnboardingShell } from "../../ui/onboarding-shell/index.js";
import WelcomeView from "./views/WelcomeView.svelte";
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
	if (state && state.status !== "open") void goto(resolve("/devpulse"), { replaceState: true });
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
		{/if}

		{#if onboardingState.error}
			<InlineMessage tone="error">{onboardingState.error}</InlineMessage>
		{/if}

		{#snippet actions()}
			{#if state.stage === "welcome"}
				<Button preset="ghost" size="md" onclick={onboardingState.later} disabled={onboardingState.busy}>
					{copy.common.later}
				</Button>
				<Button preset="primary" size="lg" onclick={onboardingState.next} disabled={onboardingState.busy}>
					{copy.welcome.cta}
				</Button>
			{:else}
				<Button preset="ghost" size="md" onclick={onboardingState.later} disabled={onboardingState.busy}>
					{copy.common.later}
				</Button>
				<Button preset="secondary" size="md" onclick={onboardingState.back} disabled={onboardingState.busy}>
					{copy.common.back}
				</Button>
				{#if state.stage === "you"}
					<!-- Saving is the gate: Rust validates, writes, then continues. -->
					<Button
						preset="primary"
						size="lg"
						onclick={youForm.saveAndContinue}
						disabled={onboardingState.busy || youForm.saving || !youForm.view}
					>
						{isLast ? copy.common.finish : copy.common.continue}
					</Button>
				{:else}
					<Button
						preset="primary"
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
