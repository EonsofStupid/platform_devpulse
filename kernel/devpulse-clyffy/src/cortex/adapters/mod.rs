/// KV cache strategies (attention sink, sliding window).
pub mod kv_cache;
/// Persistence adapters (`Turso`, `DuckDB`, `SurrealDB`, `flatfile`, `KV`).
pub mod persistence;
/// Safety adapters (`GUARDIAN` AST scanner, verification buffer).
pub mod safety;
