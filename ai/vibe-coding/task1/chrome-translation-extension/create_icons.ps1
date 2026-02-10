$base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
$bytes = [Convert]::FromBase64String($base64)

$iconDir = "e:\Code\ai-inline-translator\icons"
if (!(Test-Path $iconDir)) {
    New-Item -ItemType Directory -Force -Path $iconDir
}

[IO.File]::WriteAllBytes("$iconDir\icon16.png", $bytes)
[IO.File]::WriteAllBytes("$iconDir\icon48.png", $bytes)
[IO.File]::WriteAllBytes("$iconDir\icon128.png", $bytes)

Write-Host "Icons created successfully."
