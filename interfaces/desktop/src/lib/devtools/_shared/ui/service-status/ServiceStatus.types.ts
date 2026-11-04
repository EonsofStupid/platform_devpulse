import type { ServiceStatusSnapshot } from "#lib/sys/generated/bindings.js";

export interface ServiceStatusProps {
	service: ServiceStatusSnapshot;
}
