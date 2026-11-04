//! Speech bindings: the saved connection and model listening and speaking use.
//!
//! This is the saved-connection pattern a chat uses: a binding records the
//! connection generation it was chosen at, so an edited or removed server never
//! silently receives speech meant for the old one. Only "nothing is bound" lets
//! a caller use something else; a binding that cannot be honoured is an error.
use super::{Connections, registry, store};
use crate::providers::{
    ProviderId,
    adapters::openai_compatible::{
        self, EndpointAudio, EndpointSpeechRequest, EndpointTranscriptionRequest,
    },
    types::{AiProvider, Classification, Transport},
};
use anyhow::{Context, Result, ensure};
use serde::{Deserialize, Serialize};

/// What a binding is for.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum SpeechRole {
    /// Listening: speech to text, `audio/transcriptions`.
    Stt,
    /// Speaking: text to speech, `audio/speech`.
    Tts,
}

impl SpeechRole {
    fn key(self) -> &'static str {
        match self {
            Self::Stt => "stt",
            Self::Tts => "tts",
        }
    }

    fn operation(self) -> &'static str {
        match self {
            Self::Stt => "Speech-to-text",
            Self::Tts => "Text-to-speech",
        }
    }
}

/// Whether a binding can still be honoured, without contacting any endpoint.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub enum SpeechBindingState {
    /// The connection is at the generation that was chosen.
    Current,
    /// The connection was edited after it was chosen.
    ConnectionChanged,
    /// The connection no longer exists.
    ConnectionRemoved,
}

/// Public identity of one role's binding. No credential crosses this boundary.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct SpeechBinding {
    /// The role this binding serves.
    pub role: SpeechRole,
    /// Saved endpoint identity.
    pub connection_id: String,
    /// Exact configuration generation approved when it was chosen.
    pub revision: i64,
    /// Connection name when chosen, retained even after removal.
    pub label: String,
    /// Explicit model, never selected by a fallback.
    pub model: String,
    /// Whether requests would be sent or refused. Says nothing about the server's health.
    pub state: SpeechBindingState,
}

/// Every role's binding, and the adapters a binding may use.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct SpeechEndpoints {
    /// Listening, if chosen.
    pub stt: Option<SpeechBinding>,
    /// Speaking, if chosen.
    pub tts: Option<SpeechBinding>,
    /// Adapters that can carry the standard audio operations.
    pub providers: Vec<ProviderId>,
}

/// How to transcribe, from the saved settings.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SpeechHearing {
    /// ISO-639-1 hint; `None` lets the server detect the language.
    pub language: Option<String>,
    /// Beam width. The hosted standard API has none, so it is not sent there.
    pub beam_size: Option<u32>,
}

/// Private execution snapshot. Deliberately neither serializable nor debuggable.
pub struct PreparedSpeech {
    role: SpeechRole,
    connection_id: String,
    model: String,
    endpoint: String,
    key: Option<String>,
    hosted_openai: bool,
}

/// An adapter that speaks the OpenAI-compatible wire format and can have audio.
/// Hosted vendors declare it. A local or self-hosted adapter is whichever server
/// you pointed it at, so there only the request itself can tell.
fn supports_speech(provider: &AiProvider) -> bool {
    provider
        .transports
        .iter()
        .any(|t| matches!(t, Transport::OpenAiCompatible { .. }))
        && (provider.capabilities.voice
            || provider.classifications.contains(&Classification::Local))
}

impl Connections {
    async fn speech_binding_view(&self, role: SpeechRole) -> Result<Option<SpeechBinding>> {
        let Some(row) = store::speech_binding(self.db.as_ref(), role.key()).await? else {
            return Ok(None);
        };
        let state = match store::find(self.db.as_ref(), &row.connection_id).await? {
            None => SpeechBindingState::ConnectionRemoved,
            Some(record) if record.revision != row.revision => {
                SpeechBindingState::ConnectionChanged
            }
            Some(_) => SpeechBindingState::Current,
        };
        Ok(Some(SpeechBinding {
            role,
            connection_id: row.connection_id,
            revision: row.revision,
            label: row.label,
            model: row.model,
            state,
        }))
    }

    /// One role's binding, read without contacting any endpoint or reading a key.
    /// # Errors
    /// Returns storage errors rather than inventing an empty state.
    pub async fn speech_binding(&self, role: SpeechRole) -> Result<Option<SpeechBinding>> {
        let _guard = self.checks.lock().await;
        self.speech_binding_view(role).await
    }

    /// Every binding, read without contacting any endpoint or reading a key.
    /// # Errors
    /// Returns storage errors rather than inventing an empty state.
    pub async fn speech_endpoints(&self) -> Result<SpeechEndpoints> {
        let _guard = self.checks.lock().await;
        Ok(SpeechEndpoints {
            stt: self.speech_binding_view(SpeechRole::Stt).await?,
            tts: self.speech_binding_view(SpeechRole::Tts).await?,
            providers: registry::visible()
                .filter(|entry| supports_speech(entry))
                .map(|entry| entry.id)
                .collect(),
        })
    }

