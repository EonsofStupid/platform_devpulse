<!--
	@file /devtools/system/datastores/libsql — thin route shell.
	@route /devtools/system/datastores/libsql

	Mounts the LibSQL devtool feature component. All logic + IPC live in
	`$lib/devtools/system/datastores/libsql/`.
-->
<script lang="ts">
import { LibsqlDevtool } from "$lib/devtools/system/datastores/libsql/index.js";
</script>

<LibsqlDevtool />
