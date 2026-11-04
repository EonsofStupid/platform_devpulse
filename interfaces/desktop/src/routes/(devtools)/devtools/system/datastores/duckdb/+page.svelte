<!--
	@file /devtools/system/datastores/duckdb — thin route shell.
	@route /devtools/system/datastores/duckdb

	Mounts the DuckDB devtool feature component. All logic + IPC live in
	`#lib/devtools/system/datastores/duckdb//index.js`.
-->
<script lang="ts">
import { DuckdbDevtool } from "#lib/devtools/system/datastores/duckdb/index.js";
</script>

<DuckdbDevtool />
