<!--
  @file src/lib/sys/debug/vpb/shell/topbar.svelte
  @layer vpb

  The panel's title bar: the drag handle (from Header.svelte, with its grip from
  VPBTabs.svelte) and the window controls. Closing stops the scan and goes back
  to the V icon, as VPBTabs did; the icon is how the panel comes back.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { GripVertical, Minus, X } from "lucide-svelte";
import { copyState } from "#lib/sys/copy/index.js";
import { vpb } from "../state/vpb.svelte.js";

const text = $derived(copyState.catalog?.vpb);
</script>

<div class="vpb-topbar flex items-center justify-between select-none">
	<!-- Drag Handle / Title -->
	<div
		class="vpb-drag-handle flex items-center gap-2 flex-1"
		data-mode={vpb.mode}
		onmousedown={(e) => vpb.startDrag(e)}
		role="presentation"
		title={text?.drag_label}
	>
		<GripVertical class="vpb-grip-icon" size={14} />
		<span class="vpb-brand">{text?.brand_dev}<span class="vpb-brand__accent">{text?.brand_pulse}</span></span>
	</div>

	<!-- Window Controls -->
	<div class="vpb-tabs__controls flex items-center gap-1">
		<Button
			variant="ghost"
			size="sm"
			class="vpb-tabs__control"
			onclick={() => vpb.minimize()}
			aria-label={text?.minimize_label}
			title={text?.minimize}
		>
			<Minus size={12} />
		</Button>
		<Button
			variant="ghost"
			size="sm"
			class="vpb-tabs__control vpb-tabs__control--close"
			onclick={() => {
				vpb.stopScan();
				vpb.minimize();
			}}
			aria-label={text?.close_label}
			title={text?.close}
		>
			<X size={12} />
		</Button>
	</div>
</div>
