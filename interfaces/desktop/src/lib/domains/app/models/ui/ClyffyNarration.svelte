<!--
	@file ClyffyNarration.svelte
	@module @devpulse/domains/app/models/ui

	Layman-voice narration line for a slot. Reads `narrationState.forSlot`
	and renders the most recent message in Clyffy's voice ("Spinning up
	your main AI…", "Voice is ready"). Tone-tinted accent strip on the
	left identifies which subsystem the line came from.

	Auto-fades after 8 s of no new line (UI-only — narrationState keeps
	the data; the fade is purely visual).
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { onMount } from "svelte";
import { narrationState } from "../data-access/narration.state.svelte.js";
import { ROLE_COLORS, roleForSlot } from "../util/roles.js";

interface Props {
	slotId: string;
	/** Hide entirely once this many ms have passed since the last line. */
	fadeAfterMs?: number;
}

let { slotId, fadeAfterMs = 8000 }: Props = $props();

const narration = $derived(narrationState.forSlot(slotId));
let now = $state(Date.now());

const isStale = $derived(!narration || now - narration.emittedAtMs > fadeAfterMs);

const roleAccent = $derived(() => {
	const role = roleForSlot(slotId);
	return role ? ROLE_COLORS[role.id] : "var(--text-muted)";
});

onMount(() => {
	const interval = setInterval(() => {
		now = Date.now();
	}, 1000);
	return () => clearInterval(interval);
});
</script>

{#if narration && !isStale}
	<div
		class="narration"
		data-tone={narration.tone}
		style:border-left-color={roleAccent()}
		role="status"
	>
		<Text size="xs">{narration.line}</Text>
	</div>
{/if}

<style>
	.narration {
		padding: 0.375rem 0.625rem;
		background: var(--surface-raised);
		border-left: 0.1875rem solid var(--text-muted);
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: opacity 0.4s ease-out;
	}
	.narration[data-tone="success"] { background: color-mix(in oklch, var(--signal-success) 12%, var(--surface-raised)); }
	.narration[data-tone="warning"] { background: color-mix(in oklch, var(--signal-warning) 12%, var(--surface-raised)); }
	.narration[data-tone="error"]   { background: color-mix(in oklch, var(--signal-error)   14%, var(--surface-raised)); }
</style>
