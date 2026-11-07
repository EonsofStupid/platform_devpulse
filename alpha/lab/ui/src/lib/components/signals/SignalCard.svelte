<script lang="ts">
	import type { SignalEvent } from '$lib/api/signals';

	interface Props {
		signal: SignalEvent;
	}

	let { signal }: Props = $props();

	const badgeClass: Record<string, string> = {
		chat: 'badge-chat',
		inference: 'badge-inference',
		rumination: 'badge-rumination',
		thought_node: 'badge-thought',
		debug: 'badge-debug'
	};

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3
		});
	}

	function formatPayload(payload: unknown): string {
		if (typeof payload === 'string') return payload;
		return JSON.stringify(payload, null, 2);
	}
</script>

<div class="glass p-4 signal-enter">
	<div class="flex items-start justify-between gap-4">
		<!-- Left: Type badge and content -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-2">
				<span class="px-2 py-0.5 text-xs rounded-full {badgeClass[signal.signal_type] || 'badge-debug'}">
					{signal.signal_type}
				</span>
				<span class="text-xs text-gray-500">{signal.source}</span>
			</div>

			<!-- Payload preview -->
			<pre class="mono text-xs text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap max-w-md">
				{formatPayload(signal.payload)}
			</pre>
		</div>

		<!-- Right: Timestamp and ID -->
		<div class="text-right flex-shrink-0">
			<div class="mono text-xs text-gray-400">{formatTime(signal.timestamp)}</div>
			<div class="mono text-[10px] text-gray-600 mt-1">{signal.id.slice(0, 8)}</div>
		</div>
	</div>
</div>
