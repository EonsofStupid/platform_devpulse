/** Durable ticket intake, owned by the platform user database. */
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface Ticket {
	id: string;
	projectId: string;
	title: string;
	goal: string;
	criteria: string[];
	revision: number;
	createdAt: number;
}

export function listTickets(projectId: string): Promise<Ticket[]> {
	return invoke("agenthub_tickets", { projectId });
}

export function createTicket(projectId: string, title: string, goal: string, criteria: string[]): Promise<Ticket> {
	return invoke("agenthub_create_ticket", { projectId, title, goal, criteria });
}

export function onTicketsChanged(callback: (projectId: string) => void) {
	return listen<string>("agenthub-tickets-changed", (event) => callback(event.payload));
}
