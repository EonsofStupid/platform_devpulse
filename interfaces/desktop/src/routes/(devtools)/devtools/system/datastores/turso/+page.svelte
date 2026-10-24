<!--
	@file /devtools/system/datastores/turso — thin route shell.
	@route /devtools/system/datastores/turso

	Mounts the Turso devtool feature component. All logic + IPC live in
	`$lib/devtools/system/datastores/turso/`.
-->
<script lang="ts">
import { TursoDevtool } from "$lib/devtools/system/datastores/turso/index.js";
</script>

<TursoDevtool />
