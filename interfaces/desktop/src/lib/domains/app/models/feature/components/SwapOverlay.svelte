<!--
	@file SwapOverlay.svelte
	@module @devpulse/domains/app/models/feature/components

	Centered overlay that surfaces during an active model install/swap
	(`installState.activeCount > 0`). Shows the most recent in-flight
	install so the user gets immediate visual feedback when they click
	"Install to slot" without context-switching to the activity HUD.

	Auto-hides once all installs are complete/failed/dismissed. Failed
	installs surface a persistent error card with a retry hint until
	the user dismisses them.
-->
<script lang="ts">
import { X } from "lucide-svelte";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import { getSlotLabel } from "../../util/slots.js";

const active = $derived(installState.list.filter((i) => i.status === "running"));
const failed = $derived(installState.list.filter((i) => i.status === "failed"));

const visible = $derived(active.length > 0 || failed.length > 0);

function dismissFailed(id: string) {
	installState.dismiss(id);
}
</script>

{#if visible}
	<div class="swap-overlay-root" role="status" aria-live="polite">
		<div class="card">
			{#if active.length > 0}
				{@const latest = active[active.length - 1]}
				{#if latest}
					{@const label = getSlotLabel(latest.slotId)}
					<div class="row">
						<Spinner size="sm" />
						<div class="copy">
							<Text size="sm" weight="bold">
								Installing into {label?.name ?? latest.slotId}
							</Text>
							<Text size="xs" color="muted">{latest.primaryFilename}</Text>
						</div>
					</div>
					{#if active.length > 1}
						<Text size="xs" color="muted">
							+ {active.length - 1} more install{active.length - 1 === 1 ? "" : "s"} in flight
						</Text>
					{/if}
				{/if}
			{/if}

			{#each failed as install (install.installId)}
				{@const label = getSlotLabel(install.slotId)}
				<div class="row failed">
					<div class="copy">
						<Text size="sm" weight="bold">
							{label?.name ?? install.slotId} failed
						</Text>
						<Text size="xs" color="muted">{install.error ?? "Unknown error"}</Text>
					</div>
					<button
						class="dismiss"
						onclick={() => dismissFailed(install.installId)}
						aria-label="Dismiss"
					>
						<X size={12} />
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.swap-overlay-root {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
	}
	.card {
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.5rem;
		min-width: 18rem;
		box-shadow: 0 0.5rem 1.5rem oklch(0 0 0 / 0.25);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	.row.failed {
		border-top: 0.0625rem solid color-mix(in oklch, var(--signal-error) 30%, transparent);
		padding-top: 0.5rem;
	}
	.copy {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}
	.dismiss {
		background: transparent;
		border: none;
		color: var(--text-muted);
		padding: 0.25rem;
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.dismiss:hover {
		color: var(--text-primary);
	}
</style>
