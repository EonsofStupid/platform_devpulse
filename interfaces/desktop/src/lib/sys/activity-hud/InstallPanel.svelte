<!--
	@file InstallPanel.svelte
	Platform-level install tracker — distinct from DownloadPanel.

	A "download" is bytes-to-disk; an "install" is the kernel's atomic
	chain (`install_to_slot`): download → scan → assign → load. This
	panel tracks the chain identity so the user sees one row per
	install, not three rows (one per stage). Each row collapses the
	four stages into a single status pill — running / complete / failed
	— and shows the slot the install is targeting.
-->
<script lang="ts">
import { Boxes, X } from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { type ActiveInstall, installState } from "./install.state.svelte.js";

// See DownloadPanel for the rationale — booting both states keeps any
// install consumer self-contained.
onMount(() => {
	void installState.boot();
});

function statusTone(
	status: ActiveInstall["status"],
): "positive" | "negative" | "informative" | "neutral" {
	if (status === "complete") return "positive";
	if (status === "failed") return "negative";
	return "informative";
}

function statusLabel(status: ActiveInstall["status"]): string {
	if (status === "complete") return "Installed";
	if (status === "failed") return "Failed";
	return "Installing";
}
</script>

<div class="install-panel">
	<div class="panel-header">
		<Heading level={4} size="sm">
			<Boxes size={16} />
			Installs
		</Heading>
		{#if installState.activeCount > 0}
			<Badge tone="informative" size="sm">{installState.activeCount} active</Badge>
		{/if}
	</div>

	{#if installState.list.length === 0}
		<div class="empty-state">
			<Text size="sm" class="empty-text">No active installs</Text>
		</div>
	{:else}
		<div class="install-list">
			{#each installState.list as ins (ins.installId)}
				<div class="install-row">
					<div class="ins-info">
						<Text size="sm" weight="bold" class="ins-slot">{ins.slotId}</Text>
						<Text size="xs" class="ins-repo">{ins.repoId}</Text>
						<Text size="xs" class="ins-primary">{ins.primaryFilename}</Text>
					</div>
					<Badge tone={statusTone(ins.status)} size="sm">
						{statusLabel(ins.status)}
					</Badge>
					{#if ins.error}
						<Text size="xs" class="ins-error">{ins.error}</Text>
					{/if}
					{#if ins.status !== "running"}
						<Button
							preset="ghost"
							size="sm"
							onclick={() => installState.dismiss(ins.installId)}
							aria-label="Dismiss install"
						>
							<X size={12} />
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.install-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-state {
		padding: 1rem;
		text-align: center;
	}
	:global(.empty-text) { color: var(--text-muted); }

	.install-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.install-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-base);
		border: 0.0625rem solid var(--border-soft);
	}

	.ins-info {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 8rem;
		flex: 1;
	}

	:global(.ins-slot) { font-family: var(--font-mono); }
	:global(.ins-repo) { color: var(--text-muted); }
	:global(.ins-primary) { color: var(--text-secondary); font-family: var(--font-mono); }
	:global(.ins-error) { color: var(--signal-error); }
</style>
