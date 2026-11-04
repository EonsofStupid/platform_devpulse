<!--
  @file src/lib/sys/debug/vpb/components/VpbIcon.svelte
  @name VpbIcon.svelte
  @module @devpulse/sys/debug/vpb/components/VPBIcon
  @layer lib

  @description
  FAB Mode - 3D "V" Icon (Minimized State).
  Provides a quick menu to restore panel or enable scanning.

  @dependencies
  - vpb-icon.css (global)
  - state/vpb.svelte.ts
  - svelte-sonner

  @since 1.0.0
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { LayoutTemplate, PanelTop, Play, Settings } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { copyState } from "#lib/sys/copy/index.js";
import { vpb } from "../state/vpb.svelte.js";

const text = $derived(copyState.catalog?.vpb);

let showMenu = $state(false);

function toggleMenu() {
	showMenu = !showMenu;
}

function restore() {
	vpb.dock();
	showMenu = false;
	toast.info(text?.toast_restored ?? "");
}

function enableScan() {
	vpb.dock();
	vpb.startScan();
	showMenu = false;
	toast.success(text?.toast_scan_enabled ?? "");
}

function openWorkspace() {
	vpb.toggleWorkspace();
	showMenu = false;
}

function handleClickOutside(e: MouseEvent) {
	if (e.target instanceof Element && !e.target.closest(".vpb-icon-container")) {
		showMenu = false;
	}
}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="vpb-icon-container" data-kind="vpb" data-slot="fab">
	<button
		class="vpb-icon flex items-center justify-center"
		onclick={toggleMenu}
		aria-label={text?.icon_menu_label}
		aria-expanded={showMenu}
		title={text?.icon_title}
	>
		<svg width="32" height="32" viewBox="0 0 32 32" class="vpb-icon__svg">
			<defs>
				<linearGradient id="vpb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop class="vpb-icon__stop-start" offset="0%" />
					<stop class="vpb-icon__stop-end" offset="100%" />
				</linearGradient>
			</defs>
			<!-- 3D shadow (offset) -->
			<path
				class="vpb-icon__shadow"
				d="M9 9 L16 23 L23 9"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
				transform="translate(1, 1)"
			/>
			<!-- V shape -->
			<path
				d="M8 8 L16 24 L24 8"
				stroke="url(#vpb-gradient)"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
			/>
		</svg>
	</button>

	{#if showMenu}
		<div class="vpb-menu" role="menu">
			<Button
				variant="ghost"
				size="sm"
				class="vpb-menu__item w-full justify-start gap-2"
				onclick={restore}
				role="menuitem"
			>
				<PanelTop size={14} />
				<span>{text?.menu_open}</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				class="vpb-menu__item w-full justify-start gap-2"
				onclick={enableScan}
				role="menuitem"
			>
				<Play size={14} />
				<span>{text?.menu_scan}</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				class="vpb-menu__item w-full justify-start gap-2"
				onclick={openWorkspace}
				role="menuitem"
			>
				<LayoutTemplate size={14} />
				<span>{text?.open_workspace}</span>
			</Button>

			<div class="vpb-menu__separator"></div>

			<Button
				variant="ghost"
				size="sm"
				class="vpb-menu__item w-full justify-start gap-2"
				role="menuitem"
				disabled
			>
				<Settings size={14} />
				<span>{text?.menu_settings}</span>
			</Button>
		</div>
	{/if}
</div>
