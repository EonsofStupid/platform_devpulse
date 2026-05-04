<!--
	@file /devtools/system/datastores/surrealdb — thin route shell.
	@route /devtools/system/datastores/surrealdb

	Mounts the SurrealDB devtool feature component. All logic + IPC live in
	`$lib/devtools/system/datastores/surrealdb/`.
-->
<script lang="ts">
import { SurrealdbDevtool } from "$lib/devtools/system/datastores/surrealdb/index.js";
</script>

<SurrealdbDevtool />
