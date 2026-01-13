# Staged Feature Implementation Plan

**Goal**: Full control via Lab UI to incrementally enable features, with all telemetry captured to DuckDB/libSQL.

## Current State (Audit Results)

### ✅ WORKING
| Component | Location | Status |
|-----------|----------|--------|
| DuckDB Analytics | `orchestrator/src/infra/duckdb.rs` | Has events, inference_metrics, hop_metrics tables |
| libSQL Database | `orchestrator/src/infra/libsql.rs` | Has projects, sessions, messages, chunks tables |
| RRO VectorStore | `orchestrator/src/infra/rro.rs` | Embedded instance, collections API |
| Embedder | `orchestrator/src/infra/embedder.rs` | Qwen3-Embedding-0.6B, 1024 dims |
| Session/Project Persistence | `engine/src/registry/` | Working with libSQL |

### ❌ NOT WIRED
| Component | Issue | Fix Required |
|-----------|-------|--------------|
| Chat History | `orchestrator/src/chat/mod.rs:309` returns `vec![]` | Wire to `Database.get_messages()` |
| Message Recording | Chat doesn't call `record_message()` | Add after each turn |
| Project Indexing | GUARDIAN has TODO, no actual indexer | Create indexing pipeline |
| RRO Context | `costar.rs:92` has TODO | Wire to VectorStore.search() |
| Feature Toggles | No way to enable/disable stages | Add config flags |

---

## Staged Implementation Order

### Stage 0: Telemetry First (Log Everything)
Before ANY feature, ensure all actions log to DuckDB.

**Files to modify:**
- `orchestrator/src/chat/mod.rs` - Record every send/receive
- `engine/src/facade/chat.rs` - Record via Analytics

**DuckDB Events to Add:**
```sql
-- New event types
'chat.send'      -- User message sent
'chat.receive'   -- Assistant response
'project.add'    -- Project registered
'project.index.start'  -- Indexing began
'project.index.chunk'  -- Each chunk indexed
'project.index.end'    -- Indexing complete
'rro.search'  -- Vector search executed
'rerank.execute' -- Reranker called
```

### Stage 1: Basic Chat (No AI Context)
**What Works**: Send message → LLM generates → Response returned
**What's Logged**: Every message to libSQL + DuckDB metrics

**Implementation:**
1. Wire `ChatEngine.history()` to `Database.get_messages()`
2. Wire `ChatEngine.send()` to call `Database.record_message()` for both user and assistant
3. Record inference metrics to DuckDB

### Stage 2: Chat + RRO Search
**What Works**: Send message → RRO search → LLM with context → Response
**Toggle**: `features.rro_enabled: bool`

**Implementation:**
1. Add `index_project()` to GUARDIAN that:
   - Walks project files
   - Chunks code (existing code in libsql.rs for chunks table)
   - Embeds chunks with EmbedderBackend
   - Upserts to RRO
   - Records progress to DuckDB

2. Wire `CostarBuilder.build()` to:
   - Call `VectorStore.search()` with query embedding
   - Include results in context

### Stage 3: Chat + RRO + Reranker
**What Works**: Send message → RRO search → Rerank → LLM with ranked context
**Toggle**: `features.reranker_enabled: bool`

**Implementation:**
1. Add reranker step in CAG pipeline
2. Log reranking metrics to DuckDB

### Stage 4: Full Pipeline + Sub-Agents
**What Works**: All of above + GUARDIAN monitoring + other sub-agents

---

## Lab UI Requirements

### Project Indexing View
When user adds a project via Lab:
1. Show "Indexing Project..." modal
2. Progress bar: `Scanning files... 0/N`
3. Progress bar: `Embedding chunks... 0/M`
4. Progress bar: `Uploading to RRO... 0/M`
5. Complete: Show collection stats

**SSE Endpoint**: `/api/projects/:id/index/progress`
Emits: `{ stage: 'scanning' | 'embedding' | 'uploading' | 'complete', current: N, total: M }`

### Feature Toggles Panel
Lab Settings → Features:
- [ ] Enable RRO Context Search
- [ ] Enable Reranker
- [ ] Enable Sub-Agents

Saved to: `shared/src/config/features.rs`

### Telemetry Dashboard
Lab → Analytics:
- Total messages sent
- Tokens used (from DuckDB inference_metrics)
- Avg response latency
- Projects indexed
- RRO collection sizes

---

## Implementation Order

### Phase 1: Wire Chat History (HIGH PRIORITY)
**Files:**
- `orchestrator/src/chat/mod.rs` - Implement `history()` and `clear()`
- Add `record_message()` calls in send flow

### Phase 2: Project Indexing Pipeline
**Files:**
- `orchestrator/src/sub_agents/guardian/indexer.rs` (NEW)
- `engine/src/facade/projects.rs` - Add `index()` method
- `lab/src/routes/projects.rs` (NEW) - SSE endpoint

