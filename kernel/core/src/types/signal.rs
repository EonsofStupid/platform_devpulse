use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;
use crate::adapter::AdapterKind;

/// The fundamental atomic unit of the platform (The Envelope).
/// A Signal is an Envelope containing a Header (Context) and a Kind (Payload).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    #[serde(flatten)]
    pub header: Header,        // The Shipping Label (Routing, Tracing, Context)
    
    #[serde(flatten)]
    pub kind: SignalKind,      // The Content (Payload)
}

/// The Shipping Label. 
/// Engine uses this to route signals without needing to understand the Payload.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Header {
    pub id: Uuid,              // v7 (Time-ordered)
    pub correlation_id: Uuid,  // Trace back to origin (Conversation or Lane ID)
    pub source: Source,        // "Who sent this?"
    pub created_at: DateTime<Utc>,
    pub importance: u8,        // 0-255 priority
}

/// The Master Enum.
/// Distinguishes between "Public Standard" signals (Engine logic)
/// and "Proprietary" signals (Maestro IP).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "payload")]
pub enum SignalKind {
    Standard(StandardSignal),
    Proprietary(ProprietarySignal),
    Control(ControlSignal),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", content = "data")]
pub enum StandardSignal {
    Chat(ChatSignal),
    Interaction(InteractionSignal),
    Perception(PerceptionSignal),
    Telemetry(TelemetrySignal),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", content = "data")]
pub enum ProprietarySignal {
    Governance(GovernanceSignal),
    Heuristic(HeuristicSignal),
    Lane(LaneSignal),
    Context(ContextSignal),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ControlSignal {
    Halt,
    Ping,
    Ack(Uuid),
}

// --- Variant Definitions ---

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Source {
    System,
    User(Uuid),
    Agent(String), // "Gus", "Critic"
    External(AdapterKind),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ChatSignal { 
    pub content: String, 
    pub attachments: Vec<String> 
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct InteractionSignal {
    pub tool_id: String,
    pub input: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PerceptionSignal {
    pub source: String, // "screen", "ide", "extension"
    pub payload: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TelemetrySignal {
    pub metric: String,
    pub value: f64,
    pub attributes: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GovernanceSignal {
    pub verdict: String, // "allow", "block", "warn"
    pub reason: String,
    pub policy_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HeuristicSignal {
    pub name: String, // "UserFrustration", "CognitiveLoad"
    pub score: f32,
    pub context: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LaneSignal {
    pub lane_id: String,
    pub status: String,
    pub step: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ContextSignal {
    pub band_color: String, // "Red", "Teal", "Green"
    pub missing_fields: Vec<String>,
}

// Re-export specific structs if needed directly, but usually accessed via enum
