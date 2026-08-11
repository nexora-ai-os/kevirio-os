param([switch]$Install)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$wrapper = (Resolve-Path (Join-Path $PSScriptRoot 'scheduled-sync.ps1')).Path
$powerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$owner = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$tasks = @(
  @{ Name = 'KEVIRIO-Obsidian-Sync-Morning'; At = '08:00' },
  @{ Name = 'KEVIRIO-Obsidian-Sync-Evening'; At = '20:00' }
)

foreach ($task in $tasks) {
  Write-Output "$($task.Name): daily $($task.At); repo=$repo; npm=$npm; owner=$owner"
}

if (-not $Install) {
  Write-Output 'PREVIEW ONLY. Use -Install only with explicit Owner approval.'
  exit 0
}

$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30) -RestartCount 0 -DontStopIfGoingOnBatteries
$settings.WakeToRun = $false
$principal = New-ScheduledTaskPrincipal -UserId $owner -LogonType Interactive -RunLevel Limited

foreach ($task in $tasks) {
  $arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$wrapper`" -TaskName `"$($task.Name)`" -NpmPath `"$npm`""
  $action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments -WorkingDirectory $repo
  $trigger = New-ScheduledTaskTrigger -Daily -At $task.At
  Register-ScheduledTask -TaskName $task.Name -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
}

Get-ScheduledTask -TaskName $tasks.Name
