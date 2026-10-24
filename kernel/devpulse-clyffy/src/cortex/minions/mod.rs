/// Diary minion — persistent memory journal.
pub mod diary;
/// Factory — minion creation and lifecycle.
pub mod factory;
/// Guardian minion — safety and policy enforcement.
pub mod guardian;
/// Core minion types and traits.
#[allow(clippy::module_inception)]
pub mod minions;
/// Minion roles, voice tones and the minion persona.
pub mod types;
