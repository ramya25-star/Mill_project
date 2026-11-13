<#
  Makes Meta send supplier replies (and delivered/read updates) to Mill Mate.

  Problem it fixes: the WhatsApp Business Account had no app subscribed, so Meta
  delivered nothing to https://api.alagiriduplex.com/api/whatsapp/inbound even
  though the webhook URL was set. This subscribes the Mill Mate app to the
  account (same as WhatsApp Manager > Account tools > Partners/Apps). Undo with
  a DELETE on the same endpoint.

  Run from the project folder:
      .\scripts\fix-whatsapp-webhook.ps1
#>
param([string]$EnvFile = (Join-Path $HOME 'MillMate_secrets\env2'))

$vals = @{}
foreach ($line in Get-Content $EnvFile) {
  if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') { $vals[$Matches[1]] = $Matches[2].Trim().Trim('"') }
}
$token = $vals['META_ACCESS_TOKEN']; $waba = $vals['META_WABA_ID']
if (-not $token -or -not $waba) { Write-Host "META_ACCESS_TOKEN or META_WABA_ID missing in $EnvFile" -ForegroundColor Red; exit 1 }
$headers = @{ Authorization = "Bearer $token" }
$url = "https://graph.facebook.com/v21.0/$waba/subscribed_apps"

Write-Host 'Subscribing the Mill Mate app to the WhatsApp account...'
try {
  $r = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -TimeoutSec 30
  Write-Host "  Meta answered: success = $($r.success)"
} catch {
  Write-Host "  Failed: $($_.ErrorDetails.Message)" -ForegroundColor Red; exit 1
}

$list = Invoke-RestMethod -Uri $url -Headers $headers -TimeoutSec 30
if ($list.data.Count -gt 0) {
  foreach ($a in $list.data) { Write-Host "  Subscribed app: $($a.whatsapp_business_api_data.name)" -ForegroundColor Green }
  Write-Host ''
  Write-Host 'Done. Send "hi" to +91 90252 79189 from your phone, then run .\scripts\check-whatsapp.ps1' -ForegroundColor Green
} else {
  Write-Host '  Still no app subscribed. Ask your friend to link the app in WhatsApp Manager.' -ForegroundColor Red
}
