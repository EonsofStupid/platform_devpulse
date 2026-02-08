<script lang="ts">
import { ChatFrame } from "$lib/layouts/chat";

let { children } = $props();
</script>

<ChatFrame>
	{@render children()}
</ChatFrame>
