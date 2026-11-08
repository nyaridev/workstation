<#
	Copies one or more templates from _meta/templates into a destination, in order: a later template overwrites an
	earlier one file by file. Placeholders are filled in text files and in file and folder names.

	  -Template game-home,game-godot,godot-project   Template folder names, applied in order
	  -Destination games/godot/mining-game            Target folder (absolute, or relative to the workstation)
	  -Name mining-game                               kebab-case slug: {{Name}}; {{Module}} is its snake_case form
	  -Title "Mining Game"                            Display name: {{Title}} (default: the name in Title Case)
	  -Owner my-user                                  GitHub owner: {{Owner}} (default: local)
	  -Engine "Godot 4.7"                             Engine and version: {{Engine}} (default: empty)
	  -Merge                                          Write only files that don't exist yet (for a folder that has content)
	  -DryRun                                         Print what would be written and change nothing

	Without -Merge it refuses a destination that exists and isn't empty. {{Date}} is today (yyyy-MM-dd).
#>
param(
	[Parameter(Mandatory)][string[]]$Template,
	[Parameter(Mandatory)][string]$Destination,
	[Parameter(Mandatory)][string]$Name,
	[string]$Title,
	[string]$Owner = "local",
	[string]$Engine = "",
	[switch]$Merge,
	[switch]$DryRun
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$templates = Join-Path $workspace "_meta\templates"

# "-Template a,b" from a shell can arrive as one string
$Template = @($Template | ForEach-Object { $_ -split "," } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

if ($Name -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') { throw "The name must be kebab-case (lowercase words joined by '-'), got '$Name'" }
if (-not $Title) { $Title = ($Name -split "-" | ForEach-Object { $_.Substring(0, 1).ToUpper() + $_.Substring(1) }) -join " " }

$values = [ordered]@{
	"{{Name}}"   = $Name
	"{{Title}}"  = $Title
	"{{Module}}" = $Name.Replace("-", "_")
	"{{Owner}}"  = $Owner
	"{{Engine}}" = $Engine
	"{{Date}}"   = (Get-Date -Format "yyyy-MM-dd")
}

# Replaces every placeholder in a string
function Format-Placeholders([string]$text) {
	foreach ($key in $values.Keys) { $text = $text.Replace($key, $values[$key]) }
	return $text
}

if (-not [IO.Path]::IsPathRooted($Destination)) { $Destination = Join-Path $workspace $Destination }
$Destination = [IO.Path]::GetFullPath($Destination).TrimEnd("\")

if ((Test-Path -LiteralPath $Destination) -and -not $Merge) {
	if (Get-ChildItem -LiteralPath $Destination -Force | Select-Object -First 1) {
		throw "$Destination exists and isn't empty (pass -Merge to add only the files that are missing)"
	}
}

# Files with these extensions get their placeholders filled; anything else is copied byte for byte
$textExtensions = @("", ".md", ".txt", ".json", ".yaml", ".yml", ".toml", ".py", ".bat", ".cmd", ".ps1", ".godot", ".tscn",
	".gd", ".cfg", ".svg", ".gitignore", ".gitattributes", ".gitkeep", ".gdignore", ".lua", ".luau", ".ts", ".html", ".css")

# Plan every write first, so a missing template fails before anything changes
$plan = [ordered]@{}
foreach ($templateName in $Template) {
	$source = Join-Path $templates $templateName
	if (-not (Test-Path -LiteralPath $source)) { throw "There's no template '$templateName' in $templates" }
	foreach ($item in Get-ChildItem -LiteralPath $source -Recurse -Force) {
		$relative = Format-Placeholders $item.FullName.Substring($source.Length + 1)
		$plan[(Join-Path $Destination $relative)] = $item
	}
}

$written = 0
$kept = 0
foreach ($target in $plan.Keys) {
	$item = $plan[$target]
	if ($item.PSIsContainer) {
		if (-not $DryRun) { New-Item -ItemType Directory -Force -Path $target | Out-Null }
		continue
	}
	if ($Merge -and (Test-Path -LiteralPath $target)) {
		$kept++
		Write-Host "  keep   $target"
		continue
	}
	$written++
	Write-Host "  write  $target"
	if ($DryRun) { continue }
	New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
	if ($textExtensions -contains $item.Extension.ToLower()) {
		$text = [IO.File]::ReadAllText($item.FullName)
		[IO.File]::WriteAllText($target, (Format-Placeholders $text), [Text.UTF8Encoding]::new($false))
	}
	else {
		Copy-Item -LiteralPath $item.FullName -Destination $target -Force
	}
}

$verb = if ($DryRun) { "Would write" } else { "Wrote" }
$keptNote = if ($kept) { ", kept $kept existing" } else { "" }
Write-Host "$verb $written file(s)$keptNote in $Destination (templates: $($Template -join ', '))"
