/// KV cache strategies (attention sink, sliding window).
pub mod kv_cache;
/// Persistence adapters (`libSQL`, `DuckDB`, `SurrealDB`, `flatfile`, `KV`).
pub mod persistence;
/// Reasoning adapters (`HMM` chains, transition matrices).
pub mod reasoning;
/// Safety adapters (`GUARDIAN` AST scanner, verification buffer).
pub mod safety;
