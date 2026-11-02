//! DevPulse regressions for the direct zip 9 migration.
use candle_core::{Device, Result, Tensor, npy::NpzTensors, pickle::PthTensors};
use std::{
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
};

static NEXT_FILE: AtomicU64 = AtomicU64::new(0);
struct Archive(PathBuf);
impl Archive {
    fn new() -> Self {
        Self(std::env::temp_dir().join(format!(
            "devpulse-candle-archive-{}-{}.npz",
            std::process::id(),
            NEXT_FILE.fetch_add(1, Ordering::Relaxed)
        )))
    }
}
impl AsRef<Path> for Archive {
    fn as_ref(&self) -> &Path {
        &self.0
    }
}
impl Drop for Archive {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

#[test]
fn named_tensor_round_trip_eager_and_lazy() -> Result<()> {
    let path = Archive::new();
    let tensor = Tensor::new(&[1f32, 2., 3.], &Device::Cpu)?;
    Tensor::write_npz(&[("weights", &tensor)], &path)?;
    let eager = Tensor::read_npz(&path)?;
    assert_eq!(eager[0].0, "weights");
    assert_eq!(eager[0].1.to_vec1::<f32>()?, vec![1., 2., 3.]);
    let lazy = NpzTensors::new(&path)?;
    assert_eq!(
        lazy.get("weights")?
            .expect("stored tensor")
            .to_vec1::<f32>()?,
        vec![1., 2., 3.]
    );
    assert!(lazy.get("missing")?.is_none());
    assert_eq!(
        Tensor::read_npz_by_name(&path, &["weights"])?[0].to_vec1::<f32>()?,
        vec![1., 2., 3.]
    );
    Ok(())
}

#[test]
fn legacy_encoded_names_decode_without_panicking() -> Result<()> {
    let path = Archive::new();
    let tensor = Tensor::new(&[1f32], &Device::Cpu)?;
    Tensor::write_npz(&[("weights", &tensor)], &path)?;
    let mut bytes = std::fs::read(&path)?;
    let mut changed = 0;
    for offset in 0..bytes.len().saturating_sub(46) {
        let (flag, name) = match &bytes[offset..offset + 4] {
            b"PK\x03\x04" => (offset + 6, offset + 30),
            b"PK\x01\x02" => (offset + 8, offset + 46),
            _ => continue,
        };
        let flags = u16::from_le_bytes([bytes[flag], bytes[flag + 1]]) | 0x800;
        bytes[flag..flag + 2].copy_from_slice(&flags.to_le_bytes());
        bytes[name] = 0xff;
        changed += 1;
    }
    assert_eq!(changed, 2, "local and central filename records");
    std::fs::write(&path, bytes)?;
    // zip 9 intentionally decodes non-UTF-8 names as CP437 (0xff is NBSP).
    let name = "\u{00a0}eights";
    let eager = Tensor::read_npz(&path)?;
    assert_eq!(eager[0].0, name);
    assert_eq!(eager[0].1.to_vec1::<f32>()?, vec![1.]);
    let lazy = NpzTensors::new(&path)?;
    assert_eq!(
        lazy.get(name)?.expect("decoded tensor").to_vec1::<f32>()?,
        vec![1.]
    );
    assert!(PthTensors::new(&path, None)?.tensor_infos().is_empty());
    Ok(())
}

#[test]
fn truncated_archives_return_errors() -> Result<()> {
    let path = Archive::new();
    std::fs::write(&path, b"PK\x03\x04truncated")?;
    assert!(Tensor::read_npz(&path).is_err());
    assert!(NpzTensors::new(&path).is_err());
    assert!(PthTensors::new(&path, None).is_err());
    Ok(())
}
