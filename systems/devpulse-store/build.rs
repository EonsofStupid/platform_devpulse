//! Build script — Windows-only link repair for the bundled duckdb.

fn main() {
    // libduckdb-sys (bundled duckdb) references the Windows Restart Manager
    // (RmStartSession / RmEndSession / RmRegisterResources / RmGetList) from
    // duckdb::AdditionalLockInfo but never emits the link directive for
    // rstrtmgr.lib — an upstream gap in libduckdb-sys' build script. Without
    // this, every binary that links this crate (test runners, the desktop
    // app) dies at link time with LNK2019 unresolved RmStartSession.
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        println!("cargo:rustc-link-lib=rstrtmgr");
    }
}
