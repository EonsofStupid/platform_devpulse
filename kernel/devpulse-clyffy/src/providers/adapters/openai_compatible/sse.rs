//! SSE framing uses bytes until complete lines, preserving split UTF-8 codepoints.
use super::{
    chat::finish_reason,
    http::BODY_LIMIT,
    types::{EndpointChatResult, EndpointUsage},
};
use anyhow::{Context, Result, ensure};
use serde::Deserialize;

const FRAME_LIMIT: usize = 128 * 1024;
const WIRE_LIMIT: usize = 32 * 1024 * 1024;

#[derive(Default)]
pub(super) struct Decoder {
    pending: Vec<u8>,
    skip_lf: bool,
    saw_line: bool,
    data: String,
    received: usize,
    text: String,
    model: Option<String>,
    usage: Option<EndpointUsage>,
    finish_reason: Option<String>,
    done: bool,
}

impl Decoder {
    pub(super) fn push(
        &mut self,
        bytes: &[u8],
        on_delta: &mut impl FnMut(&str) -> Result<()>,
    ) -> Result<bool> {
        self.received += bytes.len();
        ensure!(
            self.received <= WIRE_LIMIT,
            "Endpoint stream exceeded its size limit"
        );
        self.pending.extend_from_slice(bytes);
        loop {
            if self.pending.is_empty() {
                break;
            }
            if self.skip_lf {
                if self.pending.first() == Some(&b'\n') {
                    self.pending.remove(0);
                }
                self.skip_lf = false;
            }
            let Some(end) = self.pending.iter().position(|b| matches!(b, b'\n' | b'\r')) else {
                break;
            };
            ensure!(
                end <= FRAME_LIMIT,
                "Endpoint stream line exceeded its size limit"
            );
            let line = self.pending.drain(..end).collect::<Vec<_>>();
            self.skip_lf = self.pending.remove(0) == b'\r';
            let line = std::str::from_utf8(&line).context("Endpoint stream is not UTF-8")?;
            let line = if self.saw_line {
                line
            } else {
                line.strip_prefix('\u{feff}').unwrap_or(line)
            };
            self.saw_line = true;
            if line.is_empty() {
                if !self.data.is_empty() {
                    self.event(on_delta)?;
                }
                if self.done {
                    return Ok(true);
                }
            } else if let Some(data) = line.strip_prefix("data:") {
                let data = data.strip_prefix(' ').unwrap_or(data);
                ensure!(
                    self.data.len() + data.len() < FRAME_LIMIT,
                    "Endpoint stream event exceeded its size limit"
                );
                self.data.push_str(data);
                self.data.push('\n');
            }
        }
        ensure!(
            self.pending.len() <= FRAME_LIMIT,
            "Endpoint stream line exceeded its size limit"
        );
        Ok(false)
    }

    fn event(&mut self, on_delta: &mut impl FnMut(&str) -> Result<()>) -> Result<()> {
        let data = std::mem::take(&mut self.data);
        if data.trim() == "[DONE]" {
            ensure!(
                self.finish_reason.is_some(),
                "Endpoint stream ended without a completion reason"
            );
            self.done = true;
            return Ok(());
        }
        let chunk: Chunk = serde_json::from_str(&data)
            .map_err(|_| anyhow::anyhow!("Malformed endpoint stream event"))?;
        if let Some(model) = chunk.model {
            self.model = Some(model);
        }
        if let Some(usage) = chunk.usage {
            self.usage = Some(usage);
        }
        for choice in chunk.choices.into_iter().filter(|c| c.index == 0) {
            ensure!(
                choice.delta.refusal.is_none()
                    && choice.delta.tool_calls.is_none()
                    && choice.delta.function_call.is_none(),
                "Endpoint did not return a text answer"
            );
            if let Some(text) = choice.delta.content.filter(|t| !t.is_empty()) {
                ensure!(
                    self.finish_reason.is_none(),
                    "Endpoint sent text after completion"
                );
                ensure!(
                    self.text.len() + text.len() <= BODY_LIMIT,
                    "Endpoint text exceeded its size limit"
                );
                on_delta(&text)?;
                self.text.push_str(&text);
            }
            if let Some(reason) = choice.finish_reason {
                finish_reason(&reason)?;
                self.finish_reason = Some(reason);
            }
        }
        Ok(())
    }

    pub(super) fn finish(self, elapsed_ms: u64) -> Result<EndpointChatResult> {
        ensure!(self.done, "Endpoint stream ended before [DONE]");
        ensure!(
            !self.text.trim().is_empty(),
            "Endpoint returned an empty answer"
        );
        Ok(EndpointChatResult {
            text: self.text,
            model: self.model,
            usage: self.usage,
            finish_reason: self.finish_reason.context("Missing completion reason")?,
            elapsed_ms,
        })
    }
}

#[derive(Deserialize)]
struct Chunk {
    choices: Vec<Choice>,
    model: Option<String>,
    usage: Option<EndpointUsage>,
}
#[derive(Deserialize)]
struct Choice {
    index: usize,
    delta: Delta,
    finish_reason: Option<String>,
}
#[derive(Deserialize)]
struct Delta {
    content: Option<String>,
    refusal: Option<String>,
    tool_calls: Option<serde_json::Value>,
    function_call: Option<serde_json::Value>,
}
