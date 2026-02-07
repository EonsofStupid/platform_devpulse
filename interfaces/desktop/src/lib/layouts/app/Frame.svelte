<!--
  @file src/lib/layouts/app/Frame.svelte
  @name Frame.svelte
  @module @devpulse/layouts/app/Frame
  @layer lib
-->
<script lang="ts">
import type { Snippet } from "svelte";
import Sidebar from "./Sidebar.svelte";
import StatusBar from "./StatusBar.svelte";
import TopBar from "./TopBar.svelte";

type SidebarMode = "collapsed" | "expanded";

interface Props {
	children: Snippet;

	/**
	 * CONTROLLED mode:
	 * Parent owns sidebar state and passes it in.
	 */
	sidebar?: SidebarMode;

	/**
	 * UNCONTROLLED mode:
	 * Initial value when parent does NOT control.
	 */
	defaultSidebar?: SidebarMode;

	/**
	 * Optional callback for either mode.
	 */
	onSidebarChange?: (next: SidebarMode) => void;
}

let { children, sidebar, defaultSidebar = "collapsed", onSidebarChange }: Props = $props();

// Local state only used when not controlled
let localSidebar = $state<SidebarMode>(defaultSidebar);

// If parent starts controlling, sync local copy so UI stays consistent
$effect(() => {
	if (sidebar === undefined) return;
	localSidebar = sidebar;
});

function sidebarMode(): SidebarMode {
	return sidebar ?? localSidebar;
}

function setSidebar(next: SidebarMode) {
	if (sidebar === undefined) localSidebar = next;
	onSidebarChange?.(next);
}

function isCollapsed(): boolean {
	return sidebarMode() !== "expanded";
}
</script>

<div
  class="grid h-screen w-screen grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto] bg-matte-dark"
  data-route="devpulse"
  data-sidebar={sidebarMode()}
>
  <header class="col-span-2 flex items-center bg-glass-void backdrop-blur-lg border-b border-teal-700/30 px-4 py-2 shadow-z1">
    <TopBar />
  </header>

  <aside class="row-span-1 bg-glass-deep backdrop-blur-md border-r border-teal-700/30 shadow-z2">
    <Sidebar
      collapsed={isCollapsed()}
      onToggle={(nextCollapsed) => setSidebar(nextCollapsed ? "collapsed" : "expanded")}
    />
  </aside>

  <main class="overflow-hidden bg-matte-dark">
    <div class="h-full overflow-y-auto p-4">
      {@render children()}
    </div>
  </main>

  <footer class="col-span-2 flex items-center bg-glass-void backdrop-blur-md border-t border-teal-700/30 px-4 py-1 text-sm text-neutral-400">
    <StatusBar />
  </footer>
</div>