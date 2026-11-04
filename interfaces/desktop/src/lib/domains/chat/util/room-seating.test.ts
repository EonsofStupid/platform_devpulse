/**
 * @file room-seating.test.ts
 * @module @devpulse/domains/chat/util
 * What the seating screen offers, and what it hands the kernel.
 */
import { describe, expect, test } from "vitest";
import type { Persona, RoleCard, RoomChatCopy, RoomSpec } from "$lib/sys/generated/bindings.js";
import {
	costar,
	draftPlaces,
	findRole,
	jobLabel,
	placeKey,
	placePersona,
	problemsAt,
	resizeSeat,
	roleAccess,
	roleChoices,
	roleRef,
	roomIdFrom,
	roomProblems,
	routingSeat,
	seatJob,
	tailoredRoom,
	toAssignments,
	withAgents,
} from "./room-seating.js";

function role(
	id: string,
	stance: string,
	tools: string[] = [],
	talkOnly = tools.length === 0,
	fields: string[] = ["answer"],
): RoleCard {
	return {
		id,
		version: "1.2.0",
		name: id,
		purpose: `${id} purpose`,
		stance,
		method: { name: `${id} method`, steps: [] },
		permissions: { talk_only: talkOnly, tools_allowed: tools },
		output_contract: { required: fields },
	} as unknown as RoleCard;
}

const expert = role("domain-expert", "generate");
const reviewer = role("code-reviewer", "critique", ["read"], false, ["defects"]);
const fixer = role("fixer", "generate", ["read", "write"], false);
const selector = role("selector", "select", [], true, ["winner"]);
const router = role("router", "plan", [], true, ["place", "escalate"]);
const roles = [expert, reviewer, fixer, selector, router];

const council = {
	id: "council",
	name: "Council",
	version: "1.0.0",
	turn_policy: "parallel",
	selection: { seat: "selector" },
	phases: [
		{ name: "answer", seats: ["answerer"], visibility: "none" },
		{ name: "select", seats: ["selector"], visibility: "anonymized" },
	],
	seats: [
		{ seat: "answerer", role: "domain-expert@1", count: 3, notes: true, personas: ["ada"] },
		{ seat: "selector", role: "selector@1", count: 1, notes: false, personas: [] },
	],
} as unknown as RoomSpec;

const group = {
	id: "group",
	name: "Group",
	version: "1.0.0",
	turn_policy: "round-robin",
	phases: [{ name: "turn", seats: ["member"], visibility: "full" }],
	seats: [{ seat: "member", role: "group-member@1", count: 2 }],
} as unknown as RoomSpec;

const routed = {
	id: "routed",
	turn_policy: "router",
	phases: [{ name: "route", seats: ["router"], visibility: "full" }],
	seats: [{ seat: "router", role: "router@1", count: 1 }],
} as unknown as RoomSpec;

const seatOf = (room: RoomSpec, name: string) => {
	const seat = room.seats.find((candidate) => candidate.seat === name);
	if (!seat) throw new Error(name);
	return seat;
};

describe("what a seat is", () => {
	test("names a place and a role the way the kernel does", () => {
		expect(placeKey("answerer", 0)).toBe("answerer-1");
		expect(roleRef(reviewer)).toBe("code-reviewer@1");
		expect(findRole(roles, "code-reviewer@1")).toBe(reviewer);
		expect(findRole(roles, "code-reviewer@2")).toBeNull();
	});

	test("knows its job in its room", () => {
		expect(seatJob(council, seatOf(council, "answerer"))).toBe("blind");
		expect(seatJob(council, seatOf(council, "selector"))).toBe("selects");
		expect(seatJob(group, seatOf(group, "member"))).toBe("open");
		expect(routingSeat(routed)).toBe("router");
		expect(routingSeat(group)).toBeNull();
		expect(jobLabel({ blind: "Blind" } as RoomChatCopy, "blind")).toBe("Blind");
	});

	test("says what a role may do", () => {
		expect(roleAccess(expert)).toBe("talks");
		expect(roleAccess(reviewer)).toBe("reads");
		expect(roleAccess(role("r", "ground", ["read", "web"], false))).toBe("readsWeb");
		expect(roleAccess(role("w", "ground", ["web"], false))).toBe("web");
		expect(roleAccess(fixer)).toBe("changes");
	});
});

