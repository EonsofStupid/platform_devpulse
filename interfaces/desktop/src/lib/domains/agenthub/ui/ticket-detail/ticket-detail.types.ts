import type { FactoryTicket, Supervision } from "../factory-board/index.js";

export interface TicketDetailProps {
	ticket: FactoryTicket;
	onCouncil: () => void;
	onPolicy: (policy: Supervision) => void;
	onDecision: (decision: "accept" | "changes", revision: number, note: string) => void;
	onClose: () => void;
}
