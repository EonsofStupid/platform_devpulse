//! Talking to the Surreal server: HTTP `POST /rpc` in CBOR (plan 0007 Part S,
//! S4). `DevPulse` links no Surreal crate for this — the server is upstream's
//! built binary in a supervised subprocess ([`super::super::runtime`]).
//!
//! **Why CBOR.** Over JSON, the server rewrites any string that looks like a
//! record id, a datetime or a UUID, and cuts a UUID-prefixed string short
//! (surrealdb#7324, still in 3.3.4). CBOR keeps every value as sent and
//! carries bytes and floats natively.
//!
//! **Sessions.** Each request is its own session: the namespace and database
//! go in the `surreal-ns` / `surreal-db` headers (3.x ignores the older
//! `NS` / `DB`), and auth is HTTP Basic for the root user.
//!
//! **Results** come back in the shapes the embedded crate gave callers: a
//! record id as `table:key` (a key that is not plain letters, digits and `_`
//! is backticked), a datetime as RFC 3339 text, bytes as an array of numbers.
//! A statement that failed is an error, never an empty result.

use std::sync::Arc;

use anyhow::{anyhow, bail, Context, Result};
use ciborium::value::Value as Cbor;
use serde::Serialize;

/// Where the server answers right now — its port can change when it
/// restarts, so it is asked on every request.
pub type Endpoint = Arc<dyn Fn() -> Option<String> + Send + Sync>;

/// A client for one Surreal server.
#[derive(Clone)]
pub struct SurrealRpc {
    http: reqwest::Client,
    endpoint: Endpoint,
    user: String,
    pass: String,
}

impl std::fmt::Debug for SurrealRpc {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SurrealRpc")
            .field("endpoint", &(self.endpoint)())
            .field("user", &self.user)
            .finish_non_exhaustive()
    }
}

/// A query and its variables.
#[derive(Debug, Clone)]
pub struct Query {
    sql: String,
    vars: Vec<(Cbor, Cbor)>,
}

impl Query {
    /// A query with no variables yet.
    #[must_use]
    pub fn new(sql: impl Into<String>) -> Self {
        Self {
            sql: sql.into(),
            vars: Vec::new(),
        }
    }

    /// Bind `$name` to `value`. Bytes go as bytes when the value marks them
    /// (`serde_bytes`); strings stay strings, whatever they look like.
    ///
    /// # Errors
    /// Returns an error if the value cannot be encoded.
    pub fn bind<T: Serialize + ?Sized>(mut self, name: &str, value: &T) -> Result<Self> {
        let encoded =
            Cbor::serialized(value).map_err(|e| anyhow!("encode ${name} for Surreal: {e}"))?;
        self.vars
            .push((Cbor::Text(name.trim_start_matches('$').to_owned()), encoded));
        Ok(self)
    }

    /// The query text.
    #[must_use]
    pub fn sql(&self) -> &str {
        &self.sql
    }
}

/// One statement's outcome.
#[derive(Debug, Clone, PartialEq)]
pub struct Statement {
    /// It succeeded.
    pub ok: bool,
    /// Its result; the server's message when it failed.
    pub result: serde_json::Value,
}

/// Every statement's outcome, in order.
#[derive(Debug, Clone, PartialEq)]
pub struct Response {
    statements: Vec<Statement>,
}

impl Response {
    /// Statement `index`'s rows. A failed statement is an error.
    ///
    /// # Errors
    /// Returns an error if there is no such statement or it failed.
    pub fn take(&self, index: usize) -> Result<Vec<serde_json::Value>> {
        let statement = self
            .statements
            .get(index)
            .with_context(|| format!("the query has no statement {index}"))?;
        if !statement.ok {
            bail!("statement {index} failed: {}", message(&statement.result));
        }
        Ok(match &statement.result {
            serde_json::Value::Array(rows) => rows.clone(),
            serde_json::Value::Null => Vec::new(),
            other => vec![other.clone()],
        })
    }

    /// Fail on the first statement that failed.
    ///
    /// # Errors
    /// Returns the first failed statement's message.
    pub fn check(&self) -> Result<()> {
        if let Some((index, failed)) = self.statements.iter().enumerate().find(|(_, s)| !s.ok) {
            bail!("statement {index} failed: {}", message(&failed.result));
        }
        Ok(())
    }

