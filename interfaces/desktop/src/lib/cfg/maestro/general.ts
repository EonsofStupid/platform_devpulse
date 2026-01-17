// MAESTRO CONFIGURATION (The AI Kernel)
// Persistence: SurrealDB (Embedded) + RocksDB (Connectors)
// Serialization: Rkyv

export interface MCPConfig {
    endpoints: string[];
    allowed_tools: string[];
}

export interface MinionConfig {
    default_persona: 'Architect' | 'Engineer' | 'Creative';
    voice_enabled: boolean;
}

export const maestroConfig = {
    // Identity
    system_name: "Maestro",
    version: "1.0.0",
    
    // Kernel Settings
    minions: {
        default_persona: 'Architect',
        voice_enabled: false
    } as MinionConfig,

    // Connector Settings (MCP)
    mcp: {
        endpoints: ["http://localhost:3000/mcp"],
        allowed_tools: ["filesystem", "browser"]
    } as MCPConfig,

    // Storage Paths (Relative to AppData)
    storage: {
        surreal_path: "surreal_v1",
        rocksdb_path: "connectors_v1",
        use_rkyv: true
    }
};
