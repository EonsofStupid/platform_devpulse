//! Private, bounded frames. Stdout is exclusively this protocol, never logs.

use anyhow::{bail, Context, Result};
use devpulse_clyffy::providers::ProviderId;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};

use crate::history::{FoundPage, FoundSessions};

/// Maximum serialized frame; checked before allocating an incoming payload.
pub const MAX_FRAME_BYTES: usize = 64 * 1024 * 1024;

/// Both peers must agree before either accepts a request.
#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct Hello {
    protocol: u32,
    version: String,
    build: String,
}

impl Default for Hello {
    fn default() -> Self {
        Self {
            protocol: 1,
            version: env!("CARGO_PKG_VERSION").into(),
            build: env!("AGENTHUB_BUILD").into(),
        }
    }
}

impl Hello {
    /// Refuse stale or foreign executables instead of translating protocols.
    ///
    /// # Errors
    /// When either the protocol or runtime build differs.
    pub fn verify(&self) -> Result<()> {
        if self != &Self::default() {
            bail!("AgentHub executable does not match this DevPulse build; rebuild or reinstall the complete bundle");
        }
        Ok(())
    }
}

/// A single outstanding request per client connection, without replay.
#[derive(Debug, Deserialize, Serialize)]
#[serde(
    tag = "method",
    content = "params",
    rename_all = "camelCase",
    deny_unknown_fields
)]
pub enum Request {
    /// Refresh the retained catalog.
    Sessions,
    /// Read one bounded page from that catalog.
    Page {
        /// The selected provider, never substituted.
        provider_id: ProviderId,
        /// Opaque, jailed artifact identity.
        locator: String,
        /// Read backwards from this cursor.
        cursor: Option<String>,
    },
}

/// Typed results; an operation error does not corrupt a healthy connection.
#[derive(Debug, Deserialize, Serialize)]
#[serde(
    tag = "result",
    content = "value",
    rename_all = "camelCase",
    deny_unknown_fields
)]
pub enum Reply {
    /// Catalog snapshot.
    Sessions(FoundSessions),
    /// Transcript page.
    Page(FoundPage),
    /// A refused or unsuccessful operation.
    Error(String),
}

/// Read one length-prefixed JSON value. Only EOF before the header is clean.
///
/// # Errors
/// Malformed, truncated or oversized frames, or a failed pipe.
pub async fn read<R: AsyncRead + Unpin, T: DeserializeOwned>(reader: &mut R) -> Result<Option<T>> {
    let mut header = [0; 4];
    if reader.read(&mut header[..1]).await? == 0 {
        return Ok(None);
    }
    reader
        .read_exact(&mut header[1..])
        .await
        .context("read AgentHub frame header")?;
    let length = u32::from_be_bytes(header) as usize;
    if length == 0 || length > MAX_FRAME_BYTES {
        bail!("AgentHub frame length {length} is outside the allowed bounds");
    }
    let mut bytes = vec![0; length];
    reader
        .read_exact(&mut bytes)
        .await
        .context("read AgentHub frame payload")?;
    Ok(Some(
        serde_json::from_slice(&bytes).context("decode AgentHub frame")?,
    ))
}

/// Write and flush one bounded value.
///
/// # Errors
/// Serialization, oversized payload or pipe failure.
pub async fn write<W: AsyncWrite + Unpin, T: Serialize>(writer: &mut W, value: &T) -> Result<()> {
    let bytes = serde_json::to_vec(value).context("encode AgentHub frame")?;
    if bytes.len() > MAX_FRAME_BYTES {
        bail!("AgentHub response exceeds the frame limit");
    }
    let length = u32::try_from(bytes.len()).context("AgentHub frame length")?;
    writer.write_all(&length.to_be_bytes()).await?;
    writer.write_all(&bytes).await?;
    writer.flush().await.context("flush AgentHub frame")
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]
    use super::*;

    #[tokio::test]
    async fn eof_is_distinct_from_truncated_and_oversized_frames() {
        assert!(read::<_, Hello>(&mut &b""[..]).await.unwrap().is_none());
        for mut bytes in [
            &b"\0\0"[..],
            &b"\0\0\0\x05{}"[..],
            &b"\x04\0\0\x01"[..],
            &b"\0\0\0\0"[..],
            &b"\0\0\0\x03bad"[..],
        ] {
            assert!(read::<_, Hello>(&mut bytes).await.is_err(), "{bytes:?}");
        }
    }

    #[tokio::test]
    async fn frames_round_trip_and_build_mismatches_are_refused() {
        let mut bytes = Vec::new();
        write(&mut bytes, &Hello::default()).await.unwrap();
        let hello: Hello = read(&mut bytes.as_slice()).await.unwrap().unwrap();
        hello.verify().unwrap();
        let mut stale = Hello {
            build: "different runtime".into(),
            ..Hello::default()
        };
        assert!(stale.verify().is_err());
        stale = Hello::default();
        stale.protocol += 1;
        assert!(stale.verify().is_err());
    }
}
