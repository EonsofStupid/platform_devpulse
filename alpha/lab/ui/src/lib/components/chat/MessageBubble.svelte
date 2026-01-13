<script lang="ts">
	import type { ChatMessage } from '$lib/api/chat';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	const isUser = $derived(message.role === 'user');

	function formatTime(timestamp: string): string {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="flex {isUser ? 'justify-end' : 'justify-start'}">
	<div
		class="max-w-[80%] p-3 rounded-lg {isUser
			? 'bg-accent-blue/20 border border-accent-blue/30'
			: 'glass'}"
	>
		<div class="flex items-center gap-2 mb-1">
			<span class="text-xs {isUser ? 'text-accent-blue' : 'text-gray-500'}">
				{isUser ? 'You' : 'Assistant'}
			</span>
			<span class="text-[10px] text-gray-600">{formatTime(message.timestamp)}</span>
		</div>
		<div class="text-sm text-gray-200 whitespace-pre-wrap">{message.content}</div>
	</div>
</div>
