<#
  Creates (or resets) a Mill Mate Console user on the live server.
  The Console (https://alagiri-mill.vercel.app/console/) has no sign-up page,
  so the first owner is made with this script. Run it AFTER the multi-company
  version is deployed.

  Run from the project folder in PowerShell:
      .\scripts\create-console-user.ps1 -Username prasath -Role owner -Name 'K. A. Prasath' -Password 'Choose-A-Strong-One'
      .\scripts\create-console-user.ps1 -Username siva -Role support -Name 'Siva Sanjay Muthu T' -Password '...'

  Roles: owner (everything), admin (companies, payments), support (help only, no money).
  Running it again for an existing username resets that user's password AND
  their authenticator (use it if a phone is lost). At the next sign-in the
  Console shows a setup key for Google/Microsoft Authenticator.
#>
param(
  [Parameter(Mandatory = $true)][string]$Username,
  [Parameter(Mandatory = $true)][ValidateSet('owner', 'admin', 'support')][string]$Role,
  [Parameter(Mandatory = $true)][string]$Password,
  [string]$Name = ''
)

$Domain        = 'api.alagiriduplex.com'
$SshKey        = Join-Path $HOME '.ssh\millmate-api.pem'
$AwsProfile    = 'millmate'
$AwsRegion     = 'ap-southeast-2'
$SecurityGroup = 'sg-0045e793bab28ba16'

if ($Password.Length -lt 8) { Write-Host 'Password must be at least 8 characters.' -ForegroundColor Red; exit 1 }
if ($Username -notmatch '^[A-Za-z0-9._-]{3,40}$') { Write-Host 'Username: 3-40 letters, digits, dot, dash or underscore.' -ForegroundColor Red; exit 1 }

# ---- 1. Firewall ----
Write-Host '1/2 Allowing this PC through the AWS firewall (SSH)...'
# Some networks can't reach checkip.amazonaws.com, so try a few services.
$myIp = $null
foreach ($ipUrl in 'https://checkip.amazonaws.com', 'https://api.ipify.org', 'https://ifconfig.me/ip') {
  try {
    $candidate = (Invoke-RestMethod -Uri $ipUrl -TimeoutSec 15 -ErrorAction Stop).ToString().Trim()
    if ($candidate -match '^\d{1,3}(\.\d{1,3}){3}$') { $myIp = $candidate; break }
  } catch { }
}
if (-not $myIp) { Write-Host 'Could not find this PC public IP address. Check the internet connection.' -ForegroundColor Red; exit 1 }
$cidrs = aws ec2 describe-security-groups --group-ids $SecurityGroup --profile $AwsProfile --region $AwsRegion `
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`22`].IpRanges[].CidrIp' --output text
if ("$cidrs" -match [regex]::Escape("$myIp/32")) {
  Write-Host "   SSH already allowed from $myIp"
} else {
  $perm = "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=$myIp/32,Description=developer}]"
  aws ec2 authorize-security-group-ingress --group-id $SecurityGroup --ip-permissions $perm `
    --profile $AwsProfile --region $AwsRegion --output text | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host 'Could not update the AWS firewall.' -ForegroundColor Red; exit 1 }
  Write-Host "   SSH now allowed from $myIp"
  Start-Sleep -Seconds 5
}

# ---- 2. Create the Console user on the server ----
Write-Host "2/2 Creating Console user '$Username' ($Role)..."
# Values travel as base64 so special characters survive the trip.
$pw64   = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Password))
$name64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Name))

$remote = @"
set -e
DB=`$(grep -E '^DB_PATH=' /etc/millmate.env | tail -1 | cut -d= -f2- | tr -d '"' || true)
DB=`${DB:-/var/lib/millmate/alagiri.db}
PDB=`$(grep -E '^PLATFORM_DB_PATH=' /etc/millmate.env | tail -1 | cut -d= -f2- | tr -d '"' || true)
cd /opt/millmate/server
if [ ! -f scripts/create-console-user.js ]; then echo 'The server does not have the multi-company version yet - deploy first.'; exit 3; fi
NAME=`$(echo '$name64' | base64 -d)
sudo -u millmate env DB_PATH="`$DB" `${PDB:+PLATFORM_DB_PATH="`$PDB"} CONSOLE_PASSWORD64='$pw64' node scripts/create-console-user.js '$Username' '$Role' "`$NAME"
"@

$remote = $remote -replace "`r", ''
$remote64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remote))
ssh -i $SshKey -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 "ubuntu@$Domain" "echo $remote64 | base64 -d | sudo bash"
if ($LASTEXITCODE -ne 0) { Write-Host 'It did not finish - see the lines above.' -ForegroundColor Red; exit 1 }

Write-Host ''
Write-Host "Done. Sign in at https://alagiri-mill.vercel.app/console/ as '$Username'." -ForegroundColor Green
Write-Host 'First sign-in: add the shown setup key to Google/Microsoft Authenticator, then enter the 6-digit code.'
