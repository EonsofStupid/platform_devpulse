<!--
	@component ComboboxAnnounce — Gold Standard
	@kind combobox
	@layer components
	@package @devpulse/coldlight

	Visually hidden aria-live region for screen reader announcements.
	Announces the number of matching results after filtering.

	Example announcement: "5 results available" or "No results found".

	This is a POLITE live region — it waits for the screen reader to finish
	its current announcement before reading this. It is ATOMIC — the entire
	region text is re-announced on any change.

	The element is visually hidden via sr-only but remains in the
	accessibility tree for assistive technologies.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
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
