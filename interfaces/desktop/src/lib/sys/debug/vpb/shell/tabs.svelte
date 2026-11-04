<!--
  @file src/lib/sys/debug/vpb/shell/tabs.svelte
  @layer vpb

  The panel's Inspector and Builder tabs, on ColdLight's Tabs; the frame holds
  the Tabs root and their content.
-->
<script lang="ts">
import { TabsList, TabsTrigger } from "@devpulse/coldlight/components/tabs";
import { copyState } from "#lib/sys/copy/index.js";

const text = $derived(copyState.catalog?.vpb);
</script>

<TabsList class="vpb-tabs flex items-center gap-1">
	<TabsTrigger class="flex-1" value="inspector">{text?.tab_inspector}</TabsTrigger>
	<TabsTrigger class="flex-1" value="builder">{text?.tab_builder}</TabsTrigger>
</TabsList>
