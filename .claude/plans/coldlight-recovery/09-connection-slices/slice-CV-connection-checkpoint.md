# CV — connection checkpoint: the operator walks the WHOLE mission

## GOAL

The mission of all of this: **the auto connection truly connecting to Clyffy
— GB10 or generic — authored, never hardcoded.** This checkpoint is the
operator walking that chain end-to-end in the running app and every box
carrying evidence. Runs after 08/R7 + C2 + C3 + C4 + C6 + B8.

## THE WALK (run-dev, operator's eyes; evidence per box into 03-verification-log as V3)

Status truth (C2):
- [ ] Manual-connect to a bogus address → indicator settles to standalone
      within one probe interval; `clyffy.connection` scoped log shows the
      transition. No eternal "Connecting".

Modes real (C4):
- [ ] Three mode cards, tooltips layman-verbatim; each mode's scan runs ONLY
      its rung set and the ScanPanel PROVES it (gb10 → localhost/mdns rows
      read "didn't run")
- [ ] No card selected → full ladder runs (turnkey default)
- [ ] Mode persists with the connection choice (restart → persisted record
      carries it; verify the TOML at `{data_dir}/user/clyffy_connection.toml`)

Schemes config-driven (C3):
- [ ] `grep 'format!("http' endpoint_discovery.rs` → zero; config with
      `["http","https"]` doubles candidates within max_probes bound (scoped
      log shows both schemes probed)

No-mock scan (08 + R1):
- [ ] Every UI scan row/line has its 1:1 signal in
      `query_scoped_log("clyffy.discovery", …)` from the same run
- [ ] Nothing on screen claims success while nothing answered

Copy + vocabulary (C6 + B8):
- [ ] Zero hardcoded English at the touched seams (greps pasted)
- [ ] App-wide cortex census → ZERO non-generated hits
- [ ] Indicators read SSOT labels with tooltips

The real thing:
- [ ] When a real clyffyd exists (GB10 or generic host), discovery finds it
      through the ladder with NOTHING hardcoded — until then, this box
      records the honest state: every rung runs, every probe emits, the
      manual path connects, and Tier-2 stays a pure function of the
      advertised capability. (clyffyd's absence is recorded truth, not a
      failure of this chain.)

## STEPS

1. Walk each box with the operator; collect yes/no + evidence.
2. Write V3 into `03-verification-log.md`; commit
   `docs(docs): V3 — connection mission checkpoint evidence (CV)`.
3. Any red box → reopen the owning slice (09 INDEX → PENDING + note);
   report honestly, no partial-done.