    /// Every statement's outcome.
    #[must_use]
    pub fn statements(&self) -> &[Statement] {
        &self.statements
    }
}

fn message(result: &serde_json::Value) -> String {
    match result {
        serde_json::Value::String(text) => text.clone(),
        other => other.to_string(),
    }
}

impl SurrealRpc {
    /// A client for the server at `endpoint`, signing in as `user`.
    ///
    /// # Errors
    /// Returns an error if the HTTP client cannot be built.
    pub fn new(
        endpoint: Endpoint,
        user: impl Into<String>,
        pass: impl Into<String>,
    ) -> Result<Self> {
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .context("build the Surreal HTTP client")?;
        Ok(Self {
            http,
            endpoint,
            user: user.into(),
            pass: pass.into(),
        })
    }

    /// Make sure `namespace` / `database` exist. Surreal 3.x refuses a session
    /// on a namespace or database that was never defined, so this runs once
    /// per scope before its first query.
    ///
    /// # Errors
    /// Returns an error if a name is not a plain identifier, or the server
    /// refuses the definitions.
    pub async fn ensure(&self, namespace: &str, database: &str) -> Result<()> {
        for name in [namespace, database] {
            anyhow::ensure!(
                !name.is_empty() && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_'),
                "not a plain Surreal identifier: {name:?}"
            );
        }
        self.send(
            None,
            Query::new(format!(
                "DEFINE NAMESPACE IF NOT EXISTS {namespace}; USE NS {namespace}; \
                 DEFINE DATABASE IF NOT EXISTS {database};"
            )),
        )
        .await?
        .check()
        .with_context(|| format!("define {namespace}/{database}"))
    }

    /// Run `query` in `namespace` / `database` (see [`Self::ensure`]).
    ///
    /// # Errors
    /// Returns an error if the server is not running, cannot be reached, or
    /// refuses the request. A failed statement is reported in the
    /// [`Response`], read by [`Response::take`] / [`Response::check`].
    pub async fn query(&self, namespace: &str, database: &str, query: Query) -> Result<Response> {
        self.send(Some((namespace, database)), query).await
    }

    /// Run `query` at the root, with no namespace selected.
    ///
    /// # Errors
    /// As [`Self::query`].
    pub async fn query_root(&self, query: Query) -> Result<Response> {
        self.send(None, query).await
    }

    async fn send(&self, scope: Option<(&str, &str)>, query: Query) -> Result<Response> {
        let base = (self.endpoint)().context("the Surreal server is not running")?;
        let request = Cbor::Map(vec![
            (Cbor::Text("id".into()), Cbor::Integer(1.into())),
            (Cbor::Text("method".into()), Cbor::Text("query".into())),
            (
                Cbor::Text("params".into()),
                Cbor::Array(vec![Cbor::Text(query.sql), Cbor::Map(query.vars)]),
            ),
        ]);
        let mut body = Vec::new();
        ciborium::into_writer(&request, &mut body).context("encode the Surreal request")?;

        let mut request = self
            .http
            .post(format!("{base}/rpc"))
            .header("Content-Type", "application/cbor")
            .header("Accept", "application/cbor")
            .basic_auth(&self.user, Some(&self.pass));
        if let Some((namespace, database)) = scope {
            request = request
                .header("surreal-ns", namespace)
                .header("surreal-db", database);
        }
        let answer = request
            .body(body)
            .send()
            .await
            .with_context(|| format!("reach the Surreal server at {base}"))?;
        let status = answer.status();
        let raw = answer.bytes().await.context("read the Surreal answer")?;
        let decoded: Option<Cbor> = ciborium::from_reader(raw.as_ref()).ok();
        if !status.is_success() {
            let detail = decoded.as_ref().map_or_else(
                || String::from_utf8_lossy(&raw[..raw.len().min(300)]).into_owned(),
                |v| to_json(v).to_string(),
            );
            bail!("the Surreal server answered {status}: {detail}");
        }
        parse_answer(&decoded.context("the Surreal answer is not CBOR")?)
    }
}

