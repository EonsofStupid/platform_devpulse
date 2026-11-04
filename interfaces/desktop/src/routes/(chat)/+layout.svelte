<script lang="ts">
import { ChatShell } from "#lib/layouts/chat/index.js";

let { children } = $props();
</script>

<ChatShell>
	{@render children()}
</ChatShell>
