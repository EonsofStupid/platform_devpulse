import type { CouncilConfigCopy, CouncilSeat } from "../../chat/ui/index.js";
import type { FactoryTicket } from "../ui/factory-board/index.js";

/** F0 design data only. Never imported by the production route or runtime. */
export function sampleTickets(): FactoryTicket[] {
	return [
		{
			id: "DP-42",
			title: "Keep shared context coherent across workers",
			stage: "Review",
			priority: "High",
			goal: "Let two agents contribute to one ticket without silently overwriting each other's evidence.",
			origin: "Proposed in chat",
			activity: "Waiting for your acceptance",
			roles: ["Planner", "Fact-checker"],
			revision: 3,
			criteria: [
				"Both contributions retain their author and revision",
				"Conflicting updates require a fresh review",
			],
			evidence: [
				{
					author: "Codex · sample",
					role: "Planner",
					title: "A shared revision, separate contributions",
					detail:
						"Proposed: each worker reads revision 3 and submits an attributed contribution. A stale revision returns a conflict for reconciliation.",
					revision: 3,
				},
				{
					author: "Claude · sample",
					role: "Fact-checker",
					title: "Independent review of the proposal",
					detail:
						"Sample review: the proposed conflict path preserves both contributions and invalidates the earlier decision. This is illustrative evidence, not an executed test report.",
					revision: 3,
				},
			],
			policy: "Review milestones",
		},
		{
			id: "DP-43",
			title: "Make review usable from the keyboard",
			stage: "Working",
			priority: "Normal",
			goal: "Keep every checkpoint reachable and understandable without a pointer.",
			origin: "Created by you",
			activity: "Worker drafting · reviewer queued",
			roles: ["Domain expert", "Skeptic"],
			revision: 1,
			criteria: [
				"Every decision can be reached with the keyboard",
				"Focus returns to the ticket after chat",
			],
			evidence: [],
			policy: "Guide each step",
		},
		{
			id: "DP-44",
			title: "Recover a supervised run after restart",
			stage: "Ready",
			priority: "High",
			goal: "Reconstruct a ticket's last checkpoint before any worker resumes.",
			origin: "Planner proposal",
			activity: "Queued · dependency pending",
			roles: ["Planner"],
			dependency: "DP-42",
			revision: 1,
			criteria: ["Restart preserves the last accepted checkpoint"],
			evidence: [],
			policy: "Review milestones",
		},
		{
			id: "DP-45",
			title: "Bring a review request to your inbox",
			stage: "Intake",
			priority: "Normal",
			goal: "Choose which human checkpoints should send email or push notifications.",
			origin: "Integration idea",
			activity: "Needs scope and delivery setup",
			roles: [],
			revision: 1,
			criteria: ["A notification opens the exact outstanding review"],
			evidence: [],
			policy: "Guide each step",
		},
		{
			id: "DP-41",
			title: "Define the factory's acceptance criteria",
			stage: "Done",
			priority: "Normal",
			goal: "Agree what a finished ticket must prove.",
			origin: "Created by you",
			activity: "Accepted in this sample",
			roles: ["Planner"],
			revision: 2,
			criteria: ["Each ticket carries explicit acceptance criteria"],
			evidence: [
				{
					author: "Planner · sample",
					role: "Planner",
					title: "Proposed ticket contract",
					detail: "A goal, versioned criteria and attributed evidence accompany every work item.",
					revision: 2,
				},
			],
			policy: "Review milestones",
			decision: "Sample acceptance recorded for proposal r2.",
		},
	];
}

export const sampleRoles = [
	["domain-expert", "Domain expert"],
	["planner", "Planner"],
	["fact-checker", "Fact-checker"],
	["skeptic", "Skeptic"],
	["advocate", "Advocate"],
	["dreamer", "Dreamer"],
	["pre-mortem", "Pre-mortem"],
	["realist", "Realist"],
	["red-team", "Red team"],
	["steelman", "Steelman"],
	["selector", "Selector"],
].map(([id, label]) => ({ id: `${id}@1`, label }));

export const sampleProviders = [
	{ id: "codex", label: "Codex · sample", vendor: "openai" },
	{ id: "claude", label: "Claude · sample", vendor: "anthropic" },
	{ id: "remote", label: "Remote OpenAI endpoint · sample", vendor: "openai" },
];

const answererRoles = sampleRoles.filter((role) => role.id !== "selector@1");
const selectorRoles = sampleRoles.filter((role) => role.id === "selector@1");

/** What the sample Council says, so the review keeps its own words. */
export function sampleCouncilCopy(ticketId: string): CouncilConfigCopy {
	return {
		region: "Chat Council configuration",
		eyebrow: `Chat / Council · linked to ${ticketId}`,
		heading: "Different perspectives. Independent judgment.",
		summary: "Choose premade roles and providers for this conversation.",
		back: "Back to ticket",
		role: "Premade role",
		role_aria: "{seat} role",
		agent: "Provider · sample connection",
		agent_aria: "{seat} provider",
		choose_agent: "Choose a provider",
		selector_badge: "Independent",
		answerer_badge: "Blind answer",
		start: "Save Council assignment",
		start_note: "Preview only. Saving assigns these seats; it does not run the Council.",
	};
}

export const sampleCouncilPreset = {
	badge: "Council preset · one round",
	lines: [
		"Three answerers work blind. A selector from another vendor reviews anonymized answers, can choose none, and retains the rationale and dissent.",
		"The ticket receives the selected structured output after review. Private answers are not shared between answerers.",
	],
};

export function sampleSeats(): CouncilSeat[] {
	return [
		{
			id: "answer-1",
			label: "Answerer 1",
			kind: "answerer",
			role: "domain-expert@1",
			provider: "codex",
			roleChoices: answererRoles,
		},
		{
			id: "answer-2",
			label: "Answerer 2",
			kind: "answerer",
			role: "domain-expert@1",
			provider: "codex",
			roleChoices: answererRoles,
		},
		{
			id: "answer-3",
			label: "Answerer 3",
			kind: "answerer",
			role: "domain-expert@1",
			provider: "codex",
			roleChoices: answererRoles,
		},
		{
			id: "selector",
			label: "Selector",
			kind: "selector",
			role: "selector@1",
			provider: "claude",
			roleChoices: selectorRoles,
		},
	];
}
