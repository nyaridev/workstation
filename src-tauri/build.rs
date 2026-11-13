fn main() {
    // The starter kit is built into the exe (kit.rs): rebuild when it changes.
    println!("cargo:rerun-if-changed=../kit");
    println!("cargo:rerun-if-changed=../docs/workstation-file.md");
    tauri_build::build()
}
