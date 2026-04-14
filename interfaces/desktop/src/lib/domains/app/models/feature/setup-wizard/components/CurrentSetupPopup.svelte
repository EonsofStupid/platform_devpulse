<!--
  @file CurrentSetupPopup.svelte
  Overlay showing all configured slots with status.
  Accessible from every wizard page via the "Setup" button.
-->
<script lang="ts">
import { Check, Loader2, X } from "lucide-svelte";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { formatMb, isInferenceReady } from "../../../util/models.types.js";
import { wizardState } from "../wizard.state.svelte.js";
import { ROLE_COLORS, SLOT_LABELS } from "../wizard.types.js";

const slots = $derived(
	SLOT_LABELS.map((sl) => {
		const s = modelsState.userSlots.find((u) => u.id === sl.id);
		const model = s?.assigned_model_id
			? modelsState.models.find((m) => m.id === s.assigned_model_id)
			: null;
		const status = modelsState.statuses[sl.id];
		const ready = status ? isInferenceReady(status) : false;
		const color = ROLE_COLORS[sl.role];
		return { ...sl, model, ready, color };
	}),
);

function close(): void {
	wizardState.showCurrentSetup = false;
}
</script>

{#if wizardState.showCurrentSetup}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="popup-backdrop" onclick={close} onkeydown={(e) => e.key === "Escape" && close()}>
		<div class="popup" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === "Escape" && close()} role="dialog" aria-label="Current setup overview" tabindex="-1">
			<div class="popup-header">
				<h3 class="popup-title">Current Setup</h3>
				<button class="btn-close" onclick={close} aria-label="Close"><X size={16} /></button>
			</div>

			<div class="slot-list">
				{#each slots as s (s.id)}
					<div class="slot-row" style="border-left-color: {s.color.accent};">
						<span class="slot-name">{s.name}</span>
						<span class="slot-model">{s.model?.filename ?? "Not assigned"}</span>
						<span class="slot-status" class:ready={s.ready} class:empty={!s.model}>
							{#if s.ready}
								<Check size={10} /> Ready
							{:else if s.model}
								Assigned
							{:else}
								Empty
							{/if}
						</span>
					</div>
				{/each}
			</div>

			<button class="btn-dismiss" onclick={close}>Close</button>
		</div>
	</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed; inset: 0; z-index: var(--wiz-z-modal);
		background: oklch(0 0 0 / 0.5); backdrop-filter: blur(4px);
		display: flex; align-items: center; justify-content: center;
		animation: fade-in 100ms ease-out;
	}
	@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

	.popup {
		width: 100%; max-width: 22rem; border-radius: var(--wiz-radius-xl);
		background: var(--wiz-overlay); border: 1px solid var(--wiz-border);
		box-shadow: var(--wiz-shadow-xl); overflow: hidden;
	}
	.popup-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.75rem 1rem; border-bottom: 1px solid var(--wiz-border);
	}
	.popup-title { font-size: var(--wiz-text-sm); font-weight: 700; color: var(--wiz-text); margin: 0; }
	.btn-close {
		display: inline-flex; padding: 0.25rem; border-radius: var(--wiz-radius-sm);
		border: none; background: transparent; color: var(--wiz-text-muted); cursor: pointer;
	}

	.slot-list { display: flex; flex-direction: column; }
	.slot-row {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.5rem 1rem; border-left: 3px solid transparent;
		border-bottom: 1px solid var(--wiz-void-800);
	}
	.slot-row:last-child { border-bottom: none; }
	.slot-name { font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text); width: 7rem; }
	.slot-model {
		flex: 1; font-size: var(--wiz-text-xs); color: var(--wiz-text-muted);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.slot-status {
		font-size: var(--wiz-text-xs); font-weight: 600;
		display: inline-flex; align-items: center; gap: 0.125rem;
	}
	.slot-status.ready { color: var(--wiz-green); }
	.slot-status.empty { color: var(--wiz-text-muted); }

	.btn-dismiss {
		display: block; width: 100%; padding: 0.625rem; border: none;
		background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-sm); cursor: pointer;
		border-top: 1px solid var(--wiz-border);
	}
	.btn-dismiss:hover { color: var(--wiz-text); background: var(--wiz-card); }
</style>
