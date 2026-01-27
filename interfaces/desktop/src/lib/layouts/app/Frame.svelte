<!--
  @file src/lib/layouts/app/Frame.svelte
  @name Frame.svelte
  @module @devpulse/layouts/app/Frame
  @layer lib
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  import TopBar from "./TopBar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import StatusBar from "./StatusBar.svelte";

  // Co-located SSOT styling for the whole frame (temporary, hard-coded)
  import "./styles/layout.css";

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

  let {
    children,
    sidebar,
    defaultSidebar = "collapsed",
    onSidebarChange
  }: Props = $props();

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

<div class="app-frame" data-route="devpulse" data-sidebar={sidebarMode()}>
  <header class="frame-topbar glass liquidSheen">
    <TopBar />
  </header>

  <aside class="frame-sidebar glass">
    <Sidebar
      collapsed={isCollapsed()}
      onToggle={(nextCollapsed) => setSidebar(nextCollapsed ? "collapsed" : "expanded")}
    />
  </aside>

  <main class="frame-content">
    <div class="content-scroll">
      {@render children()}
    </div>
  </main>

  <footer class="frame-statusbar glass liquidSheen">
    <StatusBar />
  </footer>
</div>