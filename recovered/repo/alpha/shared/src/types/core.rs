// shared/src/types/core.rs

//! Core Enums (SSOT)
//! 
//! Strictly typed Enums for all domain concepts.
//! NO STRINGS allowed for these concepts.

use serde::{Deserialize, Serialize};
use strum::{Display, EnumString, EnumIter, IntoStaticStr};

/// Who created the signal/message?
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[derive(Display, EnumString, EnumIter, IntoStaticStr)]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum Source {
    User,
    System,
    Expert, // AI Agent
    Clock,  // Cron/Time
}

/// Where does the signal go?
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[derive(Display, EnumString, EnumIter, IntoStaticStr)]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum Sink {
    Wire,      // Svelte
    Durable,   // libSQL
    Analytics, // DuckDB
    Cache,     // moka
    Vector,    // RRO
}

/// Chat message role (Strict)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[derive(Display, EnumString, EnumIter, IntoStaticStr)]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum Role {
    User,
    Assistant, // Gus
    System,    // System Prompt
    Tool,      // Tool Output
}

/// System Components
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[derive(Display, EnumString, EnumIter, IntoStaticStr)]
#[serde(rename_all = "snake_case")]
#[strum(serialize_all = "snake_case")]
pub enum Component {
    Llm,
    Embedder,
    Reranker,
    Rro,   // Retrieval
    Voice, // TTS/STT
}
