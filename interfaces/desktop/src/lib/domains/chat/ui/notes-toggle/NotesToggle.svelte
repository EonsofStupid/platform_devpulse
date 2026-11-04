<!--
	@file NotesToggle.svelte
	@module @devpulse/domains/chat/ui/notes-toggle

	Whether this conversation gets your notes: a plain yes or no you can always
	see, the switch that changes it, and the way to the page that chooses them.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Switch } from "@devpulse/coldlight/components/switch";
import { fill } from "#lib/sys/copy/index.js";
import type { NotesToggleProps } from "./notes-toggle.types.js";

let { copy, notes, disabled, problem, onChange, onChoose }: NotesToggleProps = $props();
</script>

<div class="flex flex-wrap items-center gap-2" title={copy.notes_help}>
	<Badge size="sm" variant={notes ? "positive" : "neutral"}>{notes ? copy.notes_yes : copy.notes_no}</Badge>
	<Switch
		size="sm"
		checked={notes}
		{disabled}
		aria-label={copy.notes_label}
		onCheckedChange={(on: boolean) => onChange(on)}
	/>
	{#if onChoose}<Button variant="ghost" size="sm" onclick={onChoose}>{copy.notes_change}</Button>{/if}
	{#if problem}<InlineMessage tone="error">{fill(copy.notes_failed, { reason: problem })}</InlineMessage>{/if}
</div>
