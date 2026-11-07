/** Presentation contracts for the factory. Not database or execution DTOs. */
export type TicketStage = "Intake" | "Ready" | "Working" | "Review" | "Done";
export type Supervision = "Guide each step" | "Review milestones" | "Work within limits";

export interface FactoryBoardTicket {
	id: string;
	title: string;
	stage: TicketStage;
	priority?: "High" | "Normal";
	activity: string;
	roles: string[];
	dependency?: string;
	criteria: string[];
	evidence: { author: string; role: string; title: string; detail: string; revision: number }[];
}

export interface FactoryTicket extends FactoryBoardTicket {
	goal: string;
	origin: string;
	revision: number;
	policy: Supervision;
	correction?: string;
	decision?: string;
}

export interface FactoryBoardProps {
	tickets: FactoryBoardTicket[];
	selectedId?: string;
	onSelect: (id: string) => void;
	onCreate: () => void;
}
