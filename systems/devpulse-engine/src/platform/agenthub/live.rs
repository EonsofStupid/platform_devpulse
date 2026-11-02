//! Retained execution observations. Placement on a board is a separate concern.

use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use devpulse_clyffy::providers::{AgentEvent, PermissionChoice, ProviderId};
use serde::{Deserialize, Serialize};
use specta::Type;
use tokio::sync::watch;
use uuid::Uuid;

/// Observed activity, never inferred from a transcript's modification time.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum Activity {
    /// Execution and its persistence attempt have ended; this is not success.
    Idle,
    /// Execution or persistence is in progress.
    Working,
    /// At least one permission is actionable.
    WaitingForYou,
}

/// An actionable request, retained until the provider resolves it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PendingPermission {
    /// Provider request identity.
    pub request: String,
    /// Provider's explanation.
    pub title: String,
    /// The provider's offered choices.
    pub choices: Vec<PermissionChoice>,
}

/// One unfinished tool call.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LiveTool {
    /// Provider tool identity.
    pub id: String,
    /// Provider's description.
    pub title: String,
}

/// The latest observed turn of an agent, room run or room seat.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LiveConversation {
    /// Canonical chat session.
    pub session_id: String,
    /// Canonical project.
    pub project_id: String,
    /// Room seat, or none for an agent/root room run.
    pub place: Option<String>,
    /// None only for the room run itself.
    pub provider_id: Option<ProviderId>,
    /// Changes for each new turn, guarding late events from an older turn.
    pub turn_id: String,
    /// Current activity, independent of success and card placement.
    pub activity: Activity,
    /// Current stream; retained on failure, cleared after successful persistence.
    pub text: String,
    /// All unfinished tools, in observed order.
    pub tools: Vec<LiveTool>,
    /// All actionable permissions, in observed order.
    pub permissions: Vec<PendingPermission>,
    /// A terminal execution or persistence failure.
    pub error: Option<String>,
    /// Provider stop reason, only after completion persistence.
    pub stop: Option<String>,
}

/// A consistent snapshot. A different epoch replaces all old observations.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LiveSnapshot {
    /// Identity of this runtime instance.
    pub epoch: String,
    /// Monotonically increasing within this epoch.
    pub revision: u64,
    /// Conversations actually observed by this runtime; absent means unknown.
    pub conversations: Vec<LiveConversation>,
}

/// One authority, shared by all execution owners. Watch notifications coalesce;
/// callers always fetch a complete snapshot, never replay token deltas.
pub struct LiveState {
    state: watch::Sender<LiveSnapshot>,
}

impl Default for LiveState {
    fn default() -> Self {
        Self {
            state: watch::channel(LiveSnapshot {
                epoch: Uuid::new_v4().to_string(),
                revision: 0,
                conversations: vec![],
            })
            .0,
        }
    }
}

impl LiveState {
    /// Clone one consistent view. No provider or database work is performed.
    pub fn snapshot(&self) -> LiveSnapshot {
        self.state.borrow().clone()
    }

    /// Subscribe before fetching a snapshot to avoid missing a concurrent change.
    pub fn subscribe(&self) -> watch::Receiver<LiveSnapshot> {
        self.state.subscribe()
    }

    pub(in crate::platform) fn begin(
        self: &Arc<Self>,
        session_id: &str,
        project_id: &str,
        place: Option<String>,
        provider_id: Option<ProviderId>,
    ) -> Observation {
        let turn_id = Uuid::new_v4().to_string();
        let conversation = LiveConversation {
            session_id: session_id.into(),
            project_id: project_id.into(),
            place,
            provider_id,
            turn_id: turn_id.clone(),
            activity: Activity::Working,
            text: String::new(),
            tools: vec![],
            permissions: vec![],
            error: None,
            stop: None,
        };
        self.state.send_modify(|state| {
            state.conversations.retain(|old| {
                old.session_id != conversation.session_id || old.place != conversation.place
            });
            state.conversations.push(conversation);
            refresh_rooms(state);
            state.revision += 1;
        });
        Observation {
            state: Arc::clone(self),
            turn_id,
            provider_ended: AtomicBool::new(false),
        }
    }
}

/// Kept alive through persistence. Dropping an unfinished task invalidates its
/// waiting permissions and exposes failure instead of leaving it working forever.
pub(in crate::platform) struct Observation {
    state: Arc<LiveState>,
    turn_id: String,
    provider_ended: AtomicBool,
}

