<#
	Sets up a new workstation from the starter kit, the same way the app's "Set up a new one" does.

	  pwsh -NoProfile -File setup-kit.ps1 -Destination D:/WORKSTATION

	Copies every file from kit/ under its real name (dot-claude/ -> .claude/, CLAUDE.kit.md -> CLAUDE.md,
	AGENTS.kit.md -> AGENTS.md) plus docs/projects-json.md as _meta/docs/projects-json.md. Never overwrites a file that's
	already there, so it's safe to run on a folder that has content. Needs nothing installed beyond PowerShell.
#>
param(
	[Parameter(Mandatory)][string]$Destination
)

$ErrorActionPreference = "Stop"

$kit = Join-Path $PSScriptRoot "kit"
$Destination = [IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

# The real name of a stored kit path: dot-claude/rules -> .claude/rules, CLAUDE.kit.md -> CLAUDE.md
function Get-RealName([string]$stored) {
	($stored -split "/" | ForEach-Object {
		if ($_ -eq "CLAUDE.kit.md") { "CLAUDE.md" }
		elseif ($_ -eq "AGENTS.kit.md") { "AGENTS.md" }
		elseif ($_.StartsWith("dot-")) { "." + $_.Substring(4) }
		else { $_ }
	}) -join "/"
}

$files = @(Get-ChildItem -LiteralPath $kit -Recurse -File | ForEach-Object {
	[pscustomobject]@{ Source = $_.FullName; Rel = Get-RealName ($_.FullName.Substring($kit.Length + 1) -replace "\\", "/") }
})
$files += [pscustomobject]@{ Source = Join-Path $PSScriptRoot "docs/projects-json.md"; Rel = "_meta/docs/projects-json.md" }

$written = 0; $skipped = @()
foreach ($file in $files) {
	$target = Join-Path $Destination $file.Rel
	if (Test-Path -LiteralPath $target) { $skipped += $file.Rel; continue }
	New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
	Copy-Item -LiteralPath $file.Source -Destination $target
	$written++
}

Write-Host "Wrote $written file(s) in $Destination."
if ($skipped) { Write-Host "Kept $($skipped.Count) file(s) that were already there: $($skipped -join ', ')" }
Write-Host "Next: open $Destination\README.md and follow 'First steps'."
