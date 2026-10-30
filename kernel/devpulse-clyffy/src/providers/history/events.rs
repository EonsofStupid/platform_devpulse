//! What a provider's stored history becomes: provider-neutral sessions and
//! events (plan 0009 R3a). Authored from your `dpl-chat-core`
//! (`recovered/devpulselabs/crates/chat/core/src/lib.rs`), the part the
//! history reader uses, on `DevPulse`'s own [`ProviderId`].

use std::fmt;

use crate::providers::ProviderId;

/// The most a provider-native diagnostic keeps.
pub const MAX_NATIVE_PAYLOAD_BYTES: usize = 8 * 1024;

/// `DevPulse`-owned identity for a session, independent of provider-native
/// ids.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ChatSessionId(pub u64);

impl fmt::Display for ChatSessionId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "chat-{}", self.0)
    }
}

/// `DevPulse`-owned identity for an event inside one normalized history.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ChatEventId(pub u64);

impl fmt::Display for ChatEventId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "event-{}", self.0)
    }
}

/// Provider-native identities stay typed even though their payload is owned.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ProviderSessionId(pub String);

/// A provider-native turn id.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct TurnId(pub String);

/// Where a session stands.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SessionState {
    /// Found on disk; read, not driven.
    ReadOnly,
    /// Open and waiting.
    Idle,
    /// Working.
    Running,
    /// Waiting for you.
    Attention,
    /// Ended in failure.
    Failed,
    /// Its provider no longer has it.
    Expired,
}

/// How a session is grouped in a list.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum SessionGroup {
    /// You pinned it.
    Pinned,
    /// Live now.
    Active,
    /// From history.
    Recent,
}

/// One session, as a list shows it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SessionSummary {
    /// `DevPulse`'s id for it.
    pub id: ChatSessionId,
    /// Whose it is.
    pub provider_id: ProviderId,
    /// The provider's own id for it.
    pub provider_session_id: Option<ProviderSessionId>,
    /// Its first real request, or a fallback naming its folder and date.
    pub title: String,
    /// The folder it ran in.
    pub workspace: String,
    /// How it is grouped.
    pub group: SessionGroup,
    /// Where it stands.
    pub state: SessionState,
}

/// A provider-native diagnostic projection with a hard byte ceiling.
///
/// The value is expected to be redacted before construction. This type keeps
/// unknown provider data discoverable without retaining an unbounded raw
/// record in application state.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BoundedNativePayload {
    /// The record's shape name (`claude.future`, `codex.event_msg.x`).
    pub schema: String,
    /// Its keys, never its values.
    pub redacted_summary: String,
    /// How long the summary was before the ceiling.
    pub original_bytes: usize,
    /// The summary was cut at the ceiling.
    pub truncated: bool,
}

impl BoundedNativePayload {
    /// A redacted summary at the default ceiling.
    pub fn redacted(schema: impl Into<String>, summary: impl AsRef<str>) -> Self {
        Self::redacted_with_limit(schema, summary, MAX_NATIVE_PAYLOAD_BYTES)
    }

    /// A redacted summary cut at `max_bytes` (on a character boundary).
    pub fn redacted_with_limit(
        schema: impl Into<String>,
        summary: impl AsRef<str>,
        max_bytes: usize,
    ) -> Self {
        let summary = summary.as_ref();
        let original_bytes = summary.len();
        let limit = max_bytes.min(original_bytes);
        let mut boundary = limit;
        while boundary > 0 && !summary.is_char_boundary(boundary) {
            boundary -= 1;
        }
        Self {
            schema: schema.into(),
            redacted_summary: summary[..boundary].to_owned(),
            original_bytes,
            truncated: original_bytes > boundary,
        }
    }
}

/// Structured token accounting from a provider's usage report.
///
/// Every field is optional because providers report DIFFERENT things:
/// Codex reports an input/output split, Grok reports context-window
/// occupancy. A `None` means "this provider did not say", never zero —
/// the distinction matters, because zero is a measurement and absent is
/// not, and cost computed from a guessed zero would be a lie.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct TokenUsage {
    /// FRESH input — tokens the provider actually processed anew.
    pub input_tokens: Option<u64>,
    /// Tokens served from cache. Billed at a small fraction of fresh
    /// input, so they MUST stay separate: folding them into `input`
    /// makes cost an overestimate, and the split cannot be recovered
    /// afterwards from a folded number.
    pub cache_read_tokens: Option<u64>,
    /// Tokens written INTO the cache — billed above fresh input.
    pub cache_write_tokens: Option<u64>,
    /// Output tokens.
    pub output_tokens: Option<u64>,
    /// A combined total, when the provider gives one.
    pub total_tokens: Option<u64>,
    /// Context-window occupancy, when the provider reports it that way.
    pub context_used: Option<u64>,
    /// The context window's size.
    pub context_size: Option<u64>,
}

