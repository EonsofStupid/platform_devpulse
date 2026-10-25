<script lang="ts">
import "../../app.css";

let { children } = $props();
</script>

<div class="splashscreen-root" data-tauri-drag-region>
	{@render children()}
</div>

<style>
.splashscreen-root {
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background: #0a0a0f;
	color: #e0e0e8;
	font-family: system-ui, -apple-system, sans-serif;
	display: flex;
	flex-direction: column;
	user-select: none;
}
</style>
