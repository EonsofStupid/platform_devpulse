<!--
	@file /devtools/system/observability/telemetry — thin route shell.
	@route /devtools/system/observability/telemetry

	Mounts the telemetry devtool feature component. All logic + IPC live in
	`#lib/devtools/system/observability/telemetry//index.js`.
-->
<script lang="ts">
import { TelemetryDevtool } from "#lib/devtools/system/observability/telemetry/index.js";
</script>

<TelemetryDevtool />
