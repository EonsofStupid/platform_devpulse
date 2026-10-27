/** @file Typed AgentHub execution observations. */

import type { AgentHubChanged } from "$lib/sys/generated/bindings.js";
import { commands, events } from "$lib/sys/generated/bindings.js";

export async function snapshot() {
	const result = await commands.agenthubLive();
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

export function onChanged(receive: (change: AgentHubChanged) => void) {
	return events.agentHubChanged.listen((event) => receive(event.payload));
}
