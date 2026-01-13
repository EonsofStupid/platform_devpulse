// orchestrator/src/infra/llm/grammars/mod.rs

//! Built-in GFNF grammars for constrained generation
//! 
//! These are used when `GrammarConfig` specifies a built-in grammar.

/// Mission Plan Grammar (JSON-like structure for reasoning)
pub const MISSION_PLAN: &str = include_str!("mission_plan.gbnf");

/// JSON Object Grammar (Generic JSON object)
pub const JSON_OBJECT: &str = include_str!("json_object.gbnf");