    /// Choose the connection and model one role uses, at this exact generation.
    /// # Errors
    /// Refuses removed or edited connections, adapters without audio, an empty
    /// model and a missing key. The prior binding stays in place when refused.
    pub async fn set_speech_binding(
        &self,
        role: SpeechRole,
        id: &str,
        revision: i64,
        model: &str,
    ) -> Result<SpeechEndpoints> {
        {
            let _guard = self.checks.lock().await;
            let record = store::get(self.db.as_ref(), id).await?;
            ensure!(
                record.revision == revision,
                "This connection changed. Choose it again with its current configuration."
            );
            ensure!(
                registry::find(record.provider).is_some_and(supports_speech),
                "This connection does not implement the standard audio endpoints"
            );
            let model = model.trim();
            ensure!(
                !model.is_empty() && !model.chars().any(char::is_control),
                "Choose a model for {}",
                role.operation()
            );
            self.key(&record).await?;
            store::save_speech_binding(
                self.db.as_ref(),
                role.key(),
                &store::SpeechRow {
                    connection_id: record.id,
                    revision: record.revision,
                    label: record.label,
                    model: model.to_owned(),
                },
            )
            .await?;
        }
        self.speech_endpoints().await
    }

    /// Stop using a connection for one role.
    /// # Errors
    /// Returns storage errors.
    pub async fn clear_speech_binding(&self, role: SpeechRole) -> Result<SpeechEndpoints> {
        {
            let _guard = self.checks.lock().await;
            store::clear_speech_binding(self.db.as_ref(), role.key()).await?;
        }
        self.speech_endpoints().await
    }

    /// Resolve the bound connection's credential and check its generation.
    /// `None` means nothing is bound, and is the only case where a caller may use
    /// something else.
    /// # Errors
    /// Refuses a removed or edited connection and a missing key, never falling through.
    pub async fn prepare_speech(&self, role: SpeechRole) -> Result<Option<PreparedSpeech>> {
        let _guard = self.checks.lock().await;
        let Some(row) = store::speech_binding(self.db.as_ref(), role.key()).await? else {
            return Ok(None);
        };
        let record = store::find(self.db.as_ref(), &row.connection_id)
            .await?
            .with_context(|| {
                format!(
                    "{} is set to {}, which was removed. Choose another connection or stop using it.",
                    role.operation(),
                    row.label
                )
            })?;
        ensure!(
            record.revision == row.revision,
            "{} is set to {}, which changed after you chose it. Choose it again before anything is sent to it.",
            role.operation(),
            row.label
        );
        ensure!(
            registry::find(record.provider).is_some_and(supports_speech),
            "{} does not implement the standard audio endpoints",
            row.label
        );
        let key = self.key(&record).await?;
        Ok(Some(PreparedSpeech {
            role,
            connection_id: record.id,
            model: row.model,
            endpoint: record.endpoint,
            key,
            hosted_openai: record.provider == ProviderId::OpenAi,
        }))
    }
}

impl PreparedSpeech {
    /// Ask the bound text-to-speech connection to speak. Returns its encoded audio.
    /// # Errors
    /// A binding for listening is refused; transport and response failures remain failures.
    pub async fn speak(&self, input: &str, voice: &str, speed: Option<f32>) -> Result<Vec<u8>> {
        ensure!(
            self.role == SpeechRole::Tts,
            "This binding is not for speaking"
        );
        tracing::info!(target: "providers", connection_id = %self.connection_id, model = %self.model, "speech over endpoint");
        openai_compatible::speak(
            &self.endpoint,
            self.key.as_deref(),
            &EndpointSpeechRequest {
                model: &self.model,
                input,
                voice,
                speed,
            },
        )
        .await
    }

    /// Ask the bound speech-to-text connection what was said.
    /// # Errors
    /// A binding for speaking is refused; transport and response failures remain failures.
    pub async fn transcribe(
        &self,
        audio: EndpointAudio<'_>,
        hearing: &SpeechHearing,
    ) -> Result<String> {
        ensure!(
            self.role == SpeechRole::Stt,
            "This binding is not for listening"
        );
        tracing::info!(target: "providers", connection_id = %self.connection_id, model = %self.model, "transcription over endpoint");
        openai_compatible::transcribe(
            &self.endpoint,
            self.key.as_deref(),
            &EndpointTranscriptionRequest {
                model: &self.model,
                audio,
                language: hearing.language.as_deref(),
                beam_size: hearing.beam_size.filter(|_| !self.hosted_openai),
            },
        )
        .await
    }
}
