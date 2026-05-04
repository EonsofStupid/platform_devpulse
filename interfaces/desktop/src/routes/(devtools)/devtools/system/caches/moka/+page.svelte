<!--
	@file /devtools/system/caches/moka — thin route shell.
	@route /devtools/system/caches/moka

	Mounts the Moka devtool feature component. All logic + IPC live in
	`$lib/devtools/system/caches/moka/`.
-->
<script lang="ts">
import { MokaDevtool } from "$lib/devtools/system/caches/moka/index.js";
</script>

<MokaDevtool />