/// Read an RPC answer: `{id, result: [statements]}` or `{id, error}`.
fn parse_answer(answer: &Cbor) -> Result<Response> {
    let fields = answer.as_map().context("the Surreal answer is not a map")?;
    if let Some(error) = field(fields, "error") {
        bail!("the Surreal server refused the request: {}", to_json(error));
    }
    let result = field(fields, "result").context("the Surreal answer has no result")?;
    let items = result
        .as_array()
        .context("the Surreal result is not a list of statements")?;
    let statements = items
        .iter()
        .map(|item| {
            let entry = item
                .as_map()
                .context("a Surreal statement result is not a map")?;
            let ok = field(entry, "status")
                .and_then(Cbor::as_text)
                .is_some_and(|s| s == "OK");
            let result = field(entry, "result").map_or(serde_json::Value::Null, to_json);
            Ok(Statement { ok, result })
        })
        .collect::<Result<Vec<_>>>()?;
    Ok(Response { statements })
}

fn field<'a>(map: &'a [(Cbor, Cbor)], name: &str) -> Option<&'a Cbor> {
    map.iter()
        .find(|(k, _)| k.as_text() == Some(name))
        .map(|(_, v)| v)
}

/// A Surreal CBOR value in the JSON shape callers read.
pub(crate) fn to_json(value: &Cbor) -> serde_json::Value {
    use serde_json::Value as Json;
    match value {
        Cbor::Null => Json::Null,
        Cbor::Bool(b) => Json::Bool(*b),
        Cbor::Integer(i) => {
            let n = i128::from(*i);
            i64::try_from(n)
                .map(Json::from)
                .or_else(|_| u64::try_from(n).map(Json::from))
                .unwrap_or_else(|_| Json::String(n.to_string()))
        }
        Cbor::Float(f) => serde_json::Number::from_f64(*f).map_or(Json::Null, Json::Number),
        Cbor::Text(s) => Json::String(s.clone()),
        Cbor::Bytes(b) => Json::Array(b.iter().map(|byte| Json::from(*byte)).collect()),
        Cbor::Array(items) => Json::Array(items.iter().map(to_json).collect()),
        Cbor::Map(entries) => Json::Object(
            entries
                .iter()
                .map(|(k, v)| {
                    let key = k
                        .as_text()
                        .map_or_else(|| to_json(k).to_string(), str::to_owned);
                    (key, to_json(v))
                })
                .collect(),
        ),
        Cbor::Tag(tag, inner) => tagged(*tag, inner),
        _ => Json::Null,
    }
}

/// Surreal's CBOR tags (docs: reference / rest-api / cbor-protocol).
fn tagged(tag: u64, inner: &Cbor) -> serde_json::Value {
    use serde_json::Value as Json;
    match tag {
        // NONE
        6 => Json::Null,
        // RecordId: [table, key]
        8 => record_id(inner).map_or_else(|| to_json(inner), Json::String),
        // datetime as [seconds, nanoseconds]
        12 => datetime(inner).map_or_else(|| to_json(inner), Json::String),
        // UUID as 16 bytes
        37 => match inner {
            Cbor::Bytes(b) => uuid::Uuid::from_slice(b).map_or_else(
                |_| to_json(inner),
                |u| Json::String(u.hyphenated().to_string()),
            ),
            _ => to_json(inner),
        },
        // duration as [seconds, nanoseconds]
        14 => match inner {
            Cbor::Array(parts) => {
                let secs = parts.first().map_or(0, int_of);
                let nanos = parts.get(1).map_or(0, int_of);
                Json::String(format!("{secs}s{nanos}ns"))
            }
            _ => to_json(inner),
        },
        // datetime text (0), table name (7), UUID text (9), decimal text (10),
        // duration text (13), sets, ranges, geometry, files: their inner value.
        _ => to_json(inner),
    }
}

fn int_of(value: &Cbor) -> i128 {
    match value {
        Cbor::Integer(i) => i128::from(*i),
        _ => 0,
    }
}

/// `table:key`, with a key that is not plain letters, digits and `_` (or is
/// all digits as text) backticked.
fn record_id(inner: &Cbor) -> Option<String> {
    let parts = inner.as_array()?;
    let table = parts.first()?.as_text()?;
    let key = match parts.get(1)? {
        Cbor::Integer(i) => i128::from(*i).to_string(),
        Cbor::Text(s) => {
            let plain = !s.is_empty()
                && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
                && !s.chars().all(|c| c.is_ascii_digit());
            if plain {
                s.clone()
            } else {
                format!("`{s}`")
            }
        }
        Cbor::Tag(9 | 37, _) => format!("u'{}'", message(&to_json(parts.get(1)?))),
        other => to_json(other).to_string(),
    };
    Some(format!("{table}:{key}"))
}

