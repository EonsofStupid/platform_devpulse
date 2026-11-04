/**
 * @file sys/contracts/index.ts
 * @module @devpulse/sys/contracts
 * @description Barrel export for all system contracts
 */

// Artifact model
export {
	type ArtifactEntry,
	ArtifactEntryContract,
	type ArtifactId,
	ArtifactIdContract,
	type ArtifactKind,
	ArtifactKindContract,
	artifactKinds,
	createArtifactId,
	type HubId,
	HubIdContract,
	hubIds,
	isArtifactKind,
	isHubId,
	parseArtifactId,
} from "./common/artifact.js";
// Domain contracts (re-export all domains)
export * from "./domains/app/index.js";
// Registry contracts
export type {
	ObservableRegistry,
	Registry,
	RegistryEvent,
	RegistryEventType,
} from "./registry/registry.contract.js";
// Routing contracts - domain
export {
	type DomainMetadata,
	DomainMetadataContract,
	type DomainRegistry,
	type DomainStatus,
	DomainStatusContract,
	defineDomain,
} from "./routing/domain.contract.js";
// Routing contracts - routes
export {
	type HubMetadata,
	HubMetadataContract,
	type RouteGroupInventory,
	RouteGroupInventoryContract,
	type RouteInventoryItem,
	RouteInventoryItemContract,
	type RoutesInventory,
	RoutesInventoryContract,
} from "./routing/routes.contract.js";
// State contracts
export {
	type DomainStatePath,
	type StateModuleContract,
	type StateModuleMetadata,
	StateModuleMetadataContract,
	type StateRegistry,
} from "./state/state.contract.js";
// Stream contracts
export {
	type StreamMetadata,
	StreamMetadataContract,
	type StreamStatus,
	StreamStatusContract,
	type StreamsRegistry,
} from "./streams/streams.contract.js";
