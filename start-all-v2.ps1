Start-Transcript -Path "$env:TEMP\startup-output.log" -Force

Write-Host "=== Killing existing node processes ==="
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "=== Starting Backend ==="
$backendDir = "C:\Users\Shadrack\Documents\eny\enyagasambu-main\backend"
Set-Location $backendDir
$env:PORT = "5000"
Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory $backendDir -RedirectStandardError "$env:TEMP\backend-err.log" -RedirectStandardOutput "$env:TEMP\backend-out.log" -NoNewWindow

Start-Sleep -Seconds 5

Write-Host "=== Backend output ==="
if (Test-Path "$env:TEMP\backend-out.log") { Get-Content "$env:TEMP\backend-out.log" }
if (Test-Path "$env:TEMP\backend-err.log") { Get-Content "$env:TEMP\backend-err.log" }

Write-Host "=== Starting Frontend ==="
$frontendDir = "C:\Users\Shadrack\Documents\eny\enyagasambu-main\frontend"
Start-Process -FilePath "npx" -ArgumentList "next","dev","-p","3000" -WorkingDirectory $frontendDir -RedirectStandardError "$env:TEMP\frontend-err.log" -RedirectStandardOutput "$env:TEMP\frontend-out.log" -NoNewWindow

Start-Sleep -Seconds 15

Write-Host "=== Frontend output ==="
if (Test-Path "$env:TEMP\frontend-out.log") { Get-Content "$env:TEMP\frontend-out.log" -Tail 10 }
if (Test-Path "$env:TEMP\frontend-err.log") { Get-Content "$env:TEMP\frontend-err.log" -Tail 10 }

Write-Host "=== Port check ==="
netstat -ano | findstr "LISTENING" | findstr ":3000 :5000"

Write-Host "=== Process check ==="
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName

Stop-Transcript
