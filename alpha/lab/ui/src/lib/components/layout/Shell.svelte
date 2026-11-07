<script lang="ts">
	import Sidebar from "./Sidebar.svelte";

	interface Props {
		children: import("svelte").Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="flex h-screen bg-gray-950 relative">
	<!-- Background Logo (faded) -->
	<div
		class="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
	>
		<img
			src="/devpulse-labs-bg.png"
			alt=""
			class="opacity-[0.03] w-[80vw] max-w-[1200px] select-none"
			onerror={(e) =>
				((e.currentTarget as HTMLImageElement).style.display = "none")}
		/>
	</div>

	<Sidebar />
	<main class="flex-1 overflow-auto custom-scrollbar relative z-10">
		{@render children()}
	</main>
</div>
