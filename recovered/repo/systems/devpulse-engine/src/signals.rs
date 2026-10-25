use serde::{Serialize, Deserialize};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SignalEnvelope {
    pub id: Uuid,
    pub kind: String,
    pub payload: String,
}
