//! OpenTelemetry `TracerProvider` builder with DevPulse resource attributes.

use opentelemetry::KeyValue;
use opentelemetry_sdk::trace::{SdkTracerProvider, SpanProcessor};
use opentelemetry_sdk::Resource;

/// Build a [`SdkTracerProvider`] with the standard DevPulse resource attributes
/// and the given span processor.
///
/// The provider is NOT set as the global provider here — that happens in
/// [`crate::boot::lifecycle::init_early`] so the caller controls lifetime.
pub fn build_provider(
    processor: impl SpanProcessor + 'static,
    version: &str,
    session_id: &str,
) -> SdkTracerProvider {
    SdkTracerProvider::builder()
        .with_span_processor(processor)
        .with_resource(
            Resource::builder()
                .with_attributes([
                    KeyValue::new("service.name", "devpulse"),
                    KeyValue::new("service.namespace", "desktop"),
                    KeyValue::new("service.version", version.to_owned()),
                    KeyValue::new("service.instance.id", session_id.to_owned()),
                ])
                .build(),
        )
        .build()
}