describe("the roles on offer", () => {
	const ids = (list: readonly RoleCard[]) => list.map((candidate) => candidate.id);

	test("a seat that selects is offered only what selects", () => {
		expect(ids(roleChoices(council, seatOf(council, "selector"), roles))).toEqual(["selector"]);
	});

	test("a seat that routes is offered only what names a place", () => {
		expect(ids(roleChoices(routed, seatOf(routed, "router"), roles))).toEqual(["router"]);
	});

	test("a blind seat can read and cannot change things", () => {
		const offered = ids(roleChoices(council, seatOf(council, "answerer"), roles));
		expect(offered).toContain("code-reviewer");
		expect(offered).not.toContain("fixer");
		expect(offered).not.toContain("selector");
	});

	test("an open seat can hold a role that changes things", () => {
		expect(ids(roleChoices(group, seatOf(group, "member"), roles))).toContain("fixer");
	});
});

describe("seating a room", () => {
	test("starts every place, with the judge on another agent where there is one", () => {
		const drafts = draftPlaces(council, ["claude-code", "codex"] as never);
		expect(drafts.map((draft) => placeKey(draft.seat, draft.place))).toEqual([
			"answerer-1",
			"answerer-2",
			"answerer-3",
			"selector-1",
		]);
		expect(drafts[0]?.provider).toBe("claude-code");
		expect(drafts[3]?.provider).toBe("codex");
	});

	test("takes each seat's own word on notes, and yes by default", () => {
		const drafts = draftPlaces(council, ["codex"] as never);
		expect(drafts[0]?.notes).toBe(true);
		expect(drafts[3]?.notes).toBe(false);
		expect(draftPlaces(group, [] as never)[0]?.notes).toBe(true);
	});

	test("empty places fill when your agents become known, and your choices stay", () => {
		const empty = draftPlaces(council, [] as never);
		expect(empty[0]?.provider).toBeNull();
		const chosen = empty.map((draft) =>
			draft.place === 1 ? { ...draft, provider: "gemini" as never } : draft,
		);
		const filled = withAgents(council, chosen, ["claude-code", "codex"] as never);
		expect(filled[0]?.provider).toBe("claude-code");
		expect(filled[1]?.provider).toBe("gemini");
		expect(filled[3]?.provider).toBe("codex");
	});

	test("a place with no agent stays out, so the kernel names it", () => {
		const drafts = draftPlaces(group, [] as never);
		expect(toAssignments(drafts)).toEqual([]);
	});

	test("hands the kernel your choices", () => {
		const [first] = toAssignments(
			draftPlaces(group, ["codex"] as never).map((draft) => ({
				...draft,
				role: "code-reviewer@1",
				persona: "ada",
				notes: false,
			})),
		);
		expect(first).toMatchObject({
			seat: "member",
			place: 0,
			provider: "codex",
			role: "code-reviewer@1",
			persona: "ada",
			notes: false,
		});
	});

	test("a character is yours, the seat's, or none", () => {
		const ada = { id: "ada" } as Persona;
		const bo = { id: "bo" } as Persona;
		const seat = seatOf(council, "answerer");
		const draft = draftPlaces(council, [] as never)[0];
		if (!draft) throw new Error("no place");
		expect(placePersona(draft, seat, [ada, bo])).toBe(ada);
		expect(placePersona({ ...draft, persona: "bo" }, seat, [ada, bo])).toBe(bo);
		expect(placePersona({ ...draft, persona: "" }, seat, [ada, bo])).toBeNull();
	});
});

