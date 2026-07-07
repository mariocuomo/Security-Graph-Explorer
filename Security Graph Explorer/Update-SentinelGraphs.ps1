<#
.SYNOPSIS
    Updates the "csv" field in sentinel-graphs.json by reading CSV files
    from the "data" folder.

.DESCRIPTION
    Manual workflow:
      1. Run each KQL query in the Microsoft Defender / Sentinel portal.
      2. Export the results as CSV.
      3. Rename the file to the exact graph name (e.g. "Identity Logon Map.csv").
      4. Place it in the "data" subfolder next to this script.
      5. Run this script.

.PARAMETER JsonPath
    Path to the sentinel-graphs.json file to update.
    Default: same folder as this script.

.PARAMETER DataFolder
    Folder containing the CSV files.
    Default: "data" subfolder next to this script.

.EXAMPLE
    .\Update-SentinelGraphs.ps1
#>

[CmdletBinding()]
param(
    [string] $JsonPath   = (Join-Path $PSScriptRoot "sentinel-graphs.json"),
    [string] $DataFolder = (Join-Path $PSScriptRoot "data")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── 1. Verify paths ───────────────────────────────────────────────────────────
if (-not (Test-Path $JsonPath)) {
    Write-Error "File not found: $JsonPath"
    exit 1
}

if (-not (Test-Path $DataFolder)) {
    Write-Error "Data folder not found: $DataFolder`nCreate the folder and place the CSV files inside it."
    exit 1
}

# ── 2. Load JSON ──────────────────────────────────────────────────────────────
$bundles = Get-Content $JsonPath -Raw | ConvertFrom-Json
Write-Host "Loaded $($bundles.Count) bundle(s) from '$JsonPath'" -ForegroundColor Cyan

$csvFiles = Get-ChildItem -Path $DataFolder -Filter "*.csv"
Write-Host "Found $($csvFiles.Count) CSV file(s) in '$DataFolder'" -ForegroundColor Cyan

if ($csvFiles.Count -eq 0) {
    Write-Host "No CSV files to process." -ForegroundColor Yellow
    exit 0
}

# ── 3. Match CSV files to bundles and update ──────────────────────────────────
$updated = 0
$skipped = 0

foreach ($csvFile in $csvFiles) {
    $graphName = $csvFile.BaseName   # filename without extension

    # Find matching bundle (case-insensitive)
    $index = -1
    for ($i = 0; $i -lt $bundles.Count; $i++) {
        if ($bundles[$i].name -ieq $graphName) {
            $index = $i
            break
        }
    }

    if ($index -eq -1) {
        Write-Host "  [$graphName] No matching graph found in JSON - skipped." -ForegroundColor DarkYellow
        $skipped++
        continue
    }

    # Read CSV content as-is (preserve original formatting)
    $csvContent = Get-Content -Path $csvFile.FullName -Raw -Encoding UTF8
    $csvContent = $csvContent.TrimEnd()

    if ([string]::IsNullOrWhiteSpace($csvContent)) {
        Write-Host "  [$graphName] CSV file is empty - skipped." -ForegroundColor DarkYellow
        $skipped++
        continue
    }

    $bundles[$index].csv = $csvContent

    $rowCount = ($csvContent -split "`n").Count - 1   # subtract header row
    Write-Host "  [$graphName] Updated ($rowCount row(s))" -ForegroundColor Green
    $updated++
}

# ── 4. Write updated JSON ─────────────────────────────────────────────────────
if ($updated -gt 0) {
    $utf8Bom = New-Object System.Text.UTF8Encoding($true)
    $json    = $bundles | ConvertTo-Json -Depth 20 -Compress:$false
    [System.IO.File]::WriteAllText($JsonPath, $json, $utf8Bom)
    Write-Host "`nFile updated: $JsonPath ($updated graph(s) updated, $skipped skipped)" -ForegroundColor Green
}
else {
    Write-Host "`nNo graphs updated ($skipped skipped)." -ForegroundColor Yellow
}
