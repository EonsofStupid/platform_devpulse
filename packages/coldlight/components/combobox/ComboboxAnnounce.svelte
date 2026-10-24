<!--
	@component Combobox.Announce
	@kind combobox
	@slot announce
	@layer components

	Visually hidden aria-live region for screen reader announcements.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import type { ComboboxAnnounceProps } from "./types.js";

let { message, class: className }: ComboboxAnnounceProps = $props();
</script>

<div
	role="status"
	aria-live="polite"
	aria-atomic="true"
	class={cn("sr-only", className)}
	data-kind="combobox"
	data-slot="announce"
>
	{message ?? ""}
</div>
