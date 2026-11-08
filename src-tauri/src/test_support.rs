//! Test support: fresh temp folders for building fake workstations, removed when dropped.

use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};

static NEXT: AtomicUsize = AtomicUsize::new(0);

/// A fresh temp folder that is removed when dropped.
pub struct Temp(pub PathBuf);

impl Temp {
    pub fn new() -> Self {
        let n = NEXT.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir().join(format!("workstation-test-{}-{n}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        Temp(dir)
    }

    /// Creates `<temp>/<rel>` and its parents, and returns it.
    pub fn dir(&self, rel: &str) -> PathBuf {
        let path = self.0.join(rel);
        fs::create_dir_all(&path).unwrap();
        path
    }

    /// Writes `<temp>/<rel>`, creating its folder, and returns its path.
    pub fn file(&self, rel: &str, text: &str) -> PathBuf {
        let path = self.0.join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, text).unwrap();
        path
    }
}

impl Drop for Temp {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
