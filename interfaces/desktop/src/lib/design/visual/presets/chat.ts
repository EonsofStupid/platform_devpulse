/**
 * @file CHAT preset family — golden chat reference (token-driven)
 * @package @devpulse/coldlight
 *
 * All colours resolve through emitted semantic CSS vars (no hex in axes).
 * Structural bubbles stay animation: none except system / mode-pill / voice-listening
 * where the plan calls for explicit glow or alert pulses.
 */

import type { PresetDefinition } from "../preset-definition.js";

const sans = {
	fontFamily: "{font.sans}",
	fontSize: "0.875rem",
	fontWeight: 500,
	letterSpacing: "0em",
	lineHeight: 1.5,
} as const;

const baseMotion = {
	transition: { duration: "150ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
} as const;

/** User bubble — teal fill + rim + glow shadow */
export const chatBubbleUser: PresetDefinition = {
	id: "chat-bubble-user",
	family: "chat",
	variant: "bubble-user",
	label: "Chat Bubble — User",
	description: "Teal user message bubble (reference CHAT-REFERENCE-02)",
	axes: {
		backgroundColor: "var(--accent-teal-fill)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.75rem",
				spread: "0",
				color: "var(--accent-teal-glow)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--accent-teal-main)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
};

export const chatBubbleAiDeveloper: PresetDefinition = {
	id: "chat-bubble-ai-developer",
	family: "chat",
	variant: "bubble-ai-developer",
	label: "Chat Bubble — AI (Developer)",
	description: "AI bubble — developer mode rim + teal glow",
	axes: {
		backgroundColor: "var(--surface-inset)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.5rem",
				spread: "0",
				color: "var(--accent-teal-glow)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--chat-mode-developer)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
};

export const chatBubbleAiPlanning: PresetDefinition = {
	id: "chat-bubble-ai-planning",
	family: "chat",
	variant: "bubble-ai-planning",
	label: "Chat Bubble — AI (Planning)",
	description: "AI bubble — planning purple rim + glow",
	axes: {
		backgroundColor: "var(--surface-inset)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.5rem",
				spread: "0",
				color: "var(--accent-purple-glow)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--chat-mode-planning)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
};

export const chatBubbleAiImage: PresetDefinition = {
	id: "chat-bubble-ai-image",
	family: "chat",
	variant: "bubble-ai-image",
	label: "Chat Bubble — AI (Image)",
	description: "AI bubble — image mode ember rim + glow",
	axes: {
		backgroundColor: "var(--surface-inset)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.5rem",
				spread: "0",
				color: "var(--accent-ember-glow)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--chat-mode-image)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
};

export const chatBubbleAiGeneral: PresetDefinition = {
	id: "chat-bubble-ai-general",
	family: "chat",
	variant: "bubble-ai-general",
	label: "Chat Bubble — AI (General)",
	description: "AI bubble — general neutral rim, no halo",
	axes: {
		backgroundColor: "var(--surface-inset)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0.0625rem", style: "solid", color: "var(--chat-mode-general)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
};

export const chatBubbleSystem: PresetDefinition = {
	id: "chat-bubble-system",
	family: "chat",
	variant: "bubble-system",
	label: "Chat Bubble — System",
	description: "System rail — ember border + slow glow pulse",
	axes: {
		backgroundColor: "var(--surface-inset)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.75rem",
				spread: "0",
				color: "var(--accent-ember-glow)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--accent-ember-main)" },
		animation: {
			name: "cl-glow-pulse",
			duration: "3s",
			timingFunction: "ease-in-out",
			iterationCount: "infinite",
		},
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
};

export const chatModePillActive: PresetDefinition = {
	id: "chat-mode-pill-active",
	family: "chat",
	variant: "mode-pill-active",
	label: "Chat Mode Pill — Active",
	description: "Active mode pill with teal glow pulse (colour set per-mode in feature)",
	axes: {
		backgroundColor: "var(--chat-mode-developer)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.75rem",
				spread: "0",
				color: "var(--accent-teal-glow)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--accent-teal-main)" },
		animation: {
			name: "cl-glow-pulse",
			duration: "4s",
			timingFunction: "ease-in-out",
			iterationCount: "infinite",
		},
		...baseMotion,
		typography: { ...sans, fontSize: "0.6875rem", fontWeight: 600 },
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "9999px",
		opacity: 1,
	},
};

export const chatModePillIdle: PresetDefinition = {
	id: "chat-mode-pill-idle",
	family: "chat",
	variant: "mode-pill-idle",
	label: "Chat Mode Pill — Idle",
	description: "Inactive pill — matte fill, subtle border",
	axes: {
		backgroundColor: "var(--surface-inset)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0.0625rem", style: "solid", color: "var(--border-subtle)" },
		animation: "none",
		...baseMotion,
		typography: { ...sans, fontSize: "0.6875rem", fontWeight: 500 },
		gradient: "none",
		color: "var(--text-muted)",
		borderRadius: "9999px",
		opacity: 1,
	},
};

export const chatDecisionCard: PresetDefinition = {
	id: "chat-decision-card",
	family: "chat",
	variant: "decision-card",
	label: "Chat Decision Card",
	description: "Embedded task / decision card shell",
	axes: {
		backgroundColor: "var(--surface-subtle)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.75rem",
				spread: "0",
				color: "var(--accent-purple-glow)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--accent-purple-main)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
};

export const chatVoiceOrbIdle: PresetDefinition = {
	id: "chat-voice-orb-idle",
	family: "chat",
	variant: "voice-orb-idle",
	label: "Chat Voice Orb — Idle",
	description: "Mic at rest — teal rim",
	axes: {
		backgroundColor: "transparent",
		backgroundBlur: "0",
		shadow: [
			{ offsetX: "0", offsetY: "0", blur: "0.5rem", spread: "0", color: "var(--accent-teal-glow)" },
		],
		border: { width: "0.125rem", style: "solid", color: "var(--accent-teal-main)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "9999px",
		opacity: 1,
	},
};

export const chatVoiceOrbListening: PresetDefinition = {
	id: "chat-voice-orb-listening",
	family: "chat",
	variant: "voice-orb-listening",
	label: "Chat Voice Orb — Listening",
	description: "Mic live — voice-active fill + alert pulse shadow",
	axes: {
		backgroundColor: "var(--chat-voice-active)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.75rem",
				spread: "0",
				color: "var(--chat-voice-pulse)",
			},
		],
		border: { width: "0.125rem", style: "solid", color: "var(--signal-error)" },
		animation: {
			name: "cl-alert-pulse",
			duration: "1.5s",
			timingFunction: "ease-in-out",
			iterationCount: "infinite",
		},
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "9999px",
		opacity: 1,
	},
};

export const chatCortexNode: PresetDefinition = {
	id: "chat-cortex-node",
	family: "chat",
	variant: "cortex-node",
	label: "Chat Cortex Node",
	description: "Cortex memory graph node",
	axes: {
		backgroundColor: "var(--surface-inset)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0.0625rem", style: "solid", color: "var(--accent-teal-main)" },
		animation: "none",
		...baseMotion,
		typography: { ...sans, fontSize: "0.625rem" },
		gradient: "none",
		color: "var(--text-muted)",
		borderRadius: "9999px",
		opacity: 1,
	},
};

export const chatSessionRowActive: PresetDefinition = {
	id: "chat-session-row-active",
	family: "chat",
	variant: "session-row-active",
	label: "Chat Session Row — Active",
	description: "Active session — teal fill (left-edge bar composed in layout)",
	axes: {
		backgroundColor: "var(--accent-teal-fill)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0", style: "none", color: "transparent" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
};

export const chatFrameShell: PresetDefinition = {
	id: "chat-frame-shell",
	family: "chat",
	variant: "frame-shell",
	label: "Chat Frame Shell",
	description: "Outer chat window chrome — layered shadows + teal rim",
	axes: {
		backgroundColor: "var(--surface-chrome)",
		backgroundBlur: "0",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.45)" },
			{ offsetX: "0", offsetY: "0", blur: "0.5rem", spread: "0", color: "var(--accent-teal-glow)" },
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(1 0 0 / 0.06)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "var(--accent-teal-main)" },
		animation: "none",
		...baseMotion,
		typography: sans,
		gradient: "none",
		color: "var(--text-primary)",
		borderRadius: "0.875rem",
		opacity: 1,
	},
};

export const CHAT_PRESETS: readonly PresetDefinition[] = [
	chatBubbleUser,
	chatBubbleAiDeveloper,
	chatBubbleAiPlanning,
	chatBubbleAiImage,
	chatBubbleAiGeneral,
	chatBubbleSystem,
	chatModePillActive,
	chatModePillIdle,
	chatDecisionCard,
	chatVoiceOrbIdle,
	chatVoiceOrbListening,
	chatCortexNode,
	chatSessionRowActive,
	chatFrameShell,
] as const;
