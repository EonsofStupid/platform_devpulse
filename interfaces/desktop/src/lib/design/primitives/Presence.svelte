<!--
  @file primitives/Presence.svelte
  @layer primitives

  Mount/unmount with animation support.
  Deterministic lifecycle: entered → exiting → removed.
  Respects prefers-reduced-motion (instant removal, no animation).
  Never leaves ghost nodes in DOM.
-->
<script lang="ts" module>
  export type PresenceState = "entered" | "exiting" | "removed";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { BaseProps } from "./types.js";

  interface Props extends BaseProps {
    /** Whether content should be present */
    present: boolean;
    /** Content to render when present */
    children?: Snippet<[{ state: PresenceState }]>;
    /** Called when exit animation completes */
    onExitComplete?: () => void;
  }

  let {
    present,
    children,
    onExitComplete,
    class: className = "",
    "data-id": id,
  }: Props = $props();

  // Track lifecycle state
  let state = $state<PresenceState>(present ? "entered" : "removed");
  let node: HTMLDivElement | undefined = $state();

  // Check reduced motion preference (SSR-safe)
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Handle present changes
  $effect(() => {
    if (present) {
      state = "entered";
    } else if (state === "entered") {
      if (prefersReducedMotion) {
        // Instant removal for reduced motion
        state = "removed";
        onExitComplete?.();
      } else {
        state = "exiting";
      }
    }
  });

  // Handle animation end
  function handleAnimationEnd() {
    if (state === "exiting") {
      state = "removed";
      onExitComplete?.();
    }
  }

  function handleTransitionEnd() {
    if (state === "exiting") {
      state = "removed";
      onExitComplete?.();
    }
  }
</script>

{#if state !== "removed"}
  <div
    bind:this={node}
    class={className}
    data-kind="primitive"
    data-name="Presence"
    data-part="root"
    data-state={state}
    data-id={id}
    onanimationend={handleAnimationEnd}
    ontransitionend={handleTransitionEnd}
  >
    {@render children?.({ state })}
  </div>
{/if}