describe("tailoring", () => {
	test("more places keep what you chose, and a new one starts like the first", () => {
		const drafts = draftPlaces(council, ["claude-code", "codex"] as never).map((draft) =>
			draft.place === 1 ? { ...draft, role: "code-reviewer@1" } : draft,
		);
		const { room, drafts: next } = resizeSeat(drafts, council, "answerer", 4);
		expect(seatOf(room, "answerer").count).toBe(4);
		expect(next.filter((draft) => draft.seat === "answerer")).toHaveLength(4);
		expect(next[1]?.role).toBe("code-reviewer@1");
		expect(next[3]).toMatchObject({ seat: "answerer", place: 3, provider: "claude-code" });
		expect(next.at(-1)?.seat).toBe("selector");
		expect(seatOf(council, "answerer").count).toBe(3);
	});

	test("fewer places drop from the end, and never below one", () => {
		const drafts = draftPlaces(council, ["codex"] as never);
		const { drafts: fewer } = resizeSeat(drafts, council, "answerer", 1);
		expect(fewer.map((draft) => placeKey(draft.seat, draft.place))).toEqual([
			"answerer-1",
			"selector-1",
		]);
		expect(resizeSeat(drafts, council, "answerer", 0).drafts).toHaveLength(4);
	});

	test("your room gets its own id, whatever you call it", () => {
		expect(roomIdFrom("My Council!", [])).toBe("my-council");
		expect(roomIdFrom("My Council", ["my-council"])).toBe("my-council-2");
		expect(roomIdFrom("My Council", ["my-council", "my-council-2"])).toBe("my-council-3");
		expect(roomIdFrom("!!!", [])).toBe("my-room");
		expect(roomIdFrom("3 reviewers", [])).toBe("reviewers");
	});

	test("your room starts from the one on screen", () => {
		const { room } = resizeSeat(draftPlaces(council, [] as never), council, "answerer", 4);
		const tailored = tailoredRoom(room, "  My Council ", ["council"]);
		expect(tailored).toMatchObject({ id: "my-council", name: "My Council", version: "1.0.0" });
		expect(seatOf(tailored, "answerer").count).toBe(4);
		expect(council.id).toBe("council");
	});
});

describe("what you are shown", () => {
	test("a seat's breakdown comes from its role and character", () => {
		const copy = {
			costar_context: "Context",
			costar_objective: "Objective",
			costar_style: "Style",
			costar_tone: "Tone",
			costar_audience: "Audience",
			costar_response: "Response",
			context_blind: "Blind",
			context_open: "Open",
			tone_own: "Its own",
			audience_you: "You",
			audience_selector: "The {seat}",
		} as RoomChatCopy;
		const seat = seatOf(council, "answerer");
		const lines = costar(copy, council, seat, reviewer, null);
		expect(lines.map((line) => line.label)).toEqual([
			"Context",
			"Objective",
			"Style",
			"Tone",
			"Audience",
			"Response",
		]);
		expect(lines.map((line) => line.text)).toEqual([
			"Blind",
			"code-reviewer purpose",
			"code-reviewer method",
			"Its own",
			"The selector",
			"defects",
		]);
		const withCharacter = costar(copy, group, seatOf(group, "member"), expert, {
			tone: "strict",
		} as Persona);
		expect(withCharacter[0]?.text).toBe("Open");
		expect(withCharacter[3]?.text).toBe("strict");
		expect(withCharacter[4]?.text).toBe("You");
	});

	test("the kernel's problems land at their place, or on the room", () => {
		const issues = [
			{ at: "room council · answerer-1", problem: "needs an agent" },
			{ at: "room council · answerer-1", problem: "needs its domain" },
			{ at: "room council · selection", problem: "same vendor" },
		];
		expect(problemsAt(issues, "answerer-1")).toEqual(["needs an agent", "needs its domain"]);
		expect(problemsAt(issues, "answerer-2")).toEqual([]);
		expect(roomProblems(issues, ["answerer-1"])).toEqual(["same vendor"]);
	});
});
