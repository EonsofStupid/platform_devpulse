# C2 — probe-loop status truth: observe the store, not a loop-local copy

## GOAL

Kill B2: `connect_clyffy` writes `Connecting` to the managed store, but the
probe loop dedups against its own loop-local `last` — so an unreachable
endpoint stays `Connecting` forever. The loop must compare each computed
state against THE STORE's current state, making every command write
observable and every settle honest.

## THE BUG (read this session, exact)

`interfaces/desktop/src-tauri/src/lib.rs` — inside `clyffy_probe_loop`:

- `let mut last = app.state::<ClyffyConnectionState>().current();` (before
  the loop)
- per tick: `if next != last { publish(&next); last = next; }`

`commands/sys/clyffy.rs::connect_clyffy` meanwhile does
`state.store(connecting)` + emits — the loop's `last` never sees it. Next
tick on an unreachable endpoint computes `Disconnected`; `last` is ALREADY
`Disconnected` from before the connect; `next != last` is false; the store
keeps saying `Connecting`. Frontend spins forever.

## PRECONDITIONS

1. 08/R1 committed (this file's sibling edit landed); tree clean.
2. Probe: `grep -n "let mut last" interfaces/desktop/src-tauri/src/lib.rs`
   → exactly one hit inside `clyffy_probe_loop` (~line 508). Zero or
   elsewhere → STOP, re-read the loop.

## FILES

1. `interfaces/desktop/src-tauri/src/lib.rs` — the loop's dedup only.

## STEPS

1. Read `clyffy_probe_loop` in full (lib.rs ~:466-530) plus the
   `ClyffyConnectionState` methods it calls (`state.rs` — confirm `current()`
   is a cheap ArcSwap load; it is used exactly this way at loop init).
2. Replace the loop-local dedup with store-truth dedup:
   - DELETE `let mut last = app.state::<ClyffyConnectionState>().current();`
   - Per tick, AFTER computing `next`:

```rust
// Dedup against the STORE's current state — commands (`connect_clyffy`,
// `disconnect_clyffy`) write it between ticks, and their writes must be
// observable here or an unreachable connect stays `Connecting` forever
// (B2). Loop-local memory is banned in this loop for exactly that reason.
let current = app.state::<ClyffyConnectionState>().current();
if next != current {
    publish(&next);
}
```

   - Remove the `last = next;` line and any other `last` use.
3. Doc-comment: extend the fn's existing doc with one sentence recording the
   B2 rule (commands write between ticks; compare against the store).
4. `cargo check -p devpulse_desktop_backend` → exit 0, zero warnings.
5. Runtime proof (run-dev, HMR not needed): connect to a bogus address from
   the wizard's manual entry; within one probe interval (15s) the indicator
   must settle to standalone/disconnected — and
   `query_scoped_log("clyffy.connection", …)` shows the transition. Paste
   what the operator sees.
6. Commit + push: `fix(desktop): probe loop observes the store — unreachable connect settles honestly (C2/B2)`.

## IMPORT REPOINTS

None.

## VERIFY

Step 4 raw output · step 5 operator-witnessed behavior · diff-stat = 1 file.

## KNOWN REDS

None in this crate.

## ROLLBACK

`git checkout -- interfaces/desktop/src-tauri/src/lib.rs`

## STOP CONDITIONS

- `Connecting` is emitted by anything else inside the loop (it isn't today —
  the loop only computes Connected/Disconnected) that would flap
  Connecting→Disconnected within one tick of a fresh connect: re-read
  `connect_clyffy`'s immediate probe expectations; if the UX regresses
  (Connecting flash lost), STOP and report — do NOT add sleeps or fake
  states.
