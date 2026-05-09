<!--
	@file ModelEventCard.svelte
	@module @devpulse/domains/app/models/ui

	Inline chat-margin card surfaced when a model event happens during a
	conversation (slot loaded, swap occurred, voice came online, etc.).
	Reads `narrationState.forSlot` for the line text and adds a tier
	color strip + role-pill so users see WHICH subsystem just changed.

	Sized for chat margins — narrow, single-line, dismissible.
-->
<script lang="ts">
import { X } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { narrationState } from "../data-access/narration.state.svelte.js";
import { ROLE_COLORS, roleForSlot } from "../util/roles.js";
import { getSlotLabel } from "../util/slots.js";

interface Props {
	slotId: string;
	/** Whether to render a dismiss button. Default true. */
	dismissable?: boolean;
}

let { slotId, dismissable = true }: Props = $props();

const narration = $derived(narrationState.forSlot(slotId));
const role = $derived(roleForSlot(slotId));
const label = $derived(getSlotLabel(slotId));
const accent = $derived(role ? ROLE_COLORS[role.id] : "var(--text-muted)");

function dismiss() {
	narrationState.clear(slotId);
}
</script>

{#if narration}
	<aside class="event-card" data-tone={narration.tone} style:--accent={accent}>
		<div class="head">
			<span class="strip"></span>
			<Text size="xs" weight="bold">{label?.name ?? slotId}</Text>
			{#if role}
				<Text size="xs" color="muted">· {role.label}</Text>
			{/if}
			{#if dismissable}
				<button class="dismiss" onclick={dismiss} aria-label="Dismiss">
					<X size={10} />
				</button>
			{/if}
		</div>
		<Text size="xs" color="secondary">{narration.line}</Text>
	</aside>
{/if}

<style>
	.event-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0.625rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.5rem;
		max-width: 16rem;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.strip {
		display: inline-block;
		width: 0.25rem;
		height: 0.875rem;
		background: var(--accent);
		border-radius: 0.125rem;
	}
	.dismiss {
		margin-left: auto;
		padding: 0.125rem;
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.dismiss:hover {
		color: var(--text-primary);
		background: var(--surface-pressed, color-mix(in oklch, var(--text-primary) 10%, transparent));
	}
	.event-card[data-tone="success"] { border-color: color-mix(in oklch, var(--signal-success) 35%, var(--border-subtle)); }
	.event-card[data-tone="warning"] { border-color: color-mix(in oklch, var(--signal-warning) 35%, var(--border-subtle)); }
	.event-card[data-tone="error"]   { border-color: color-mix(in oklch, var(--signal-error)   45%, var(--border-subtle)); }
</style>