### Phase 3: RRO Context Integration
**Files:**
- `orchestrator/src/cortex/costar.rs` - Wire VectorStore search
- `orchestrator/src/cortex/cag.rs` - Use search results

### Phase 4: Feature Toggles
**Files:**
- `shared/src/config/features.rs` (NEW)
- Lab UI settings panel

---

## File-by-File Changes

### 1. orchestrator/src/chat/mod.rs

```rust
// BEFORE (line 308-316):
pub async fn history(&self) -> Result<Vec<Message>> {
    // TODO: Query turns table from libSQL
    Ok(vec![])
}

pub async fn clear(&self) -> Result<()> {
    // TODO: Clear turns for this session
    Ok(())
}

// AFTER:
pub async fn history(&self, session_id: &SessionId) -> Result<Vec<Message>> {
    let db_messages = self.db.get_messages(session_id, 100).await?;
    Ok(db_messages.into_iter().map(|m| Message {
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
    }).collect())
}

pub async fn clear(&self, session_id: &SessionId) -> Result<()> {
    self.db.delete_session(session_id.as_str()).await?;
    Ok(())
}
```

### 2. orchestrator/src/sub_agents/guardian/indexer.rs (NEW)

```rust
//! Project indexer - walks files, chunks, embeds, upserts to RRO

pub struct ProjectIndexer {
    embedder: Arc<EmbedderBackend>,
    vector_store: Arc<VectorStore>,
    db: Arc<Database>,
    analytics: Arc<Analytics>,
}

pub struct IndexProgress {
    pub stage: IndexStage,
    pub current: usize,
    pub total: usize,
}

pub enum IndexStage {
    Scanning,
    Embedding,
    Uploading,
    Complete,
}

impl ProjectIndexer {
    pub async fn index_project(
        &self,
        project_id: &Uuid,
        root_path: &Path,
        progress_tx: tokio::sync::mpsc::Sender<IndexProgress>,
    ) -> Result<IndexStats> {
        // 1. Scan files
        let files = self.scan_files(root_path).await?;
        progress_tx.send(IndexProgress {
            stage: IndexStage::Scanning,
            current: files.len(),
            total: files.len(),
        }).await?;

        // 2. Chunk and embed
        let mut chunks_indexed = 0;
        for file in &files {
            let chunks = self.chunk_file(file).await?;
            for (i, chunk) in chunks.iter().enumerate() {
                // Embed
                let embedding = self.embedder.embed(&chunk.content)?;

                // Store in libSQL
                self.db.store_chunk(
                    project_id,
                    &chunk.source_path,
                    &chunk.content,
                    i as i32,
                    None,
                ).await?;

                // Upsert to RRO
                self.vector_store.upsert(
                    &format!("project_{}", project_id),
                    vec![VectorPoint {
                        id: uuid::Uuid::new_v4().to_string(),
                        vector: embedding,
                        payload: json!({
                            "source_path": chunk.source_path,
                            "chunk_index": i,
                            "project_id": project_id.to_string(),
                        }),
                    }],
                ).await?;

                chunks_indexed += 1;
                progress_tx.send(IndexProgress {
                    stage: IndexStage::Embedding,
                    current: chunks_indexed,
                    total: total_chunks,
                }).await?;
            }
        }

        // 3. Record to analytics
        self.analytics.record_event("project.index.complete", &json!({
            "project_id": project_id.to_string(),
            "files_scanned": files.len(),
            "chunks_indexed": chunks_indexed,
        }))?;

        Ok(IndexStats { files_scanned: files.len(), chunks_indexed })
    }
}
```

### 3. lab/src/routes/projects.rs (NEW)

```rust
//! Project management routes with indexing progress SSE

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_projects).post(add_project))
        .route("/:id", delete(remove_project))
        .route("/:id/index", post(start_indexing))
        .route("/:id/index/progress", get(index_progress_sse))
}

async fn index_progress_sse(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let (tx, rx) = tokio::sync::mpsc::channel(32);

    // Spawn indexing task
    let engine = state.engine.clone();
    tokio::spawn(async move {
        engine.projects.index(&id, tx).await;
    });

    // Convert to SSE stream
    Sse::new(ReceiverStream::new(rx).map(|progress| {
        Ok(Event::default().json_data(progress).unwrap())
    }))
}
```

---

## Testing Checklist

- [ ] Send chat message → Check libSQL messages table has row
- [ ] Send chat message → Check DuckDB inference_metrics has row
- [ ] Add project → See indexing progress in Lab UI
- [ ] Add project → Check RRO collection has vectors
- [ ] Send chat about project → See RRO search logged
- [ ] Enable reranker → See rerank metrics in DuckDB

---

## Success Criteria

**NOT DONE until:**
1. Every chat message persisted to libSQL (restart app, messages still there)
2. Every action logged to DuckDB (can query analytics)
3. Project indexing visible in Lab UI with progress
4. RRO search actually called (not TODO comment)
5. Feature toggles work (disable RRO, chat still works)
