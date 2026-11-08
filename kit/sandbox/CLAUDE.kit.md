# sandbox/

Throwaway experiments, tutorials and tests, at `sandbox/<name>/`. Git is optional, and no registry row is needed.

- One folder per experiment, named for what it tests (`roblox-bhop-test`, `tauri-tray-icon`), never `a`, `aa` or `test`.
- Nothing outside the sandbox depends on anything inside it.
- When an experiment turns into a real project, `/promote` moves it into its category.
- Claude never deletes sandbox folders. `/projects` lists the stale ones, and the user removes them.