fn refresh_rooms(state: &mut LiveSnapshot) {
    let waiting: Vec<String> = state
        .conversations
        .iter()
        .filter(|turn| turn.place.is_some() && turn.activity == Activity::WaitingForYou)
        .map(|turn| turn.session_id.clone())
        .collect();
    for turn in &mut state.conversations {
        if turn.place.is_none() && turn.provider_id.is_none() && turn.activity != Activity::Idle {
            turn.activity = if waiting.contains(&turn.session_id) {
                Activity::WaitingForYou
            } else {
                Activity::Working
            };
        }
    }
}

impl Observation {
    fn update(&self, change: impl FnOnce(&mut LiveConversation)) {
        self.state.state.send_if_modified(|state| {
            let Some(turn) = state
                .conversations
                .iter_mut()
                .find(|turn| turn.turn_id == self.turn_id && turn.activity != Activity::Idle)
            else {
                return false;
            };
            change(turn);
            refresh_rooms(state);
            state.revision += 1;
            true
        });
    }

    pub(in crate::platform) fn observe(&self, event: &AgentEvent) {
        if self.provider_ended.load(Ordering::SeqCst) {
            return;
        }
        if event.ends_turn() {
            self.provider_ended.store(true, Ordering::SeqCst);
        }
        if matches!(event, AgentEvent::Thought { .. }) {
            return;
        }
        self.update(|turn| {
            match event {
                AgentEvent::Text { text } => turn.text.push_str(text),
                AgentEvent::Tool { id, title, status } => {
                    if status == "done" || status == "failed" {
                        turn.tools.retain(|tool| tool.id != *id);
                    } else if let Some(tool) = turn.tools.iter_mut().find(|tool| tool.id == *id) {
                        if !title.is_empty() {
                            tool.title.clone_from(title);
                        }
                    } else {
                        turn.tools.push(LiveTool {
                            id: id.clone(),
                            title: title.clone(),
                        });
                    }
                }
                AgentEvent::PermissionAsked {
                    request,
                    title,
                    choices,
                } => {
                    turn.permissions
                        .retain(|permission| permission.request != *request);
                    turn.permissions.push(PendingPermission {
                        request: request.clone(),
                        title: title.clone(),
                        choices: choices.clone(),
                    });
                }
                AgentEvent::PermissionResolved { request } => turn
                    .permissions
                    .retain(|permission| permission.request != *request),
                AgentEvent::TurnEnded { .. } | AgentEvent::Failed { .. } => {
                    turn.permissions.clear();
                    turn.tools.clear();
                }
                AgentEvent::Thought { .. } => {}
            }
            // A provider's ending still needs a persistence attempt.
            turn.activity = if turn.permissions.is_empty() {
                Activity::Working
            } else {
                Activity::WaitingForYou
            };
        });
    }

    pub(in crate::platform) fn finish(&self, event: &AgentEvent) {
        self.update(|turn| {
            turn.activity = Activity::Idle;
            turn.permissions.clear();
            turn.tools.clear();
            match event {
                AgentEvent::Failed { message } => turn.error = Some(message.clone()),
                AgentEvent::TurnEnded { stop } => {
                    turn.stop = Some(stop.clone());
                    turn.text.clear();
                }
                _ => turn.error = Some("Execution ended without a terminal result".into()),
            }
        });
    }
}

