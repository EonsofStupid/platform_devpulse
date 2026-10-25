<script lang="ts">
	import '../../app.css';

	let { children } = $props();
</script>

<!-- Minimal layout for standalone chat window - no sidebar, no overlays -->
{@render children()}
