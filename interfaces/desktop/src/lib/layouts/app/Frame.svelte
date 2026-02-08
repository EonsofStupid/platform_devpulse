<!--
  @file src/lib/layouts/app/Frame.svelte
  @module @devpulse/layouts/app/Frame
  @layer lib

  @description
  App shell frame with ColdLight CSS Grid layout.
  Wired to globalState for sidebar mode and route domain.

  @since 1.0.0
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { globalState } from "$lib/sys/runes/global.svelte";
import Sidebar from "./Sidebar.svelte";
import StatusBar from "./StatusBar.svelte";
import TopBar from "./TopBar.svelte";
import "./styles/index.css";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const isExpanded = $derived(globalState.sidebar_mode === "expanded");
</script>

<div
	data-layout="app"
	data-sidebar={globalState.sidebar_mode}
	data-route={globalState.current_domain}
>
	<header data-slot="topbar">
		<TopBar />
	</header>

	<aside data-slot="sidebar" data-expanded={isExpanded ? "true" : undefined}>
		<Sidebar />
	</aside>

	<main data-slot="content">
		<div class="h-full overflow-y-auto p-4 text-[var(--text-primary)]">
			{@render children()}
		</div>
	</main>

	<footer data-slot="statusbar">
		<StatusBar />
	</footer>
</div>