impl TokenUsage {
    /// Nothing was reported.
    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.input_tokens.is_none()
            && self.cache_read_tokens.is_none()
            && self.cache_write_tokens.is_none()
            && self.output_tokens.is_none()
            && self.total_tokens.is_none()
            && self.context_used.is_none()
            && self.context_size.is_none()
    }

    /// Accumulate per-turn reports into a session total. Absent stays
    /// absent; a present value adds to whatever came before, so summing
    /// never invents a number out of two absences.
    #[must_use]
    pub fn accumulate(self, turn: Self) -> Self {
        fn plus(a: Option<u64>, b: Option<u64>) -> Option<u64> {
            match (a, b) {
                (Some(a), Some(b)) => Some(a.saturating_add(b)),
                (Some(v), None) | (None, Some(v)) => Some(v),
                (None, None) => None,
            }
        }
        Self {
            input_tokens: plus(self.input_tokens, turn.input_tokens),
            cache_read_tokens: plus(self.cache_read_tokens, turn.cache_read_tokens),
            cache_write_tokens: plus(self.cache_write_tokens, turn.cache_write_tokens),
            output_tokens: plus(self.output_tokens, turn.output_tokens),
            total_tokens: plus(self.total_tokens, turn.total_tokens),
            // Context occupancy is a LEVEL, never a sum — the latest
            // reading is the truth, adding them would be meaningless.
            context_used: turn.context_used.or(self.context_used),
            context_size: turn.context_size.or(self.context_size),
        }
    }

    /// Later reports supersede earlier ones field-by-field, so a provider
    /// that reports input now and output later still yields one whole
    /// picture at the end of the turn.
    #[must_use]
    pub fn merge(self, newer: Self) -> Self {
        Self {
            input_tokens: newer.input_tokens.or(self.input_tokens),
            cache_read_tokens: newer.cache_read_tokens.or(self.cache_read_tokens),
            cache_write_tokens: newer.cache_write_tokens.or(self.cache_write_tokens),
            output_tokens: newer.output_tokens.or(self.output_tokens),
            total_tokens: newer.total_tokens.or(self.total_tokens),
            context_used: newer.context_used.or(self.context_used),
            context_size: newer.context_size.or(self.context_size),
        }
    }
}

/// One normalized event.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChatEventContent {
    /// The session began.
    SessionStarted,
    /// The provider named the model it is actually running. Emitted from
    /// the provider's own session-configured fact — never guessed.
    ModelSelected {
        /// The model.
        model: String,
    },
    /// You wrote.
    UserMessage(String),
    /// The agent answered.
    AssistantMessage(String),
    /// The agent's plan changed.
    PlanUpdated(String),
    /// A status line.
    StatusUpdated(String),
    /// A tool started.
    ToolStarted {
        /// Which.
        label: String,
    },
    /// A tool finished.
    ToolCompleted {
        /// Which.
        label: String,
        /// It worked.
        succeeded: bool,
    },
    /// A diff changed.
    DiffUpdated(String),
    /// The agent asked for permission.
    ApprovalRequested {
        /// What it asked.
        summary: String,
    },
    /// The permission was answered.
    ApprovalResolved {
        /// Allowed.
        accepted: bool,
    },
    /// `summary` is the human line the activity feed shows; `usage` is the
    /// machine truth the AI domain records. Prose was all this carried
    /// before — you cannot aggregate a sentence.
    UsageUpdated {
        /// The human line.
        summary: String,
        /// The numbers.
        usage: TokenUsage,
    },
    /// The turn finished.
    TurnCompleted,
    /// The turn was stopped.
    TurnInterrupted,
    /// The turn failed.
    TurnFailed {
        /// Why.
        message: String,
    },
    /// The provider warned.
    ProviderWarning(String),
    /// A record this reader does not know — its shape, never its values.
    Unknown(BoundedNativePayload),
}

/// The kind of an event, without its payload.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum ChatEventKind {
    /// [`ChatEventContent::SessionStarted`].
    SessionStarted,
    /// [`ChatEventContent::ModelSelected`].
    ModelSelected,
    /// [`ChatEventContent::UserMessage`].
    UserMessage,
    /// [`ChatEventContent::AssistantMessage`].
    AssistantMessage,
    /// [`ChatEventContent::PlanUpdated`].
    PlanUpdated,
    /// [`ChatEventContent::StatusUpdated`].
    StatusUpdated,
    /// [`ChatEventContent::ToolStarted`].
    ToolStarted,
    /// [`ChatEventContent::ToolCompleted`].
    ToolCompleted,
    /// [`ChatEventContent::DiffUpdated`].
    DiffUpdated,
    /// [`ChatEventContent::ApprovalRequested`].
    ApprovalRequested,
    /// [`ChatEventContent::ApprovalResolved`].
    ApprovalResolved,
    /// [`ChatEventContent::UsageUpdated`].
    UsageUpdated,
    /// [`ChatEventContent::TurnCompleted`].
    TurnCompleted,
    /// [`ChatEventContent::TurnInterrupted`].
    TurnInterrupted,
    /// [`ChatEventContent::TurnFailed`].
    TurnFailed,
    /// [`ChatEventContent::ProviderWarning`].
    ProviderWarning,
    /// [`ChatEventContent::Unknown`].
    Unknown,
}

