<!--
  @file DevPulse Settings
  @route /devpulse/settings
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "@devpulse/coldlight/blocks/widgets";
import { Button } from "@devpulse/coldlight/components/button";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { cn, container, hstack, stack } from "@devpulse/coldlight/utils";
import { Check, Pencil, X } from "lucide-svelte";
import { PresentationSettings, profileSettingsState } from "$lib/domains/app/devpulse/index.js";
import { onboardingState } from "$lib/domains/app/onboarding/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { hrefOf, routeAt, routeCopy } from "$lib/sys/routing/index.js";

const settingsState = profileSettingsState;
const setupCopy = $derived(copyState.catalog?.onboarding.common ?? null);
// Your AI lives on its own page (plan 0001 B3.6); its name is route copy.
const yourAi = routeAt("/devpulse/settings/ai");
const yourAiCopy = $derived(yourAi ? routeCopy(yourAi) : undefined);

$effect(() => {
	void settingsState.load();
});
</script>

<div class={cn(container({}), "container-md")} data-page="devpulse-settings">
	<div class={stack({ gap: "4" })}>
		{#if yourAi && yourAiCopy}
			<Widget title={yourAiCopy.label}>
				<div class={hstack({ justify: "between" })}>
					<Text size="sm" color="muted">{yourAiCopy.blurb}</Text>
					<a href={hrefOf(yourAi)}><Text size="sm" weight="semibold">{yourAiCopy.label}</Text></a>
				</div>
			</Widget>
		{/if}

		<Widget title="Profile">
			{#if settingsState.loading}
				<div class={hstack({ justify: "center" })}>
					<Spinner size="sm" />
					<Text size="sm" color="muted">Loading profile...</Text>
				</div>
			{:else if settingsState.error}
				<Text size="sm" color="negative">{settingsState.error}</Text>
			{:else if settingsState.profile}
				{#if settingsState.editing}
					<div class={stack({ gap: "3" })}>
						<div class={stack({ gap: "1" })}>
							<Text size="xs" color="secondary">Display Name</Text>
							<input
								type="text"
								bind:value={settingsState.editName}
								class="settings-input"
								placeholder="Your name"
							/>
						</div>
						<div class={stack({ gap: "1" })}>
							<Text size="xs" color="secondary">Email</Text>
							<input
								type="email"
								bind:value={settingsState.editEmail}
								class="settings-input"
								placeholder="you@example.com"
							/>
						</div>
						{#if settingsState.saveError}
							<InlineMessage tone="error">{settingsState.saveError}</InlineMessage>
						{/if}
						<div class={hstack({ gap: "2", justify: "end" })}>
							<Button variant="ghost" size="sm" onclick={() => settingsState.cancelEdit()} disabled={settingsState.saving}>
								<X size={14} />
								Cancel
							</Button>
							<Button variant="primary" size="sm" onclick={() => settingsState.save()} disabled={settingsState.saving}>
								{#if settingsState.saving}
									<Spinner size="xs" />
								{:else}
									<Check size={14} />
								{/if}
								Save
							</Button>
						</div>
					</div>
				{:else}
					<div class={stack({ gap: "3" })}>
						<div class={hstack({ justify: "between" })}>
							<Text color="secondary">Display Name</Text>
							<Text>{settingsState.profile.displayName ?? "Not set"}</Text>
						</div>
						<div class={hstack({ justify: "between" })}>
							<Text color="secondary">Email</Text>
							<Text>{settingsState.profile.email ?? "Not set"}</Text>
						</div>
						<div class={hstack({ justify: "end" })}>
							<Button variant="ghost" size="sm" onclick={() => settingsState.startEdit()}>
								<Pencil size={14} />
								Edit
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</Widget>

		<Widget title="Display detail">
			<PresentationSettings />
		</Widget>

		<Widget title="Preferences">
			{#if settingsState.prefs}
				<div class={stack({ gap: "3" })}>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Theme</Text>
						<Text>{settingsState.prefs.theme}</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Context Mode</Text>
						<Text>{settingsState.prefs.contextMode}</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Verbosity</Text>
						<Text>{settingsState.prefs.verbosity}</Text>
					</div>
					<div class={hstack({ justify: "between" })}>
						<Text color="secondary">Temperature</Text>
						<Text>{settingsState.prefs.defaultTemperature}</Text>
					</div>
				</div>
			{:else}
				<Text size="sm" color="muted">Preferences load after profile.</Text>
			{/if}
		</Widget>

		<Widget title="Integrations">
			<Text as="p" size="sm" color="muted">GitHub, GitLab, and Bitbucket integrations will be configured here.</Text>
		</Widget>

		<!-- First run can always be walked again; Rust reopens it and the app shell shows it. -->
		{#if setupCopy}
			<Widget title={setupCopy.run_again_title}>
				<div class={stack({ gap: "3" })}>
					<Text as="p" size="sm" color="muted">{setupCopy.run_again_hint}</Text>
					{#if onboardingState.error}
						<InlineMessage tone="error">{onboardingState.error}</InlineMessage>
					{/if}
					<div class={hstack({ justify: "end" })}>
						<Button
							variant="secondary"
							size="sm"
							onclick={onboardingState.reopen}
							disabled={onboardingState.busy || onboardingState.isOpen}
						>
							{setupCopy.run_again}
						</Button>
					</div>
				</div>
			</Widget>
		{/if}
	</div>
</div>

<style>
	.settings-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 0.0625rem solid var(--border-soft);
		background: var(--glass-deep);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 150ms ease-out;
		width: 100%;
	}
	.settings-input:focus {
		border-color: var(--accent-teal-main);
	}
	.settings-input::placeholder {
		color: var(--text-muted);
	}
</style>
