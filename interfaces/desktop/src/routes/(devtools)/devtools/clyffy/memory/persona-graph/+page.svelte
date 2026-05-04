<!--
	@file /devtools/clyffy/memory/persona-graph
	@route /devtools/clyffy/memory/persona-graph

	Thin shell — mounts the persona-graph devtool component. All state +
	IPC live in `$lib/devtools/clyffy/memory/persona-graph`.
-->
<script lang="ts">
import { PersonaGraphDevtool } from "$lib/devtools/clyffy/memory/persona-graph/index.js";
</script>

<PersonaGraphDevtool />
