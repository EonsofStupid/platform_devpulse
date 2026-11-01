use super::*;

fn observed(model: &str) -> CacheEntry {
    CacheEntry {
        endpoint: "https://configured.example/api".into(),
        validated_at_ms: 1,
        models: vec![ProviderModelInfo {
            id: model.into(),
            owned_by: None,
        }],
        error: None,
    }
}

#[test]
fn credential_changes_clear_success_and_reject_in_flight_results() {
    let cache = ValidationCache::default();
    let provider = ProviderId::Ollama;
    let ticket = cache.begin(provider).unwrap();
    cache.complete(ticket, observed("old")).unwrap();
    assert!(cache.snapshot(provider).is_some());
    let saved_change = cache.credential_change(provider);
    assert!(cache.snapshot(provider).is_none());
    drop(saved_change);
    assert!(cache.snapshot(provider).is_none());
    let pending = cache.begin(provider).unwrap();
    let change = cache.credential_change(provider);
    assert!(cache.snapshot(provider).is_none());
    assert!(cache.begin(provider).is_err());
    drop(change);
    assert!(cache.complete(pending, observed("stale")).is_err());
    assert!(cache.snapshot(provider).is_none());
    let fresh = cache.begin(provider).unwrap();
    cache.complete(fresh, observed("new")).unwrap();
    assert_eq!(cache.snapshot(provider).unwrap().models[0].id, "new");
}

#[test]
fn overlapping_mutations_stay_unverified_until_both_finish() {
    let cache = ValidationCache::default();
    let provider = ProviderId::LmStudio;
    let first = cache.credential_change(provider);
    let second = cache.credential_change(provider);
    drop(first);
    assert!(cache.begin(provider).is_err());
    drop(second);
    assert!(cache.begin(provider).is_ok());
}

#[test]
fn older_completion_cannot_replace_a_newer_success_or_failure() {
    let cache = ValidationCache::default();
    for error in [None, Some("Authentication rejected".into())] {
        let old = cache.begin(ProviderId::OpenAi).unwrap();
        let new = cache.begin(ProviderId::OpenAi).unwrap();
        let mut result = observed("current");
        result.error.clone_from(&error);
        cache.complete(new, result).unwrap();
        assert!(cache.complete(old, observed("old")).is_err());
        let current = cache.snapshot(ProviderId::OpenAi).unwrap();
        assert_eq!(current.models[0].id, "current");
        assert_eq!(current.error, error);
    }
}

#[test]
fn changing_one_provider_does_not_invalidate_another() {
    let cache = ValidationCache::default();
    let pending = cache.begin(ProviderId::OpenAi).unwrap();
    let _change = cache.credential_change(ProviderId::Ollama);
    cache.complete(pending, observed("remote")).unwrap();
    assert!(cache.snapshot(ProviderId::OpenAi).is_some());
}

#[tokio::test]
async fn cancelling_a_credential_change_releases_its_gate_but_not_old_evidence() {
    let cache = Arc::new(ValidationCache::default());
    let ticket = cache.begin(ProviderId::Ollama).unwrap();
    let worker = Arc::clone(&cache);
    let (started, started_rx) = tokio::sync::oneshot::channel();
    let task = tokio::spawn(async move {
        let _change = worker.credential_change(ProviderId::Ollama);
        started.send(()).unwrap();
        std::future::pending::<()>().await;
    });
    started_rx.await.unwrap();
    task.abort();
    assert!(task.await.unwrap_err().is_cancelled());
    assert!(cache.complete(ticket, observed("old")).is_err());
    assert!(cache.begin(ProviderId::Ollama).is_ok());
}