/// Where a normalized provider event is allowed to appear.
///
/// Every event remains in history. This classification prevents protocol
/// activity and bounded native diagnostics from masquerading as messages.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventPresentation {
    /// In the conversation.
    Conversation,
    /// In the activity feed.
    Activity,
    /// Only in diagnostics.
    Diagnostics,
}

impl ChatEventContent {
    /// Its kind.
    #[must_use]
    pub const fn kind(&self) -> ChatEventKind {
        match self {
            Self::SessionStarted => ChatEventKind::SessionStarted,
            Self::ModelSelected { .. } => ChatEventKind::ModelSelected,
            Self::UserMessage(_) => ChatEventKind::UserMessage,
            Self::AssistantMessage(_) => ChatEventKind::AssistantMessage,
            Self::PlanUpdated(_) => ChatEventKind::PlanUpdated,
            Self::StatusUpdated(_) => ChatEventKind::StatusUpdated,
            Self::ToolStarted { .. } => ChatEventKind::ToolStarted,
            Self::ToolCompleted { .. } => ChatEventKind::ToolCompleted,
            Self::DiffUpdated(_) => ChatEventKind::DiffUpdated,
            Self::ApprovalRequested { .. } => ChatEventKind::ApprovalRequested,
            Self::ApprovalResolved { .. } => ChatEventKind::ApprovalResolved,
            Self::UsageUpdated { .. } => ChatEventKind::UsageUpdated,
            Self::TurnCompleted => ChatEventKind::TurnCompleted,
            Self::TurnInterrupted => ChatEventKind::TurnInterrupted,
            Self::TurnFailed { .. } => ChatEventKind::TurnFailed,
            Self::ProviderWarning(_) => ChatEventKind::ProviderWarning,
            Self::Unknown(_) => ChatEventKind::Unknown,
        }
    }

    /// Where it may appear.
    #[must_use]
    pub const fn presentation(&self) -> EventPresentation {
        match self {
            Self::SessionStarted
            | Self::ModelSelected { .. }
            | Self::StatusUpdated(_)
            | Self::ToolStarted { .. }
            | Self::ToolCompleted { .. }
            | Self::UsageUpdated { .. }
            | Self::TurnCompleted
            | Self::TurnInterrupted => EventPresentation::Activity,
            Self::Unknown(_) => EventPresentation::Diagnostics,
            Self::UserMessage(_)
            | Self::AssistantMessage(_)
            | Self::PlanUpdated(_)
            | Self::DiffUpdated(_)
            | Self::ApprovalRequested { .. }
            | Self::ApprovalResolved { .. }
            | Self::TurnFailed { .. }
            | Self::ProviderWarning(_) => EventPresentation::Conversation,
        }
    }
}

/// One event in a session's history.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChatEvent {
    /// Its id.
    pub id: ChatEventId,
    /// Whose session.
    pub provider_id: ProviderId,
    /// Which session.
    pub session_id: ChatSessionId,
    /// The turn it belongs to, when the provider says.
    pub turn_id: Option<TurnId>,
    /// What happened.
    pub content: ChatEventContent,
}

#[cfg(test)]
mod tests {
    use super::{ChatEventContent, EventPresentation, TokenUsage};

    #[test]
    fn tools_and_usage_are_activity_while_messages_and_failures_remain_visible() {
        for content in [
            ChatEventContent::ToolStarted {
                label: "exec".into(),
            },
            ChatEventContent::ToolCompleted {
                label: "exec".into(),
                succeeded: true,
            },
            ChatEventContent::UsageUpdated {
                summary: "token usage".into(),
                usage: TokenUsage::default(),
            },
        ] {
            assert_eq!(content.presentation(), EventPresentation::Activity);
        }
        for content in [
            ChatEventContent::UserMessage("question".into()),
            ChatEventContent::AssistantMessage("answer".into()),
            ChatEventContent::TurnFailed {
                message: "disconnected".into(),
            },
            ChatEventContent::ProviderWarning("warning".into()),
        ] {
            assert_eq!(content.presentation(), EventPresentation::Conversation);
        }
    }
}
