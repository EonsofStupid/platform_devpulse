<!--
  @file DevPulse Settings
  @route /devpulse/settings
  @domain devpulse
-->
<script lang="ts">
import { Check, Pencil, X } from "lucide-svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { container } from "$lib/design/utils/container/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { profileSettingsState } from "$lib/domains/app/devpulse/index.js";

const settingsState = profileSettingsState;

$effect(() => {
	void settingsState.load();
});
</script>

<div class={cn(container({}), "container-md")} data-page="devpulse-settings">
	<div class={stack({ gap: "4" })}>
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
						<div class={stack({ gap: "1" })}>
							<Text size="xs" color="secondary">Experience</Text>
							<div class={hstack({ gap: "2" })}>
								{#each [1, 2, 3] as lvl}
									<button
										class="level-btn"
										class:level-active={settingsState.editLevel === lvl}
										onclick={() => (settingsState.editLevel = lvl)}
									>{settingsState.levelLabel(lvl)}</button>
								{/each}
							</div>
						</div>
						<div class={hstack({ gap: "2", justify: "end" })}>
							<Button preset="button-ghost" size="sm" onclick={() => settingsState.cancelEdit()} disabled={settingsState.saving}>
								<X size={14} />
								Cancel
							</Button>
							<Button preset="button-primary" size="sm" onclick={() => settingsState.save()} disabled={settingsState.saving}>
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
						<div class={hstack({ justify: "between" })}>
							<Text color="secondary">Experience</Text>
							<Text>{settingsState.levelLabel(settingsState.profile.expertiseLevel)}</Text>
						</div>
						<div class={hstack({ justify: "end" })}>
							<Button preset="button-ghost" size="sm" onclick={() => settingsState.startEdit()}>
								<Pencil size={14} />
								Edit
							</Button>
						</div>
					</div>
				{/if}
			{/if}
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

	.level-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		border: 0.0625rem solid var(--border-soft);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 150ms ease-out;
	}
	.level-btn:hover {
		border-color: var(--accent-teal-main);
		color: var(--text-secondary);
	}
	.level-active {
		border-color: var(--accent-teal-main);
		background: color-mix(in oklch, var(--accent-teal-main) 15%, transparent);
		color: var(--accent-teal-main);
	}
</style>
