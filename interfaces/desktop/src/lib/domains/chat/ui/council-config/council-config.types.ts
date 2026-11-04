import type { Snippet } from "svelte";
import type { AgentChatCopy } from "$lib/sys/generated/bindings.js";

/** One line of what a seat is told. */
export interface CouncilCostarLine {
	label: string;
	text: string;
}

/** A value a place's role needs from you. */
export interface CouncilSeatValue {
	name: string;
	label: string;
	description: string;
	value: string;
}

/** Something to choose from. */
export interface CouncilChoice {
	id: string;
	label: string;
	/** Why it cannot be chosen yet. */
	unavailable?: string;
}

/** One place of a room, as the screen shows it. */
export interface CouncilSeat {
	id: string;
	label: string;
	role: string;
	provider: string;
	kind: "answerer" | "selector";
	/** Its own list of roles, when not every role fits it. */
	roleChoices?: readonly CouncilChoice[];
	/** Its character, `""` for none. Absent, it has no choice of one. */
	persona?: string;
	/** Whether it gets your notes. Absent, it has no switch. */
	notes?: boolean;
	/** What it is for in its room. */
	job?: string;
	/** What it may do. */
	access?: string;
	/** What stops it, in the kernel's words. */
	problems?: readonly string[];
	/** Values its role needs. */
	values?: readonly CouncilSeatValue[];
	/** What it is told. */
	costar?: readonly CouncilCostarLine[];
}

/** The screen's words, so a room and a sample can each say their own. */
export interface CouncilConfigCopy {
	region: string;
	eyebrow: string;
	heading: string;
	summary: string;
	back: string;
	role: string;
	/** `{seat} role`, for assistive technology. */
	role_aria: string;
	agent: string;
	/** `{seat} agent`, for assistive technology. */
	agent_aria: string;
	choose_agent: string;
	character?: string;
	/** `{seat} character`, for assistive technology. */
	character_aria?: string;
	no_character?: string;
	/** What a seat is told. */
	costar_title?: string;
	/** A seat that judges, when it has no job of its own to show. */
	selector_badge?: string;
	/** A seat that answers, when it has no job of its own to show. */
	answerer_badge?: string;
	start: string;
	/** Said beside the start button. */
	start_note?: string;
}

export interface CouncilConfigProps {
	copy: CouncilConfigCopy;
	seats: readonly CouncilSeat[];
	roles: readonly CouncilChoice[];
	providers: readonly CouncilChoice[];
	/** The characters to choose from. */
	personas?: readonly CouncilChoice[];
	/** The notes switch's words, when seats have one. */
	notesCopy?: AgentChatCopy;
	/** What this room is, above its seats. */
	preset?: { badge: string; lines: readonly string[] };
	/** Why it cannot start, for the whole room. */
	validation: string | null;
	/** It is starting or saving. */
	busy?: boolean;
	onChange: (id: string, field: "role" | "provider" | "persona", value: string) => void;
	/** Change a value a place's role needs. */
	onValue?: (id: string, name: string, value: string) => void;
	onNotes?: (id: string, on: boolean) => void;
	/** Opens the page that chooses your notes. */
	onChooseNotes?: () => void;
	onSave: () => void;
	onBack: () => void;
	/** What sits between the seats and the start button. */
	children?: Snippet;
}
