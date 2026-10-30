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

export async function sessions() {
	const result = await commands.agenthubSessions();
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}

export async function transcript(
	providerId: import("$lib/sys/generated/bindings.js").ProviderId,
	locator: string,
	cursor: string | null,
) {
	const result = await commands.agenthubSessionPage(providerId, locator, cursor);
	if (result.status === "error") throw new Error(result.error.message);
	return result.data;
}
