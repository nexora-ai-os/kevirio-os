param(
  [Parameter(Mandatory = $true)][string]$TaskName,
  [Parameter(Mandatory = $true)][string]$NpmPath
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$logRoot = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'KEVIRIO-Logs\obsidian-sync'
$logFile = Join-Path $logRoot 'scheduler.log'
$mutex = [System.Threading.Mutex]::new($false, 'Local\KEVIRIO-Obsidian-Sync')
$acquired = $false
$exitCode = 1
$result = 'FAILED'
$readState = 'UNKNOWN'

try {
  New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
  $acquired = $mutex.WaitOne(0)
  if (-not $acquired) {
    $result = 'SKIPPED_CONCURRENT_RUN'
    $exitCode = 0
  } else {
    Push-Location $repo
    try {
      $output = (& $NpmPath run obsidian:sync 2>&1 | Out-String)
      $exitCode = $LASTEXITCODE
      if ($output -match '"snapshotState"\s*:\s*"([A-Z_]+)"') { $readState = $Matches[1] }
      $result = if ($exitCode -eq 0) { 'SUCCESS' } else { 'FAILED' }
    } finally {
      Pop-Location
    }
  }
} catch {
  $result = 'FAILED'
  $exitCode = 1
} finally {
  $record = [ordered]@{
    timestamp = [DateTimeOffset]::Now.ToString('o')
    task = $TaskName
    result = $result
    readState = $readState
    exitCode = $exitCode
  } | ConvertTo-Json -Compress
  Add-Content -LiteralPath $logFile -Value $record -Encoding UTF8
  if ($acquired) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}

exit $exitCode
