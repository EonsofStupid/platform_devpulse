/**
 * @module @devpulse/domains/infra/surrealdb_sidecar
 *
 * Public API for the SurrealDB sidecar devtool domain.
 */

export type {
	SurrealdbSidecarHealth,
	SurrealdbSidecarStatus,
	SurrealdbSidecarUserConfig,
} from "$lib/sys/generated/bindings.js";
export { surrealdbSidecar } from "./data-access/surrealdbSidecar.state.svelte.js";
export {
	surrealdbSidecarConfigLoad,
	surrealdbSidecarConfigSave,
	surrealdbSidecarHealth,
	surrealdbSidecarStatus,
} from "./data-access/surrealdbSidecar.svc.js";
