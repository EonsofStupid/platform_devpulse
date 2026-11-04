/**
 * @file Pure chat formatting helpers
 * @module @devpulse/domains/chat/util/format
 */

import type { ChatMessage } from "#lib/sys/generated/bindings.js";
import type { BlockChatMessage } from "./chat.types.js";

export function formatTime(epochSec: number): string {
	if (epochSec === 0) return "";
	const date = new Date(epochSec * 1000);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function previewText(content: string, maxLen: number): string {
	const t = content.trim();
	if (t.length <= maxLen) return t;
	return `${t.slice(0, maxLen - 1)}…`;
}

/**
 * A room seat's answer split from the JSON block it must end with, so you read the
 * answer and can still open what it handed the room.
 */
export function splitContractBlock(text: string): { prose: string; structured: string | null } {
	const match = /```(?:json)?\s*\n([\s\S]*?)\n?```\s*$/.exec(text);
	if (!match?.[1]) return { prose: text, structured: null };
	const prose = text.slice(0, match.index).trim();
	return prose ? { prose, structured: match[1].trim() } : { prose: text, structured: null };
}

export function toBlockMessage(msg: ChatMessage): BlockChatMessage {
	const role =
		msg.role === "assistant" || msg.role === "user" || msg.role === "system" ? msg.role : "user";
	return {
		id: msg.id,
		variant: role === "user" ? "user" : role === "assistant" ? "ai" : "system",
		author: role === "assistant" ? "Clyffy" : role === "system" ? "System" : undefined,
		content: msg.content,
		timestamp: formatTime(msg.createdAt),
	};
}
