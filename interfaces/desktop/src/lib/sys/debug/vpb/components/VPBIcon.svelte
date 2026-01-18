<!--
  @file src/lib/sys/debug/vpb/components/VPBIcon.svelte
  @name VPBIcon.svelte
  @module @devpulse/sys/debug/vpb/components/VPBIcon
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
<!--
  VPBIcon.svelte
  3D V icon - uses recipes from lib/design/vpb-icon.css
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
    import { toast } from "svelte-sonner";

    let showMenu = $state(false);

    function toggleMenu() {
        showMenu = !showMenu;
    }

    function restore() {
        vpb.dock();
        showMenu = false;
        toast.success("VPB restored");
    }

    function enableScan() {
        vpb.dock();
        vpb.startScan();
        showMenu = false;
        toast.info("Scan enabled");
    }

    function handleClickOutside(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target.closest(".vpb-icon-container")) {
            showMenu = false;
        }
    }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="vpb-icon-container">
    <button
        class="vpb-icon"
        onclick={toggleMenu}
        aria-label="VPB Menu"
        aria-expanded={showMenu}
        title="Visual Page Builder"
    >
        <svg width="32" height="32" viewBox="0 0 32 32" class="vpb-icon__svg">
            <defs>
                <linearGradient
                    id="vpb-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" style="stop-color: oklch(70% 0.15 195)" />
                    <stop
                        offset="100%"
                        style="stop-color: oklch(55% 0.18 280)"
                    />
                </linearGradient>
            </defs>
            <!-- V shape -->
            <path
                d="M8 8 L16 24 L24 8"
                stroke="url(#vpb-gradient)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
            />
            <!-- 3D shadow -->
            <path
                d="M9 9 L16 23 L23 9"
                stroke="oklch(30% 0.05 195 / 0.5)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
                transform="translate(1, 1)"
            />
        </svg>
    </button>

    {#if showMenu}
        <div class="vpb-menu" role="menu">
            <button class="vpb-menu__item" onclick={restore} role="menuitem">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="currentColor"
                >
                    <path d="M2 2h10v10H2V2zm1 1v8h8V3H3z" />
                </svg>
                <span>Open VPB</span>
            </button>

            <button class="vpb-menu__item" onclick={enableScan} role="menuitem">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="currentColor"
                >
                    <path d="M3 1.5v11l8-5.5L3 1.5z" />
                </svg>
                <span>Enable Scan</span>
            </button>

            <div class="vpb-menu__separator"></div>

            <button
                class="vpb-menu__item vpb-menu__item--muted"
                role="menuitem"
                disabled
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="currentColor"
                >
                    <circle
                        cx="7"
                        cy="7"
                        r="5"
                        stroke="currentColor"
                        fill="none"
                    />
                    <path d="M7 4v3l2 2" />
                </svg>
                <span>Settings</span>
            </button>
        </div>
    {/if}
</div>
