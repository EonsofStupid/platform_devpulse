import type { PermissionChoice } from "#lib/sys/generated/bindings.js";

/** Presentation contract shared by live chat and the component review fixture. */
export interface AgentTurnProps {
	message: string;
	permission: { title: string; choices: PermissionChoice[] } | null;
	cancelLabel: string;
	refuseLabel: string;
	onAnswer: (choice: string | null) => void;
	onCancel: () => void;
}
