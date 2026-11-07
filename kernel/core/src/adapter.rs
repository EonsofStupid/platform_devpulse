use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AdapterKind {
    GitHub,
    Linear,
    Discord,
    Slack,
    Terminal,
    VsCode,
    Unknown(String),
}
