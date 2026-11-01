//! Model-list observations are valid only for the credential/request generation
//! that produced them. They never certify inference readiness.

use std::collections::HashMap;
use std::sync::{Arc, Mutex, MutexGuard};

use devpulse_engine::ai_providers::ProviderId;

use super::dto::ProviderModelInfo;
use crate::commands::_util::CommandError;

#[derive(Clone)]
pub(super) struct CacheEntry {
    pub endpoint: String,
    pub validated_at_ms: i64,
    pub models: Vec<ProviderModelInfo>,
    pub error: Option<String>,
}

#[derive(Default)]
struct Observation {
    generation: Arc<()>,
    entry: Option<CacheEntry>,
    mutations: usize,
}

#[derive(Default)]
pub(super) struct ValidationCache {
    entries: Mutex<HashMap<ProviderId, Observation>>,
}

pub(super) struct ValidationTicket {
    provider: ProviderId,
    generation: Arc<()>,
}

/// The entire vault mutation, including its hint update, invalidates evidence.
/// Dropping the guard also covers errors and cancelled callers.
pub(crate) struct CredentialChange<'a> {
    cache: &'a ValidationCache,
    provider: ProviderId,
}

impl ValidationCache {
    fn lock(&self) -> MutexGuard<'_, HashMap<ProviderId, Observation>> {
        self.entries.lock().unwrap_or_else(|poisoned| {
            tracing::warn!("Provider observation lock poisoned; discarding all observations");
            let mut entries = poisoned.into_inner();
            for observation in entries.values_mut() {
                observation.generation = Arc::new(());
                observation.entry = None;
            }
            entries
        })
    }

    pub fn begin(&self, provider: ProviderId) -> Result<ValidationTicket, CommandError> {
        let mut entries = self.lock();
        let observation = entries.entry(provider).or_default();
        if observation.mutations != 0 {
            return Err(CommandError::not_configured(
                "Credentials are changing; check the provider again when the change finishes",
            ));
        }
        observation.generation = Arc::new(());
        observation.entry = None;
        Ok(ValidationTicket {
            provider,
            generation: Arc::clone(&observation.generation),
        })
    }

    #[expect(
        clippy::needless_pass_by_value,
        reason = "Completion consumes the request ticket so it cannot publish another observation."
    )]
    pub fn complete(
        &self,
        ticket: ValidationTicket,
        entry: CacheEntry,
    ) -> Result<(), CommandError> {
        let mut entries = self.lock();
        if let Some(observation) = entries.get_mut(&ticket.provider) {
            if observation.mutations == 0
                && Arc::ptr_eq(&observation.generation, &ticket.generation)
            {
                observation.entry = Some(entry);
                return Ok(());
            }
        }
        Err(CommandError::not_configured(
            "Credentials changed or a newer check superseded this result; check the provider again",
        ))
    }

    pub fn snapshot(&self, provider: ProviderId) -> Option<CacheEntry> {
        self.lock().get(&provider)?.entry.clone()
    }

    pub fn credential_change(&self, provider: ProviderId) -> CredentialChange<'_> {
        let mut entries = self.lock();
        let observation = entries.entry(provider).or_default();
        observation.mutations += 1;
        observation.generation = Arc::new(());
        observation.entry = None;
        CredentialChange {
            cache: self,
            provider,
        }
    }
}

impl Drop for CredentialChange<'_> {
    fn drop(&mut self) {
        if let Some(observation) = self.cache.lock().get_mut(&self.provider) {
            observation.mutations -= 1;
            observation.generation = Arc::new(());
            observation.entry = None;
        }
    }
}

#[cfg(test)]
mod tests;
