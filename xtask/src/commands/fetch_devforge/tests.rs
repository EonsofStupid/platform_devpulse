#![allow(clippy::expect_used, reason = "fixture failures are test failures")]

use super::{build_http_agent, sha256_file, stream_artifact};
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::time::Duration;

fn request_headers(stream: &TcpStream) -> String {
    stream
        .set_read_timeout(Some(Duration::from_secs(5)))
        .expect("timeout");
    stream
        .set_write_timeout(Some(Duration::from_secs(5)))
        .expect("timeout");
    let mut reader = BufReader::new(stream);
    let mut headers = String::new();
    loop {
        let mut line = String::new();
        assert!(reader.read_line(&mut line).expect("request") > 0);
        if line == "\r\n" {
            break;
        }
        headers.push_str(&line);
    }
    headers.to_ascii_lowercase()
}

#[test]
fn authenticated_redirect_does_not_forward_credentials_and_streams_large_asset() {
    let origin = TcpListener::bind("127.0.0.1:0").expect("origin");
    let asset = TcpListener::bind("127.0.0.1:0").expect("asset");
    let origin_url = format!("http://{}/release", origin.local_addr().expect("address"));
    let asset_url = format!("http://{}/asset", asset.local_addr().expect("address"));
    let server = std::thread::spawn(move || {
        let (mut stream, _) = origin.accept().expect("accept origin");
        assert!(request_headers(&stream).contains("authorization: bearer test-only-token"));
        write!(stream, "HTTP/1.1 302 Found\r\nLocation: {asset_url}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").expect("redirect");
        drop(stream);
        let (mut stream, _) = asset.accept().expect("accept asset");
        assert!(!request_headers(&stream).contains("authorization:"));
        // Exceeds ureq's default 10 MiB buffered-body limit.
        write!(
            stream,
            "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
            12 * 1024 * 1024
        )
        .expect("headers");
        let chunk = vec![b'x'; 64 * 1024];
        for _ in 0..192 {
            stream.write_all(&chunk).expect("body");
        }
    });
    let temp = tempfile::tempdir().expect("tempdir");
    let path = temp.path().join("asset.zip");
    let agent = build_http_agent();
    stream_artifact(
        agent
            .get(&origin_url)
            .config()
            .timeout_global(Some(Duration::from_secs(10)))
            .build()
            .header("Authorization", "Bearer test-only-token"),
        &path,
    )
    .expect("download");
    server.join().expect("server");
    assert_eq!(
        std::fs::metadata(path).expect("metadata").len(),
        12 * 1024 * 1024
    );
}

#[test]
fn sha256_remains_lowercase_standard_hex() {
    let temp = tempfile::tempdir().expect("tempdir");
    let path = temp.path().join("fixture");
    std::fs::write(&path, b"abc").expect("write");
    assert_eq!(
        sha256_file(&path).expect("digest"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
}