impl Drop for Observation {
    fn drop(&mut self) {
        self.finish(&AgentEvent::Failed {
            message: "The live turn ended before completion could be recorded".into(),
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn permission(id: &str) -> AgentEvent {
        AgentEvent::PermissionAsked {
            request: id.into(),
            title: id.into(),
            choices: vec![],
        }
    }

    #[test]
    fn independent_threads_and_room_seats_reconstruct_all_pending_requests() {
        let live = Arc::new(LiveState::default());
        let a = live.begin("a", "p", None, Some(ProviderId::Codex));
        let b = live.begin("b", "p", None, Some(ProviderId::Codex));
        let seat = live.begin(
            "room",
            "p",
            Some("author-1".into()),
            Some(ProviderId::Codex),
        );
        a.observe(&AgentEvent::Text {
            text: "answer so far".into(),
        });
        a.observe(&permission("one"));
        a.observe(&permission("two"));
        b.observe(&permission("other"));
        a.observe(&AgentEvent::PermissionResolved {
            request: "one".into(),
        });
        let snapshot = live.snapshot();
        assert_eq!(snapshot.conversations.len(), 3);
        assert_eq!(snapshot.conversations[0].text, "answer so far");
        assert_eq!(snapshot.conversations[0].permissions[0].request, "two");
        assert_eq!(snapshot.conversations[0].activity, Activity::WaitingForYou);
        assert_eq!(snapshot.conversations[2].activity, Activity::Working);
        drop(seat);
        assert!(live.snapshot().conversations[2].error.is_some());
    }

    #[test]
    fn provider_end_waits_for_persistence_and_failed_output_survives() {
        let live = Arc::new(LiveState::default());
        let turn = live.begin("a", "p", None, Some(ProviderId::Codex));
        turn.observe(&AgentEvent::Text {
            text: "retain me".into(),
        });
        turn.observe(&permission("one"));
        turn.observe(&AgentEvent::TurnEnded {
            stop: "end_turn".into(),
        });
        turn.observe(&permission("too late, while saving"));
        assert_eq!(live.snapshot().conversations[0].activity, Activity::Working);
        assert_eq!(live.snapshot().conversations[0].permissions.len(), 0);
        turn.finish(&AgentEvent::Failed {
            message: "save failed".into(),
        });
        turn.observe(&permission("late"));
        let snapshot = live.snapshot();
        assert_eq!(snapshot.conversations[0].activity, Activity::Idle);
        assert_eq!(snapshot.conversations[0].text, "retain me");
        assert_eq!(snapshot.conversations[0].permissions.len(), 0);
    }

    #[test]
    fn a_new_turn_rejects_old_events_and_success_clears_the_stream() {
        let live = Arc::new(LiveState::default());
        let old = live.begin("a", "p", None, Some(ProviderId::Codex));
        let current = live.begin("a", "p", None, Some(ProviderId::Codex));
        drop(old);
        assert_eq!(live.snapshot().conversations[0].activity, Activity::Working);
        current.observe(&AgentEvent::Text {
            text: "saved".into(),
        });
        current.finish(&AgentEvent::TurnEnded {
            stop: "end_turn".into(),
        });
        assert_eq!(live.snapshot().conversations[0].text, "");
        assert!(live.snapshot().conversations[0].error.is_none());
    }

    #[tokio::test]
    async fn subscribe_then_snapshot_cannot_miss_changes_and_epochs_are_distinct() {
        let live = Arc::new(LiveState::default());
        let mut window = live.subscribe();
        let initial = live.snapshot();
        let _turn = live.begin("a", "p", None, Some(ProviderId::Codex));
        assert!(window.changed().await.is_ok());
        let current = live.snapshot();
        assert!(current.revision > initial.revision);
        assert_eq!(current.epoch, initial.epoch);
        assert_ne!(LiveState::default().snapshot().epoch, initial.epoch);
    }

    #[test]
    fn a_room_waits_for_any_seat_and_stays_working_until_its_outcome_is_saved() {
        let live = Arc::new(LiveState::default());
        let room = live.begin("room", "p", None, None);
        let first = live.begin("room", "p", Some("a".into()), Some(ProviderId::Codex));
        let second = live.begin("room", "p", Some("b".into()), Some(ProviderId::Codex));
        first.observe(&permission("one"));
        second.observe(&permission("two"));
        assert_eq!(
            live.snapshot().conversations[0].activity,
            Activity::WaitingForYou
        );
        first.observe(&AgentEvent::PermissionResolved {
            request: "one".into(),
        });
        assert_eq!(
            live.snapshot().conversations[0].activity,
            Activity::WaitingForYou
        );
        drop(second);
        assert_eq!(live.snapshot().conversations[0].activity, Activity::Working);
        first.finish(&AgentEvent::TurnEnded {
            stop: "end_turn".into(),
        });
        assert_eq!(live.snapshot().conversations[0].activity, Activity::Working);
        room.finish(&AgentEvent::Failed {
            message: "outcome save failed".into(),
        });
        assert_eq!(live.snapshot().conversations[0].activity, Activity::Idle);
        assert!(live.snapshot().conversations[0].error.is_some());
    }

    #[test]
    fn parallel_tool_completion_does_not_clear_another_tool() {
        let live = Arc::new(LiveState::default());
        let turn = live.begin("a", "p", None, Some(ProviderId::Codex));
        for (id, title) in [("a", "Read"), ("b", "Test")] {
            turn.observe(&AgentEvent::Tool {
                id: id.into(),
                title: title.into(),
                status: "running".into(),
            });
        }
        turn.observe(&AgentEvent::Tool {
            id: "b".into(),
            title: String::new(),
            status: "running".into(),
        });
        assert_eq!(live.snapshot().conversations[0].tools[1].title, "Test");
        turn.observe(&AgentEvent::Tool {
            id: "a".into(),
            title: String::new(),
            status: "done".into(),
        });
        assert_eq!(live.snapshot().conversations[0].tools.len(), 1);
        assert_eq!(live.snapshot().conversations[0].tools[0].id, "b");
    }
}