fn datetime(inner: &Cbor) -> Option<String> {
    let parts = inner.as_array()?;
    let secs = i64::try_from(int_of(parts.first()?)).ok()?;
    let nanos = u32::try_from(parts.get(1).map_or(0, int_of)).ok()?;
    let at = chrono::DateTime::from_timestamp(secs, nanos)?;
    Some(at.to_rfc3339_opts(chrono::SecondsFormat::AutoSi, true))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use serde_json::json;

    fn tag(n: u64, v: Cbor) -> Cbor {
        Cbor::Tag(n, Box::new(v))
    }

    fn text(s: &str) -> Cbor {
        Cbor::Text(s.to_owned())
    }

    #[test]
    fn record_ids_read_as_table_and_key() {
        let plain = tag(8, Cbor::Array(vec![text("person"), text("tobie")]));
        let dashed = tag(8, Cbor::Array(vec![text("mem"), text("a-b")]));
        let number = tag(8, Cbor::Array(vec![text("n"), Cbor::Integer(7.into())]));
        assert_eq!(to_json(&plain), json!("person:tobie"));
        assert_eq!(to_json(&dashed), json!("mem:`a-b`"));
        assert_eq!(to_json(&number), json!("n:7"));
    }

    #[test]
    fn datetimes_bytes_none_and_uuids_read_as_callers_expect() {
        let at = tag(
            12,
            Cbor::Array(vec![
                Cbor::Integer(0.into()),
                Cbor::Integer(500_000_000.into()),
            ]),
        );
        assert_eq!(to_json(&at), json!("1970-01-01T00:00:00.500Z"));
        assert_eq!(to_json(&Cbor::Bytes(vec![1, 2, 3])), json!([1, 2, 3]));
        assert_eq!(to_json(&tag(6, Cbor::Null)), json!(null));
        let id = uuid::Uuid::nil();
        assert_eq!(
            to_json(&tag(37, Cbor::Bytes(id.as_bytes().to_vec()))),
            json!(id.hyphenated().to_string())
        );
    }

    #[test]
    fn a_failed_statement_is_an_error_not_an_empty_result() {
        let answer = Cbor::Map(vec![
            (text("id"), Cbor::Integer(1.into())),
            (
                text("result"),
                Cbor::Array(vec![
                    Cbor::Map(vec![
                        (text("status"), text("OK")),
                        (text("result"), Cbor::Array(vec![Cbor::Integer(1.into())])),
                    ]),
                    Cbor::Map(vec![
                        (text("status"), text("ERR")),
                        (text("result"), text("The table 'x' does not exist")),
                    ]),
                ]),
            ),
        ]);
        let response = parse_answer(&answer).expect("parses");
        assert_eq!(response.take(0).expect("rows"), vec![json!(1)]);
        let err = response.take(1).expect_err("failed");
        assert!(format!("{err:#}").contains("does not exist"), "{err:#}");
        assert!(response.check().is_err());
    }

    #[test]
    fn a_refused_request_is_an_error() {
        let answer = Cbor::Map(vec![(
            text("error"),
            Cbor::Map(vec![(
                text("message"),
                text("There was a problem with authentication"),
            )]),
        )]);
        let err = parse_answer(&answer).expect_err("refused");
        assert!(format!("{err:#}").contains("authentication"), "{err:#}");
    }

    #[test]
    fn variables_keep_their_types() {
        let q = Query::new("SELECT * FROM $t")
            .bind("$t", "person:tobie")
            .unwrap()
            .bind("bytes", &serde_bytes::Bytes::new(&[1, 2]))
            .unwrap()
            .bind("emb", &vec![0.5_f32, 1.0])
            .unwrap();
        assert_eq!(q.vars[0], (text("t"), text("person:tobie")));
        assert_eq!(q.vars[1].1, Cbor::Bytes(vec![1, 2]));
        assert!(matches!(&q.vars[2].1, Cbor::Array(v) if v.len() == 2));
    }

    /// Against upstream's server build, installed by `cargo xtask
    /// fetch-surreal`: a schemafull table holding bytes, floats and a string
    /// that looks like a record id; and `type::thing`, which 3.x removed.
    /// `cargo test -p devpulse-clyffy --lib -- --ignored
    /// cortex::persistence::surreal::rpc::tests::against_the_real_server`
    #[tokio::test]
    #[ignore = "needs the installed Surreal server build"]
    async fn against_the_real_server() {
        use crate::cortex::persistence::runtime::{
            RestartPolicy, Runtime, RuntimeEvents, RuntimeSpec, PORT,
        };
        let exe = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../.userdata/global/runtimes/surreal/3.0.5")
            .join(format!("surreal{}", std::env::consts::EXE_SUFFIX));
        assert!(exe.is_file(), "install it first: {}", exe.display());
        let port = std::net::TcpListener::bind(("127.0.0.1", 0))
            .unwrap()
            .local_addr()
            .unwrap()
            .port();
        let quiet: RuntimeEvents = Arc::new(|_| {});
        let runtime = Runtime::start(
            RuntimeSpec {
                name: "surreal-test".into(),
                program: exe,
                args: [
                    "start".to_owned(),
                    "--bind".to_owned(),
                    format!("127.0.0.1:{PORT}"),
                    "--no-banner".to_owned(),
                    "memory".to_owned(),
                ]
                .to_vec(),
                env: vec![
                    ("SURREAL_USER".into(), "root".into()),
                    ("SURREAL_PASS".into(), "root-test".into()),
                    ("SURREAL_ONLINE_VERSION_CHECK".into(), "false".into()),
                ],
                dir: None,
                host: "127.0.0.1".into(),
                port,
                max_bumps: 20,
                ready_path: "/health".into(),
                startup_timeout: std::time::Duration::from_secs(30),
                restart: RestartPolicy::default(),
                stop: devpulse_process::StopPolicy::default(),
            },
            quiet,
        )
        .await
        .expect("the server starts");
        let at = Arc::clone(&runtime);
        let rpc = SurrealRpc::new(Arc::new(move || at.endpoint()), "root", "root-test").unwrap();

        let before = rpc.query("t", "t", Query::new("DEFINE TABLE probe")).await;
        assert!(
            before.and_then(|r| r.check()).is_err(),
            "3.x refuses to define into a namespace that was never defined"
        );
        rpc.ensure("t", "t").await.expect("define the scope");
        assert!(
            rpc.ensure("t; REMOVE NAMESPACE t", "t").await.is_err(),
            "names are checked"
        );

        rpc.query(
            "t",
            "t",
            Query::new(
                "DEFINE TABLE mem SCHEMAFULL; \
                 DEFINE FIELD bytes ON mem TYPE bytes; \
                 DEFINE FIELD emb ON mem TYPE array<float>; \
                 DEFINE FIELD note ON mem TYPE string;",
            ),
        )
        .await
        .unwrap()
        .check()
        .expect("schema");

        rpc.query(
            "t",
            "t",
            Query::new("UPSERT type::record('mem', $id) CONTENT { bytes: $b, emb: $e, note: $n }")
                .bind("id", "a-b")
                .unwrap()
                .bind("b", &serde_bytes::Bytes::new(&[1, 2, 3]))
                .unwrap()
                .bind("e", &vec![0.5_f32, 1.0])
                .unwrap()
                .bind("n", "person:tobie")
                .unwrap(),
        )
        .await
        .unwrap()
        .check()
        .expect("upsert");

        let rows = rpc
            .query("t", "t", Query::new("SELECT * FROM mem"))
            .await
            .unwrap()
            .take(0)
            .expect("rows");
        assert_eq!(rows.len(), 1, "{rows:?}");
        let row = &rows[0];
        assert_eq!(row["id"], json!("mem:`a-b`"), "{row}");
        assert_eq!(
            row["note"],
            json!("person:tobie"),
            "a record-id-looking string stays a string: {row}"
        );
        assert_eq!(row["bytes"], json!([1, 2, 3]), "{row}");
        assert_eq!(row["emb"], json!([0.5, 1.0]), "{row}");

        // 3.x refuses the whole query at parse time and names the successor.
        let removed = rpc
            .query(
                "t",
                "t",
                Query::new("SELECT * FROM type::thing('mem', 'x')"),
            )
            .await
            .expect_err("type::thing is gone in 3.x");
        assert!(
            format!("{removed:#}").contains("type::record"),
            "{removed:#}"
        );

        runtime.stop().await.expect("stops");
    }
}
