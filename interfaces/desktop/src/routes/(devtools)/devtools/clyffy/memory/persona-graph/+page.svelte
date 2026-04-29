<!--
	@file /devtools/clyffy/memory/persona-graph
	@route /devtools/clyffy/memory/persona-graph

	Thin shell — mounts the persona-graph devtool component. All state +
	IPC live in `$lib/domains/clyffy/persona`.
-->
<script lang="ts">
import { PersonaGraphDevtool } from "$lib/domains/clyffy/persona/index.js";
</script>

<PersonaGraphDevtool />
