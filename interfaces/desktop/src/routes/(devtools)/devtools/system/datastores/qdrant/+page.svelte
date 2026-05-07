<!--
	@file /devtools/system/datastores/qdrant — thin route shell.
	@route /devtools/system/datastores/qdrant

	Mounts the Qdrant devtool feature component. All logic + IPC live in
	`$lib/devtools/system/datastores/qdrant/`.
-->
<script lang="ts">
import { QdrantDevtool } from "$lib/devtools/system/datastores/qdrant/index.js";
</script>

<QdrantDevtool />
