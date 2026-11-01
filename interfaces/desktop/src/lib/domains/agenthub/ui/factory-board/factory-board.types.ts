/** Presentation contracts for the factory. Not database or execution DTOs. */
export type TicketStage = "Intake" | "Ready" | "Working" | "Review" | "Done";
export type Supervision = "Guide each step" | "Review milestones" | "Work within limits";

export interface FactoryTicket {
	id: string;
	title: string;
	goal: string;
	stage: TicketStage;
	priority: "High" | "Normal";
	origin: string;
	activity: string;
	roles: string[];
	dependency?: string;
	revision: number;
	criteria: string[];
	evidence: { author: string; role: string; title: string; detail: string; revision: number }[];
	policy: Supervision;
	correction?: string;
	decision?: string;
}

export interface FactoryBoardProps {
	tickets: FactoryTicket[];
	selectedId?: string;
	onSelect: (id: string) => void;
	onCreate: () => void;
}
