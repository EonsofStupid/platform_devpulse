<!--
  @file src/lib/layouts/app/Sidebar.svelte
  @name Sidebar.svelte
  @module @devpulse/layouts/app/Sidebar
  @layer lib
-->
<script lang="ts">
  import { page } from "$app/state";

  interface NavItem {
    id: string;
    icon: string;
    label: string;
    href: string;
    hotkey?: string;
  }

  interface Props {
    /** If provided, Sidebar becomes controlled. */
    collapsed?: boolean;
    /** Optional controlled toggle callback. */
    onToggle?: (nextCollapsed: boolean) => void;
  }

  const navItems: NavItem[] = [
    { id: "devpulse", icon: "🏠", label: "Home", href: "/devpulse", hotkey: "G H" },
    { id: "ui-demo", icon: "🎨", label: "UI Components", href: "/ui-demo", hotkey: "G U" },
    { id: "overmind", icon: "🧠", label: "OverMind", href: "/overmind", hotkey: "G O" },
    { id: "wiredfront", icon: "📡", label: "WiredFront", href: "/wiredfront", hotkey: "G W" },
    { id: "devforge", icon: "🔧", label: "DevForge", href: "/devforge", hotkey: "G D" },
    { id: "maestro", icon: "🎭", label: "Maestro", href: "/maestro", hotkey: "G M" }
  ];

  const animations = ["bounce", "spin", "pulse", "shake"] as const;
  type Anim = (typeof animations)[number];

  let { collapsed, onToggle }: Props = $props();

  // Uncontrolled fallback (works, but best practice is: Frame controls this)
  let localCollapsed = $state(true);
  $effect(() => {
    if (collapsed === undefined) return;
    localCollapsed = collapsed;
  });

  function isCollapsed() {
    return collapsed ?? localCollapsed;
  }

  function toggleCollapsed() {
    const next = !isCollapsed();
    if (collapsed === undefined) localCollapsed = next;
    onToggle?.(next);
  }

  function isActive(href: string): boolean {
    return page.url.pathname === href || page.url.pathname.startsWith(href + "/");
  }

  let animatingId = $state<string | null>(null);
  let activeAnim = $state<Anim>("pulse");

  function randAnim(): Anim {
    return animations[Math.floor(Math.random() * animations.length)];
  }

  function triggerAnim(id: string) {
    animatingId = id;
    activeAnim = randAnim();
    window.setTimeout(() => {
      if (animatingId === id) animatingId = null;
    }, 420);
  }

  // Track pointer -> sets vars consumed by shared button sheen in layout.css
  function track(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
    // keep old names too (safe)
    el.style.setProperty("--mouse-x", `${x}%`);
    el.style.setProperty("--mouse-y", `${y}%`);
  }
</script>

<nav class="sidebar" aria-label="Primary" data-collapsed={isCollapsed() ? "true" : "false"}>
  <div class="navGroup" role="list">
    {#each navItems as item (item.id)}
      <span class="tooltipWrap" data-tooltip={item.label}>
        <a
          href={item.href}
          class="navItem"
          class:active={isActive(item.href)}
          class:animating={animatingId === item.id}
          data-animation={animatingId === item.id ? activeAnim : ""}
          data-hotkey={item.hotkey ?? ""}
          aria-label={item.label}
          aria-current={isActive(item.href) ? "page" : undefined}
          onpointermove={track}
          onpointerdown={() => triggerAnim(item.id)}
        >
          <span class="navIcon" aria-hidden="true">{item.icon}</span>
          <span class="sidebarLabel" aria-hidden={isCollapsed() ? "true" : "false"}>{item.label}</span>
        </a>
      </span>
    {/each}

    <div class="sidebarSpacer"></div>

    <span class="tooltipWrap" data-tooltip={isCollapsed() ? "Expand" : "Collapse"}>
      <button
        type="button"
        class="navItem navToggle"
        aria-label={isCollapsed() ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={isCollapsed() ? "false" : "true"}
        onpointermove={track}
        onclick={toggleCollapsed}
      >
        <span class="navIcon" aria-hidden="true">{isCollapsed() ? "➡️" : "⬅️"}</span>
        <span class="sidebarLabel" aria-hidden={isCollapsed() ? "true" : "false"}>
          {isCollapsed() ? "Expand" : "Collapse"}
        </span>
      </button>
    </span>
  </div>
</nav>