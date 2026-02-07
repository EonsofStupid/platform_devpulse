/**
 * @fileoverview general.ts
 * @file src/lib/cfg/maestro/general.ts
 * @module @devpulse/cfg/maestro/general
 * @layer lib
 *
 * @description
 * [TODO: Describe the purpose and responsibility of this module]
 *
 * @dependencies
 * - [TODO: List imports this file depends on]
 *
 * @consumers
 * - [TODO: List modules that import this file]
 *
 * @vpb-editable [TODO: List props VPB can modify, or 'none']
 * @since 1.0.0
 */

// MAESTRO CONFIGURATION (The AI Kernel)
// Persistence: SurrealDB (Embedded) + RocksDB (Connectors)
// Serialization: Rkyv

export interface MCPConfig {
	endpoints: string[];
	allowed_tools: string[];
}

export interface MinionConfig {
	default_persona: "Architect" | "Engineer" | "Creative";
	voice_enabled: boolean;
}

export const maestroConfig = {
	// Identity
	system_name: "Maestro",
	version: "1.0.0",

	// Kernel Settings
	minions: {
		default_persona: "Architect",
		voice_enabled: false,
	} as MinionConfig,

	// Connector Settings (MCP)
	mcp: {
		endpoints: ["http://localhost:3000/mcp"],
		allowed_tools: ["filesystem", "browser"],
	} as MCPConfig,

	// Storage Paths (Relative to AppData)
	storage: {
		surreal_path: "surreal_v1",
		rocksdb_path: "connectors_v1",
		use_rkyv: true,
	},
};
