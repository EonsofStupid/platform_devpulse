<script lang="ts">
	/**
	 * Chat Window Layout - Standalone layout for Tauri child window
	 * No shell, no sidebar - just the chat content with styling
	 */
	import '../../../app.css';

	let { children } = $props();
</script>

<!-- Minimal layout for standalone chat window -->
<div class="chat-layout">
	{@render children()}
</div>

<style>
	.chat-layout {
		height: 100vh;
		overflow: hidden;
	}
</style>
