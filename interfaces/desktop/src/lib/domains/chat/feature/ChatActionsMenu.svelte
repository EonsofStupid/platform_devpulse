<!--
  @feature ChatActionsMenu — delete / clear / export
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Popover } from "@devpulse/coldlight/components/popover";
import { Text } from "@devpulse/coldlight/components/text";
import { chatState } from "../data-access/chat.state.svelte.js";
import { sessionsState } from "../data-access/sessions.state.svelte.js";
import DeleteConfirmDialog from "./DeleteConfirmDialog.svelte";
import ExportDialog from "./ExportDialog.svelte";

let showClear = $state(false);
let showDelete = $state(false);
let showExport = $state(false);
let exportAll = $state(false);
let open = $state(false);
</script>

<Popover {open} onOpenChange={(value) => { open = value; }} class="[&_[data-slot=content]]:right-0">
	{#snippet trigger()}<Text size="xs" class="block px-2 py-2">Actions</Text>{/snippet}
	{#snippet content()}
<div class="flex min-w-40 flex-col gap-1 p-2">
	<Button
		variant="ghost"
		size="sm"
		onclick={() => {
			open = false;
			exportAll = false;
			showExport = true;
		}}
	>
		Export
	</Button>
	<Button
		variant="ghost"
		size="sm"
		onclick={() => {
			open = false;
			exportAll = true;
			showExport = true;
		}}
	>
		Export all
	</Button>
	<Button variant="ghost" size="sm" disabled={!chatState.activeSessionId} onclick={() => { open = false; showDelete = true; }}>Delete session</Button>
	<Button variant="danger" size="sm" onclick={() => { open = false; showClear = true; }}>Clear all</Button>
</div>
	{/snippet}
</Popover>

<DeleteConfirmDialog
	open={showDelete}
	mode="delete-session"
	onClose={() => (showDelete = false)}
	onConfirm={async () => {
		const id = chatState.activeSessionId;
		if (!id) return;
		await sessionsState.delete(id);
		chatState.setActiveSession(null);
		await chatState.loadActive();
	}}
/>

<DeleteConfirmDialog
	open={showClear}
	mode="clear-all"
	onClose={() => (showClear = false)}
	onConfirm={async () => {
		await sessionsState.clearAll();
		chatState.setActiveSession(null);
		await chatState.loadActive();
	}}
/>

<ExportDialog
	open={showExport}
	sessionId={exportAll ? null : chatState.activeSessionId}
	onClose={() => (showExport = false)}
/>
