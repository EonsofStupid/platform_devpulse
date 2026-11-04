<!--
	@file ActionLogDevtool.svelte
	@module @devpulse/devtools/system/observability/logs

	The Action log devtool (plan 0008 R20b): today's wrapped app actions,
	tailed live. The shell names the page from its route folder; the Logs tab
	filters and shows the lines in ColdLight's Log; the Actions tab opens the
	folder that holds every day's log. Copy and Export carry the filtered lines.
	State is `actionLogState`, IPC is `action-log.service.ts`, text is copy
	(`devtools.action_log`).
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { EmptyState } from "@devpulse/coldlight/components/empty-state";
import { Log, type LogLine } from "@devpulse/coldlight/components/log";
import { SearchField } from "@devpulse/coldlight/components/search-field";
import { Text } from "@devpulse/coldlight/components/text";
import { FolderOpen } from "lucide-svelte";
import {
	type CapturePayload,
	CommandErrorAlert,
	ServiceDevtoolShell,
} from "#lib/devtools/index.js";
import { copyState } from "#lib/sys/copy/index.js";
import type { CommandError } from "#lib/sys/generated/bindings.js";
import { PolledQuery } from "#lib/sys/runes/index.js";
import { openActionLogsFolder } from "../data-access/action-log.service.js";
import { actionLogState, TAIL_INTERVAL_MS } from "../data-access/action-log.state.svelte.js";

const copy = $derived(copyState.catalog?.devtools.action_log);

const tail = new PolledQuery(() => actionLogState.pull(), TAIL_INTERVAL_MS);

const lines = $derived<LogLine[]>(actionLogState.filtered.map((text) => ({ text })));

let folderError = $state<CommandError | null>(null);

async function openFolder(): Promise<void> {
	const result = await openActionLogsFolder();
	folderError = result.status === "error" ? result.error : null;
}

function capture(tabId: string): CapturePayload | undefined {
	if (tabId !== "logs") return undefined;
	return {
		filename: "action-log.jsonl",
		mime: "text/plain",
		content: actionLogState.filtered.join("\n"),
	};
}
</script>

<ServiceDevtoolShell {capture}>
	{#snippet logs()}
		<div class="flex flex-col gap-3">
			<SearchField
				value={actionLogState.filter}
				onValueChange={(value) => {
					actionLogState.filter = value;
				}}
				onClear={() => {
					actionLogState.filter = "";
				}}
				placeholder={copy?.filter_placeholder}
				aria-label={copy?.filter_label}
			/>
			<CommandErrorAlert error={tail.error} />
			<Log {lines} label={copy?.log_label} class="h-[70vh]">
				{#snippet empty()}
					<EmptyState>
						<Text size="sm" color="muted">
							{actionLogState.lines.length === 0 ? copy?.empty : copy?.no_match}
						</Text>
					</EmptyState>
				{/snippet}
			</Log>
		</div>
	{/snippet}

	{#snippet actions()}
		<Card surface="glass" variant="deep">
			<div class="flex flex-col items-start gap-3">
				<Text size="sm" color="secondary">{copy?.open_folder_body}</Text>
				<Button variant="secondary" size="md" onclick={openFolder}>
					<FolderOpen size={16} aria-hidden="true" />
					{copy?.open_folder}
				</Button>
				<CommandErrorAlert error={folderError} />
			</div>
		</Card>
	{/snippet}
</ServiceDevtoolShell>
