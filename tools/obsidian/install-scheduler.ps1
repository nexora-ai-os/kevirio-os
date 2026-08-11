param([switch]$Install)
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$action = New-ScheduledTaskAction -Execute 'npm.cmd' -Argument 'run obsidian:sync' -WorkingDirectory $repo
if (-not $Install) {
  Write-Output 'PREVIEW ONLY. Owner approval is required before enabling.'
  Write-Output "Morning trigger: New-ScheduledTaskTrigger -Daily -At 08:00"
  Write-Output "Evening trigger: New-ScheduledTaskTrigger -Daily -At 20:00"
  Write-Output "Action working directory: $repo"
  exit 0
}
throw 'SCHEDULER_INSTALL_REQUIRES_SEPARATE_OWNER_APPROVAL'
