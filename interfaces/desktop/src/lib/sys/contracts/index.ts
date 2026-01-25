/**
 * @file sys/contracts/index.ts
 * @module @devpulse/sys/contracts
 * @description Barrel export for all system contracts
 */

// Core contracts
export type {
  Registry,
  RegistryEvent,
  RegistryEventType,
  ObservableRegistry,
} from './core/registry.contract.js';

// Routing contracts - domain
export type {
  DomainMetadata,
  DomainStatus,
  DomainRegistry,
} from './routing/domain.contract.js';

// Routing contracts - routes
export type {
  RouteParamType,
  RouteParam,
  SearchParamDef,
  FormActionDef,
  RouteMetadata,
  HubMetadata,
  RouteInventoryItem,
  RouteGroupInventory,
  RoutesInventory,
  RouteFunction,
  RoutesRegistry,
} from './routing/routes.contract.js';

// State contracts
export type {
  StateModuleMetadata,
  StatePropertyDef,
  StateActionDef,
  StateModuleContract,
  DomainStatePath,
  StateRegistry,
} from './state/state.contract.js';

// Stream contracts
export type {
  StreamStatus,
  StreamMetadata,
  StreamMessage,
  StreamSubscription,
  StreamContract,
  StreamFactory,
  StreamsRegistry,
} from './streams/streams.contract.js';

// Domain contracts (re-export all domains)
export {
  DEVPULSE_DOMAIN,
  UIDEMO_DOMAIN,
  OVERMIND_DOMAIN,
  WIREDFRONT_DOMAIN,
  DEVFORGE_DOMAIN,
  MAESTRO_DOMAIN,
  APP_DOMAINS,
} from './domains/app/index.js';

export type {
  DevPulseFeature,
  WiredFrontFeature,
} from './domains/app/index.js';
