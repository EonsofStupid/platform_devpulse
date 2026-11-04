<!--
  @file /devpulse/models — Model Control (in-app route).
  Mirrors the devtools/models page inside the app frame so the sidebar stays visible.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import {
	Brain,
	Check,
	Headphones,
	Play,
	RefreshCw,
	Search,
	Sparkles,
	Square,
	X,
} from "lucide-svelte";
import {
	formatMb,
	getSlotLabel,
	isInferenceReady,
	modelsState,
	ROLE_COLORS,
	ROLE_FRAMES,
	VramBar,
} from "#lib/domains/app/models/index.js";
import DownloadPanel from "#lib/sys/activity-hud/DownloadPanel.svelte";

let loading = $state(false);
let actionSlot = $state<string | null>(null);

const ROLE_ICONS = {
	brain: Brain,
	encoder: Search,
	voice: Headphones,
	helpers: Sparkles,
} as const;

const ROLE_ACCENT: Record<string, string> = {
	brain: "var(--accent-teal-main)",
	encoder: "var(--accent-purple-main)",
	voice: "var(--accent-coral-main)",
	helpers: "var(--text-muted)",
};

async function rescan(): Promise<void> {
	loading = true;
	try {
		await modelsState.scan();
		await modelsState.refresh();
	} finally {
		loading = false;
	}
}

async function loadSlot(slotId: string): Promise<void> {
	actionSlot = slotId;
	try {
		await modelsState.load(slotId);
	} catch (e) {
		console.error(`Load failed for ${slotId}:`, e);
	} finally {
		actionSlot = null;
	}
}

async function unloadSlot(slotId: string): Promise<void> {
	actionSlot = slotId;
	try {
		await modelsState.unload(slotId);
	} catch (e) {
		console.error(`Unload failed for ${slotId}:`, e);
	} finally {
		actionSlot = null;
	}
}

function slotData(slotId: string) {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	const model = slot?.assigned_model_id
		? (modelsState.models.find((m) => m.id === slot.assigned_model_id) ?? null)
		: null;
	const status = modelsState.statuses[slotId];
	const ready = status ? isInferenceReady(status) : false;
	const label = getSlotLabel(slotId);
	return { slot, model, status, ready, label };
}

// NO mount scan. Rust pushes platform:models-status via emit_status()
// after every mutation and on boot. The frontend is a dumb bucket.
// If the user wants a fresh scan, the Rescan button in the header
// calls `rescan()` explicitly — that's a user action, not automatic.
</script>

<div class="models-page">
	<div class="page-header">
		<Heading level={2} size="xl">Model Control</Heading>
		<Button variant="secondary" size="sm" onclick={rescan} disabled={loading}>
			{#if loading}
				<Spinner size="xs" />
			{:else}
				<RefreshCw size={14} />
			{/if}
			Rescan Models
		</Button>
	</div>

	<VramBar />

	{#each ROLE_FRAMES as frame (frame.id)}
		{@const Icon = ROLE_ICONS[frame.id as keyof typeof ROLE_ICONS] ?? Sparkles}
		{@const accent = ROLE_ACCENT[frame.id] ?? "var(--text-muted)"}

		<section class="role-section">
			<div class="role-header" style:border-left-color={accent}>
				<Icon size={18} />
				<Text size="sm" weight="bold">{frame.label}</Text>
				<Text size="xs" class="role-desc">{frame.description}</Text>
			</div>

			<div class="slot-table">
				{#each frame.slots as slotId (slotId)}
					{@const { slot, model, status, ready, label } = slotData(slotId)}
					{@const isActing = actionSlot === slotId}

					<div class="slot-row">
						<div class="slot-id">
							<Text size="xs" weight="bold">{label?.name ?? slotId}</Text>
							<Text size="xs" class="slot-raw-id">{slotId}</Text>
						</div>

						<div class="slot-model">
							{#if model}
								<Text size="xs" class="model-name">{model.filename}</Text>
								<Text size="xs" class="model-vram">{formatMb(model.vram_estimate_mb)} VRAM</Text>
							{:else}
								<Text size="xs" class="model-empty">No model assigned</Text>
							{/if}
						</div>

						<div class="slot-status">
							{#if ready}
								<Badge variant="positive" size="sm"><Check size={8} /> Ready</Badge>
							{:else if status?.type === "loading"}
								<Badge variant="informative" size="sm"><Spinner size="xs" /> Loading</Badge>
							{:else if status?.type === "failed"}
								<Badge variant="negative" size="sm"><X size={8} /> Failed</Badge>
							{:else if model}
								<Badge variant="neutral" size="sm">Assigned</Badge>
							{:else}
								<Badge variant="neutral" size="sm">Empty</Badge>
							{/if}
						</div>

						<div class="slot-actions">
							{#if model && !ready}
								<Button variant="secondary" size="sm" onclick={() => loadSlot(slotId)} disabled={isActing}>
									{#if isActing}<Spinner size="xs" />{:else}<Play size={12} />{/if}
									Load
								</Button>
							{/if}
							{#if ready}
								<Button variant="ghost" size="sm" onclick={() => unloadSlot(slotId)} disabled={isActing}>
									<Square size={12} />
									Unload
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}

	<section class="registry-section">
		<Heading level={3} size="md">Model Registry ({modelsState.models.length} models)</Heading>
		<div class="registry-table">
			{#each modelsState.models as model (model.id)}
				<div class="registry-row">
					<Text size="xs" weight="bold" class="reg-filename">{model.filename}</Text>
					<Text size="xs" class="reg-detail">{model.architecture}</Text>
					<Text size="xs" class="reg-detail">{formatMb(model.size_mb)}</Text>
					<Text size="xs" class="reg-detail">{formatMb(model.vram_estimate_mb)} VRAM</Text>
					<div class="reg-caps">
						{#each model.compatible_capabilities as cap}
							<Badge variant="neutral" size="sm">{cap}</Badge>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="download-section">
		<DownloadPanel />
	</section>
</div>

<style>
	.models-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		max-width: 64rem;
		overflow-y: auto;
		height: 100%;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.role-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-left: 0.1875rem solid var(--text-muted);
		color: var(--text-primary);
	}

	:global(.role-desc) { color: var(--text-muted); margin-left: auto; }

	.slot-table {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.slot-row {
		display: grid;
		grid-template-columns: 10rem 1fr 6rem auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
	}

	.slot-id {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	:global(.slot-raw-id) { color: var(--text-muted); font-family: var(--font-mono); }

	.slot-model {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	:global(.model-name) { font-family: var(--font-mono); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	:global(.model-vram) { color: var(--text-muted); flex-shrink: 0; }
	:global(.model-empty) { color: var(--text-muted); font-style: italic; }

	.slot-status { flex-shrink: 0; }

	.slot-actions {
		display: flex;
		gap: 0.25rem;
	}

	.registry-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.registry-table {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.registry-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
		flex-wrap: wrap;
	}

	:global(.reg-filename) { font-family: var(--font-mono); min-width: 12rem; }
	:global(.reg-detail) { color: var(--text-muted); }

	.reg-caps {
		display: flex;
		gap: 0.25rem;
		margin-left: auto;
	}

	.download-section {
		border-top: 0.0625rem solid var(--border-soft);
		padding-top: 1rem;
	}
</style>
