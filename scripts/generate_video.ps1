# Smart Parking Platform - MP4 Demo Video Generator
# SR University Hackathon 2026

param(
    [string]$OutputDir = "$PSScriptRoot\..\submission",
    [string]$OutputName = "Smart_Parking_Platform_Demo.mp4"
)

Add-Type -AssemblyName 'System.Runtime.WindowsRuntime'

$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Media.Editing.MediaClip, Windows.Media.Editing, ContentType=WindowsRuntime]
$null = [Windows.Media.Editing.MediaComposition, Windows.Media.Editing, ContentType=WindowsRuntime]
$null = [Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType=WindowsRuntime]

# Helper to await WinRT AsyncOperation
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod 
})[0]

$asTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and -not $_.IsGenericMethod 
})[0]

function Await-WinRtOp($asyncOp, [type]$resultType) {
    $method = $asTaskGeneric.MakeGenericMethod($resultType)
    $task = $method.Invoke($null, @($asyncOp))
    $task.Wait()
    return $task.Result
}

function Await-WinRtAction($asyncAction) {
    $task = $asTaskAction.Invoke($null, @($asyncAction))
    $task.Wait()
}

Write-Host "Creating MediaComposition for Smart Parking Platform Demo..."

$composition = New-Object Windows.Media.Editing.MediaComposition

$screenshotsDir = Join-Path $PSScriptRoot "..\docs\screenshots"
$images = @(
    "landing_page.png",
    "user_booking_success.png",
    "admin_dashboard.png",
    "access_denied_security.png"
)

$duration = [System.TimeSpan]::FromSeconds(6)

foreach ($img in $images) {
    $imgPath = (Resolve-Path (Join-Path $screenshotsDir $img)).Path
    Write-Host "Adding clip: $img (duration: 6s)..."
    $storageFile = Await-WinRtOp ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath)) ([Windows.Storage.StorageFile])
    $clip = Await-WinRtOp ([Windows.Media.Editing.MediaClip]::CreateFromImageFileAsync($storageFile, $duration)) ([Windows.Media.Editing.MediaClip])
    $composition.Clips.Add($clip)
}

$destPath = Join-Path $OutputDir $OutputName
if (Test-Path $destPath) {
    Remove-Item $destPath -Force
}

$destDir = Split-Path $destPath -Parent
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

# Create empty file first for StorageFile
$null = New-Item -ItemType File -Path $destPath -Force
$destStorageFile = Await-WinRtOp ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path $destPath).Path)) ([Windows.Storage.StorageFile])

$profile = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp4([Windows.Media.MediaProperties.VideoEncodingQuality]::HD720p)

Write-Host "Rendering MP4 video to $destPath..."
$renderOp = $composition.RenderToFileAsync($destStorageFile, [Windows.Media.Editing.MediaTrimmingOptions]::AllContent, $profile)
Await-WinRtAction $renderOp

Write-Host "Video rendering complete! File size: $((Get-Item $destPath).Length) bytes"
