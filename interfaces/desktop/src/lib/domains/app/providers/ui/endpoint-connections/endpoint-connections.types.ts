/**
 * @file endpoint-connections.types.ts
 * @module @devpulse/domains/app/providers/ui/endpoint-connections
 * Presentation inputs and intents from the generated kernel/engine contract.
 */
import type {
	ConnectionOption,
	ConnectionsState,
	EndpointCopy,
	SaveConnection,
} from "$lib/sys/generated/bindings.js";

export interface EndpointConnectionsProps {
	copy: EndpointCopy;
	state: ConnectionsState | null;
	options: ConnectionOption[];
	busy: boolean;
	onSave: (request: SaveConnection) => Promise<boolean>;
	onCheck: (id: string) => Promise<void>;
	onRemove: (id: string) => Promise<void>;
}
