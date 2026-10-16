//! Signal wire contract.
//!
//! Pins what the UI compiles against: the TypeScript shape of
//! `SignalVariant` and one JSON sample of every kind. A payload or tag change
//! fails here until the snapshot is reviewed (`cargo insta review`) — the
//! job `buf breaking` does for Protobuf contracts.
//!
#![allow(
    clippy::expect_used,
    reason = "test assertions — a failed expect is the test failure"
)]

use devpulse_engine::platform::{HardwareMetrics, InitEvent};
use devpulse_engine::signals::{
    AnalyticsEventType, AnalyticsPayload, AnalyticsProperties, BootPhase, BootStatus, ChatPayload,
    ChatRole, ContextChunk, ContextPayload, Delivery, GovernanceEvent, GovernancePayload,
    InferencePayload, ModelsReadiness, SignalKind, SignalVariant, SystemPayload, SystemStatus,
};
use specta_typescript::{BigIntExportBehavior, Typescript};
use strum::IntoEnumIterator;

/// One representative payload per kind. Exhaustive on purpose: a new kind
/// does not compile here until it has a sample in the contract.
fn sample(kind: SignalKind) -> SignalVariant {
    match kind {
        SignalKind::Chat => SignalVariant::Chat(ChatPayload {
            content: "hello".into(),
            role: ChatRole::Assistant,
            model: Some("qwen3-30b-a3b".into()),
        }),
        SignalKind::Analytics => SignalVariant::Analytics(AnalyticsPayload {
            event_type: AnalyticsEventType::FeatureUsed,
            properties: AnalyticsProperties {
                target: Some("model-loader".into()),
                ..AnalyticsProperties::default()
            },
        }),
        SignalKind::Context => SignalVariant::Context(ContextPayload {
            chunks: vec![ContextChunk {
                content: "fn main() {}".into(),
                source: "src/main.rs".into(),
                score: 0.5,
            }],
            query: "entry point".into(),
        }),
        SignalKind::Inference => SignalVariant::Inference(InferencePayload {
            tokens_in: 12,
            tokens_out: 34,
            latency_ms: 56,
            model: "qwen3-30b-a3b".into(),
        }),
        SignalKind::System => SignalVariant::System(SystemPayload {
            status: SystemStatus::Ready,
            message: "Engine started".into(),
        }),
        SignalKind::Governance => SignalVariant::Governance(GovernancePayload {
            event: GovernanceEvent::ProviderSelected,
            lane: "chat".into(),
            provider: Some("local".into()),
            detail: "fastest ready endpoint".into(),
        }),
        SignalKind::Hardware => SignalVariant::Hardware(HardwareMetrics {
            cpu_name: "test cpu".into(),
            cpu_cores: 8,
            ..HardwareMetrics::default()
        }),
        SignalKind::Models => SignalVariant::Models(ModelsReadiness {
            ready: false,
            setup_complete: false,
            first_run: true,
            model_count: 3,
            slot_count: 16,
            assigned_count: 1,
        }),
        SignalKind::Boot => SignalVariant::Boot(BootStatus {
            phase: BootPhase::Initializing,
            error: None,
            steps: vec![InitEvent::running("System relational", "opening")],
        }),
        SignalKind::Resync => SignalVariant::Resync,
    }
}

#[test]
fn every_kind_has_a_spec_and_its_wire_tag_is_its_name() {
    for kind in SignalKind::iter() {
        let spec = kind.spec();
        assert!(spec.version >= 1, "{kind:?}: contract version starts at 1");
        if spec.delivery == Delivery::State {
            assert!(
                kind.reaches_ui(),
                "{kind:?}: state that never reaches the UI has no reader"
            );
        }

        let name: &'static str = kind.into();
        let wire = serde_json::to_value(sample(kind)).expect("sample serializes");
        assert_eq!(
            wire["type"], name,
            "{kind:?}: wire tag must equal the kind name"
        );
    }
}

#[test]
fn every_kind_round_trips_through_json() {
    for kind in SignalKind::iter() {
        let json = serde_json::to_string(&sample(kind)).expect("sample serializes");
        let back: SignalVariant = serde_json::from_str(&json).expect("sample deserializes");
        assert_eq!(SignalKind::from(&back), kind);
        assert_eq!(serde_json::to_string(&back).expect("re-serializes"), json);
    }
}

#[test]
fn wire_samples_are_stable() {
    let samples: Vec<_> = SignalKind::iter()
        .map(|kind| serde_json::to_value(sample(kind)).expect("sample serializes"))
        .collect();
    insta::assert_snapshot!(serde_json::to_string_pretty(&samples).expect("samples render"));
}

#[test]
fn typescript_shape_is_stable() {
    let ts = specta_typescript::export::<SignalVariant>(
        &Typescript::default().bigint(BigIntExportBehavior::Number),
    )
    .expect("SignalVariant exports to TypeScript");
    insta::assert_snapshot!(ts);
}
