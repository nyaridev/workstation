<#
	Lists the projects in the workstation and checks each one's .workstation file.

	  (no options)          Scan the workspace and check each project's .workstation
	  -Category games       Only one top-level folder (games, mods, emulators, apps, tools, frameworks, assets, ideas, research,
	                        external, sandbox, archive)
	  -Root D:/Old         Inventory of another tree instead: every git repo with its remote and last commit, no
	                        .workstation check (to see a folder before moving it in)
	  -Json                 Print the result as JSON

	A project is found by its place: games/<engine>/<game>/, mods/<game>/, emulators/<game>/, apps/<type>/<name>/, tools/<name>/,
	frameworks/<name>/ (a suite when it isn't a repo itself), assets/packs/<name>/, ideas/<name>/,
	research/<name>/, external/<owner>/<repo>/, sandbox/<name>/, and the same shapes under archive/.

	Each project's .workstation (in its main folder) is read and checked; sandbox experiments get none, and archived
	folders aren't flagged for having none.

	It also checks that each game home, mod home, emulator home and suite lists, in its CLAUDE.md, every folder below it that has its
	own CLAUDE.md, .claude/rules/ or .claude/skills/ (.claude/rules/instructions.md), since those don't load from there.
#>
param(
	[string]$Root,
	[string]$Category,
	[switch]$Json
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$inventory = [bool]$Root
if (-not $Root) { $Root = $workspace }
$Root = [IO.Path]::GetFullPath($Root).TrimEnd("\")

$skipNames = @("node_modules", ".venv", "venv", "__pycache__", ".godot", "target", ".git", "Library", "Temp", "obj")
$results = [System.Collections.Generic.List[object]]::new()

#%%%%%%%%%%%%%%%%%%%% Helpers

# The path from the scanned root, with forward slashes and a trailing slash
function Get-Relative([string]$path) { ($path.Substring($Root.Length).TrimStart("\") -replace "\\", "/") + "/" }

function Test-Repo([string]$path) { Test-Path -LiteralPath (Join-Path $path ".git") }

# The visible sub-folders of a folder, or nothing when it doesn't exist
function Get-Children([string]$path) {
	if (-not (Test-Path -LiteralPath $path)) { return @() }
	@(Get-ChildItem -LiteralPath $path -Directory -Force | Where-Object { $_.Name -notlike ".*" -and $skipNames -notcontains $_.Name })
}

# Git repos under a folder (not inside other repos), up to a depth
function Find-Repos([string]$path, [int]$depth) {
	if ($depth -lt 0) { return }
	foreach ($dir in Get-ChildItem -LiteralPath $path -Directory -Force -ErrorAction SilentlyContinue) {
		if ($skipNames -contains $dir.Name) { continue }
		if (Test-Repo $dir.FullName) { $dir.FullName; continue }
		Find-Repos $dir.FullName ($depth - 1)
	}
}

# The newest file change in a folder, skipping dependency folders
function Get-LastChange([string]$path) {
	$newest = Get-ChildItem -LiteralPath $path -File -Recurse -Force -ErrorAction SilentlyContinue |
		Where-Object { $_.FullName -notmatch '\\(node_modules|\.venv|venv|\.git|\.godot|target)\\' } |
		Sort-Object LastWriteTime -Descending | Select-Object -First 1
	if ($newest) { $newest.LastWriteTime } else { (Get-Item -LiteralPath $path).LastWriteTime }
}

# Folders below a home or suite with their own instructions: a CLAUDE.md, .claude/rules/ or .claude/skills/
function Find-InstructionFolders([string]$path, [int]$depth) {
	if ($depth -lt 0) { return }
	foreach ($dir in Get-ChildItem -LiteralPath $path -Directory -Force -ErrorAction SilentlyContinue) {
		if ($skipNames -contains $dir.Name -or @(".claude", ".github", ".vscode", ".idea") -contains $dir.Name) { continue }
		$own = @("CLAUDE.md", ".claude\rules", ".claude\skills") |
			Where-Object { Test-Path -LiteralPath (Join-Path $dir.FullName $_) }
		if ($own) { $dir.FullName }
		Find-InstructionFolders $dir.FullName ($depth - 1)
	}
}

function Add-Project([string]$path, [string]$kind, [string]$shape) {
	$remote = ""; $branch = ""; $dirty = $null; $unpushed = $null; $last = ""
	if (Test-Repo $path) {
		$remote = (git -C $path remote get-url origin 2>$null) -join ""
		$branch = (git -C $path rev-parse --abbrev-ref HEAD 2>$null) -join ""
		$dirty = @(git -C $path status --porcelain 2>$null).Count
		$last = (git -C $path log -1 --format=%cs 2>$null) -join ""
		$upstream = (git -C $path rev-parse --abbrev-ref "@{u}" 2>$null) -join ""
		if ($upstream) { $unpushed = [int]((git -C $path rev-list --count "@{u}..HEAD" 2>$null) -join "") }
	}
	$inner = if (Test-Repo $path) { @() } else { @(Find-Repos $path 2 | ForEach-Object { Get-Relative $_ }) }
	$changed = if ($kind -eq "sandbox") { (Get-LastChange $path).ToString("yyyy-MM-dd") } else { "" }
	$results.Add([pscustomobject]@{
		Path       = Get-Relative $path
		Name        = ""
		Kind       = $kind
		Status      = ""
		Description = ""
		Tags        = ""
		Shape      = $shape
		Branch     = $branch
		Dirty      = $dirty
		Unpushed   = $unpushed
		LastCommit = $last
		Changed    = $changed
		Remote     = $remote
		Repos      = $inner -join ", "
	})
}

# Applies the workspace's project shapes under a base folder (the root, or archive/)
function Find-Projects([string]$base, [bool]$archived) {
	$prefix = if ($archived) { "archived " } else { "" }
	$wanted = { param($top) $archived -or -not $Category -or $Category -eq $top }
	if (& $wanted "games") {
		foreach ($engine in Get-Children (Join-Path $base "games")) {
			foreach ($game in Get-Children $engine.FullName) { Add-Project $game.FullName "${prefix}game" "game home" }
		}
	}
	if (& $wanted "mods") {
		foreach ($modHome in Get-Children (Join-Path $base "mods")) { Add-Project $modHome.FullName "${prefix}mod" "mod home" }
	}
	if (& $wanted "emulators") {
		foreach ($emuHome in Get-Children (Join-Path $base "emulators")) { Add-Project $emuHome.FullName "${prefix}emulator" "emulator home" }
	}
	if (& $wanted "apps") {
		foreach ($type in Get-Children (Join-Path $base "apps")) {
			foreach ($app in Get-Children $type.FullName) { Add-Project $app.FullName "${prefix}app" "repo" }
		}
	}
	if (& $wanted "tools") {
		foreach ($tool in Get-Children (Join-Path $base "tools")) { Add-Project $tool.FullName "${prefix}tool" "repo" }
	}
	if (& $wanted "frameworks") {
		foreach ($framework in Get-Children (Join-Path $base "frameworks")) {
			if (Test-Repo $framework.FullName) { Add-Project $framework.FullName "${prefix}framework" "repo"; continue }
			Add-Project $framework.FullName "${prefix}suite" "suite"
			foreach ($repo in Find-Repos $framework.FullName 1) { Add-Project $repo "${prefix}framework" "repo" }
		}
	}
	if (& $wanted "assets") {
		foreach ($pack in Get-Children (Join-Path $base "assets\packs")) { Add-Project $pack.FullName "${prefix}asset-pack" "plain" }
	}
	if (& $wanted "ideas") {
		foreach ($idea in Get-Children (Join-Path $base "ideas")) { Add-Project $idea.FullName "${prefix}idea" "plain" }
	}
	if (& $wanted "research") {
		foreach ($study in Get-Children (Join-Path $base "research")) { Add-Project $study.FullName "${prefix}research" "plain" }
	}
	if (& $wanted "external") {
		foreach ($owner in Get-Children (Join-Path $base "external")) {
			foreach ($repo in Get-Children $owner.FullName) { Add-Project $repo.FullName "${prefix}external" "repo" }
		}
	}
}

#%%%%%%%%%%%%%%%%%%%% Scan

if ($inventory) {
	foreach ($repo in Find-Repos $Root 4) { Add-Project $repo "repo" "repo" }
}
else {
	Find-Projects $Root $false
	if (-not $Category -or $Category -eq "archive") { Find-Projects (Join-Path $Root "archive") $true }
	if (-not $Category -or $Category -eq "sandbox") {
		foreach ($experiment in Get-Children (Join-Path $Root "sandbox")) { Add-Project $experiment.FullName "sandbox" "plain" }
	}
}

#%%%%%%%%%%%%%%%%%%%% .workstation files

# Each project's .workstation: format in _meta/docs/workstation-file.md
$kinds = @("game", "mod", "emulator", "app", "tool", "framework", "suite", "asset-pack", "research", "idea", "external")
$statuses = @("concept", "planning", "researching", "prototyping", "in-development", "released", "maintained", "complete", "on-hold")
$required = @("name", "kind", "stack", "owner", "status", "description", "tags")

$files = 0
$invalid = @()
$unregistered = @()
$stale = @()
if (-not $inventory) {
	if (-not (Test-Path -LiteralPath (Join-Path $Root ".workstation"))) { $invalid += ".workstation: none at the root, which marks the workstation" }
	foreach ($project in $results | Where-Object { $_.Kind -ne "sandbox" }) {
		$label = "$($project.Path).workstation"
		$file = Join-Path $Root $label
		if (-not (Test-Path -LiteralPath $file)) {
			# Archived folders are never flagged: archive/ also holds leftovers that were never projects
			if ($project.Kind -notlike "archived *") { $unregistered += $project.Path }
			continue
		}
		$files++
		try { $entry = Get-Content -LiteralPath $file -Raw -Encoding utf8 | ConvertFrom-Json -ErrorAction Stop }
		catch { $invalid += "${label}: $($_.Exception.Message)"; continue }
		$names = @($entry.PSObject.Properties.Name)
		foreach ($field in $required | Where-Object { $names -notcontains $_ }) { $invalid += "${label}: no '$field'" }
		if ($names -contains "path") { $invalid += "${label}: has a 'path'; a project's path is where its file is" }
		if ($entry.kind -and $kinds -notcontains $entry.kind) { $invalid += "${label}: unknown kind '$($entry.kind)'" }
		if ($entry.status -and $statuses -notcontains $entry.status) { $invalid += "${label}: unknown status '$($entry.status)'" }
		foreach ($tag in @($entry.tags) | Where-Object { $_ -cnotmatch '^[a-z0-9]+(-[a-z0-9]+)*$' }) { $invalid += "${label}: tag '$tag' isn't kebab-case" }
		if ($names -contains "milestones") {
			$i = 0
			foreach ($milestone in @($entry.milestones)) {
				$i++
				if (-not ($milestone -is [pscustomobject]) -or -not "$($milestone.name)".Trim()) { $invalid += "${label}: milestone $i has no name"; continue }
				if ($null -ne $milestone.done -and $milestone.done -isnot [bool]) { $invalid += "${label}: milestone '$($milestone.name)': 'done' must be true or false" }
			}
		}
		$project.Name = "$($entry.name)"
		$project.Status = "$($entry.status)"
		$project.Description = "$($entry.description)"
		$project.Tags = @($entry.tags) -join ", "
	}
	$stale = @($results | Where-Object { $_.Kind -eq "sandbox" -and ((Get-Date) - [datetime]$_.Changed).Days -ge 60 })
}

#%%%%%%%%%%%%%%%%%%%% Instructions

# Each home or suite's CLAUDE.md must name, in backticks, every folder below it with its own instructions
$unlisted = @()
if (-not $inventory) {
	$homes = $results | Where-Object { @("game home", "mod home", "emulator home", "suite") -contains $_.Shape -and $_.Kind -notlike "archived *" }
	foreach ($project in $homes) {
		$homePath = [IO.Path]::GetFullPath((Join-Path $Root $project.Path)).TrimEnd("\")
		$claude = Join-Path $homePath "CLAUDE.md"
		$text = if (Test-Path -LiteralPath $claude) { Get-Content -LiteralPath $claude -Raw } else { "" }
		foreach ($folder in Find-InstructionFolders $homePath 3) {
			$relative = ($folder.Substring($homePath.Length).TrimStart("\") -replace "\\", "/") + "/"
			if (-not $text.Contains("``$relative``")) { $unlisted += "$($project.Path)$relative" }
		}
	}
}

#%%%%%%%%%%%%%%%%%%%% Report

if ($Json) {
	[pscustomobject]@{
		Root         = $Root
		Projects     = $results
		Invalid      = $invalid
		NoFile       = $unregistered
		Stale        = @($stale | ForEach-Object { $_.Path })
		Unlisted     = $unlisted
	} | ConvertTo-Json -Depth 4
	return
}

if ($results.Count -eq 0) { Write-Host "No projects found under $Root." }
else {
	$results | Format-Table Path, Name, Kind, Status, Shape, Branch, Dirty, Unpushed, LastCommit, Changed, Remote, Repos -AutoSize |
		Out-String -Width 400 | Write-Host
}

if (-not $inventory) {
	Write-Host "Registry: $files .workstation file$(if ($files -ne 1) { 's' })"
	foreach ($problem in $invalid) { Write-Host "  invalid          $problem" }
	foreach ($path in $unregistered) { Write-Host "  no .workstation  $path" }
	foreach ($project in $stale) { Write-Host "  stale sandbox  $($project.Path) (last change $($project.Changed))" }
	foreach ($project in $results | Where-Object { $_.Dirty -gt 0 }) { Write-Host "  uncommitted    $($project.Path) ($($project.Dirty) change(s))" }
	foreach ($project in $results | Where-Object { $_.Unpushed -gt 0 }) { Write-Host "  unpushed       $($project.Path) ($($project.Unpushed) commit(s))" }
	if (-not ($invalid -or $unregistered -or $stale)) { Write-Host "  every project has a valid .workstation" }
	Write-Host "Instructions: rules below each home or suite, listed in its CLAUDE.md"
	foreach ($path in $unlisted) { Write-Host "  not listed     $path" }
	if (-not $unlisted) { Write-Host "  every home lists its rules" }
}
