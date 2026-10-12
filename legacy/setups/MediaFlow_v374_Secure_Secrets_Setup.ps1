# MediaFlow v374 - securely configure MAL + SIMKL credentials in Supabase.
# Run on your own Windows computer, after rotating any secrets that appeared in screenshots.
# Never paste API secrets into ChatGPT, screenshots, GitHub, or public files.
# Requires Node.js/npm, an Owner/Admin Supabase account, and CLI login.
# Uses a uniquely named local temporary .env file, deletes it after upload,
# and caches only the encryption key encrypted with Windows DPAPI for this user.

$ErrorActionPreference = 'Stop'
$ProjectRef = 'wgeijxfdpgehesxialxm'
$Redirect = 'https://alexgodly.github.io/MediaFlow/tracking-callback.html'

function Get-HiddenText([string]$Prompt) {
    $secure = Read-Host -Prompt $Prompt -AsSecureString
    if ($secure.Length -eq 0) { throw "Required value '$Prompt' is empty." }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
function Check-Value([string]$Name, [string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) { throw "Missing required value: $Name" }
    if ($Value.Contains("`r") -or $Value.Contains("`n")) { throw "Line breaks are not allowed in $Name." }
}
function Generate-TokenKey {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes); return [Convert]::ToBase64String($bytes) }
    finally { $rng.Dispose(); [Array]::Clear($bytes, 0, $bytes.Length) }
}

Write-Host "`nMediaFlow v374 - MAL / SIMKL secure setup" -ForegroundColor Cyan
Write-Host "Supabase project: $ProjectRef (mediaflowcloud)"
Write-Host 'The Edge Function and database migration are already deployed. This only configures secrets.'
Write-Host 'IMPORTANT: Rotate BOTH Client Secrets previously visible in screenshots before continuing.' -ForegroundColor Yellow
Write-Host 'This program will not reveal them or save them in your MediaFlow project.'

$ready = Read-Host 'Have you already ROTATED BOTH exposed client secrets? Type YES to proceed'
if ($ready -cne 'YES') {
    Write-Host 'Stopped safely. Rotate secrets in the MAL and SIMKL developer dashboards first.' -ForegroundColor Yellow
    exit 0
}
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw 'Node.js/npm (npx) is not installed. Install Node.js or use the Supabase Edge Function Secrets Dashboard.'
}

$malId = Read-Host 'Enter MAL Client ID (public)'
$simklId = Read-Host 'Enter SIMKL Client ID (public)'
Check-Value 'MAL_CLIENT_ID' $malId
Check-Value 'SIMKL_CLIENT_ID' $simklId
$malSecret = Get-HiddenText 'Enter NEW MAL Client Secret (hidden)'
$simklSecret = Get-HiddenText 'Enter NEW SIMKL Client Secret (hidden)'
Check-Value 'MAL_CLIENT_SECRET' $malSecret
Check-Value 'SIMKL_CLIENT_SECRET' $simklSecret

$settingsDir = Join-Path $env:LOCALAPPDATA 'MediaFlow\Private'
if (-not (Test-Path -LiteralPath $settingsDir)) { New-Item -Path $settingsDir -ItemType Directory -Force | Out-Null }
$keyPath = Join-Path $settingsDir 'tracking-token-key.dpapi'
if (Test-Path -LiteralPath $keyPath) {
    Write-Host 'Using existing encryption key from encrypted Windows-user cache.'
    $encodedKey = (Get-Content -LiteralPath $keyPath -Raw).Trim() | ConvertTo-SecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($encodedKey)
    try { $tokenKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
} else {
    $tokenKey = Generate-TokenKey
    $securedKey = ConvertTo-SecureString -String $tokenKey -AsPlainText -Force
    ($securedKey | ConvertFrom-SecureString) | Set-Content -LiteralPath $keyPath -Encoding ASCII -NoNewline
    Write-Host "Created new encryption key; encrypted backup saved for this Windows user: $keyPath" -ForegroundColor Green
    Write-Host 'IMPORTANT: Keep this DPAPI backup when updating your app. Changing the key will invalidate existing provider tokens.' -ForegroundColor Yellow
}
if ([Convert]::FromBase64String($tokenKey).Length -ne 32) { throw 'Invalid encryption key length.' }

# Authenticate BEFORE writing plaintext secrets to disk.
Write-Host "`nSign in through the official Supabase CLI if prompted..." -ForegroundColor Cyan
& npx --yes supabase@latest login
if ($LASTEXITCODE -ne 0) { throw 'Supabase login did not complete; no secrets uploaded.' }

$envFile = Join-Path $env:TEMP ("mediaflow-v374-" + [guid]::NewGuid().ToString('N') + '.env')
try {
    $values = [ordered]@{
        MAL_CLIENT_ID = $malId.Trim()
        MAL_CLIENT_SECRET = $malSecret
        SIMKL_CLIENT_ID = $simklId.Trim()
        SIMKL_CLIENT_SECRET = $simklSecret
        MEDIAFLOW_TRACKING_REDIRECT = $Redirect
        TRACKING_TOKEN_KEY = $tokenKey
    }
    $lines = @($values.Keys | ForEach-Object {
        $key = [string]$_
        $value = [string]$values[$key]
        Check-Value $key $value
        if ($value -match '[\r\n]') { throw "Invalid newline in $key." }
        "$key=$value"
    })
    # User-specific Windows TEMP directory. File exists only for the CLI upload.
    [IO.File]::WriteAllLines($envFile, [string[]]$lines, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host 'Uploading six private environment variables to Supabase (values not printed)...' -ForegroundColor Cyan
    & npx --yes supabase@latest secrets set --env-file $envFile --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) { throw 'Supabase rejected the secret upload. No successful configuration is claimed.' }
    Write-Host 'Secrets uploaded successfully. Verifying the names on the remote project...' -ForegroundColor Cyan
    & npx --yes supabase@latest secrets list --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) { throw 'Upload succeeded, but checking the remote secret list failed.' }
    Write-Host "`nConfiguration complete. No function redeploy or database migration is necessary." -ForegroundColor Green
    Write-Host 'Next: publish v374 (including tracking-callback.html), then connect MAL and SIMKL in MediaFlow.'
} finally {
    if ($envFile -and (Test-Path -LiteralPath $envFile)) {
        Remove-Item -LiteralPath $envFile -Force -ErrorAction SilentlyContinue
        if (Test-Path -LiteralPath $envFile) { Write-Warning "Temporary secret file was not removed. Delete it manually: $envFile" }
    }
    $malSecret = $null
    $simklSecret = $null
    $tokenKey = $null
    $lines = $null
    $values = $null
}
