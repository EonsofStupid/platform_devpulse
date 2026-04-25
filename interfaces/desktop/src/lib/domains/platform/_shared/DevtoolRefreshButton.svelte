<!--
	@file DevtoolRefreshButton
	@domain platform/_shared

	Refresh button bound to a `TauriQuery` or `PolledQuery` instance from
	`$lib/sys/runes`. Spinner-while-loading; the icon flips to a warning
	tone when the query carries an error so a stale UI never looks healthy.

	# Usage

	```svelte
	<DevtoolRefreshButton query={mcpPoll} />
	<DevtoolRefreshButton query={logsQuery} label="Refresh logs" />
	```
-->
<script lang="ts">
import { AlertTriangle, RefreshCw } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import type { PolledQuery, TauriQuery } from "$lib/sys/runes/index.js";

type AnyQuery = TauriQuery<unknown, unknown> | PolledQuery<unknown, unknown>;

interface Props {
	/** The query whose `loading` / `error` state drives the button. */
	query: AnyQuery;
	/** Visible button label. Default: "Refresh". Hidden during loading. */
	label?: string;
}

let { query, label = "Refresh" }: Props = $props();
</script>

<Button preset="button-ghost" size="sm" onclick={() => query.refresh()} disabled={query.loading}>
	{#if query.loading}
		<Spinner size="xs" />
	{:else if query.error !== null}
		<AlertTriangle size={12} style="color: var(--signal-warning);" />
		{label}
	{:else}
		<RefreshCw size={12} />
		{label}
	{/if}
</Button>
