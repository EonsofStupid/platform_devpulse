<script lang="ts">
import { ChatShell } from "$lib/layouts/chat";

let { children } = $props();
</script>

<ChatShell>
	{@render children()}
</ChatShell>
