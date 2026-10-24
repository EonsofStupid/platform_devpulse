//! The `Onboarding` state — what first run looks like right now. Rust
//! computes it; every window renders it and none recomputes it.

use serde::{Deserialize, Serialize};
use specta::Type;

use super::flow::Stage;

/// Where first run stands.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum OnboardingStatus {
    /// First run is showing.
    Open,
    /// You chose "Set up later"; the dashboard shows, and first run can be
    /// reopened at any time.
    Later,
    /// First run is finished.
    Complete,
}

/// Something the current stage still needs before you can continue.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum Requirement {
    /// Your name.
    Name,
}

/// A folder on this machine that holds git repositories.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DetectedFolder {
    /// The folder.
    pub path: String,
    /// Git repositories directly inside it.
    pub repo_count: u32,
}

/// What first run found on this machine without asking (Welcome's chips).
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Detected {
    /// Detection has finished; until then the UI says it is looking.
    pub done: bool,
    /// Your name, as git knows it.
    pub git_name: Option<String>,
    /// Folders that hold repositories, most first.
    pub folders: Vec<DetectedFolder>,
}

/// The first-run state published as the `onboarding` signal.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingState {
    /// Where first run stands.
    pub status: OnboardingStatus,
    /// The stage to show.
    pub stage: Stage,
    /// Every stage, in order.
    pub stages: Vec<Stage>,
    /// What the stage still needs; empty means you can continue.
    pub needs: Vec<Requirement>,
    /// Why your flow file was not used, if it wasn't.
    pub flow_problem: Option<String>,
    /// What was found on this machine so far.
    pub detected: Detected,
}
