# Kill existing node processes
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
$backendDir = "C:\Users\Shadrack\Documents\eny\enyagasambu-main\backend"
$proc1 = Start-Process node -ArgumentList "src/index.js" -WorkingDirectory $backendDir -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 3

# Start frontend
$frontendDir = "C:\Users\Shadrack\Documents\eny\enyagasambu-main\frontend"
$proc2 = Start-Process npx -ArgumentList "next","dev","-p","3000" -WorkingDirectory $frontendDir -PassThru -WindowStyle Minimized

# Wait for servers
Start-Sleep -Seconds 15

# Check status
$portCheck = netstat -ano | Select-String "LISTENING" | Select-String ":4000 |:3000 "

$backendStatus = if (!$proc1.HasExited) { "RUNNING" } else { "STOPPED" }
$frontendStatus = if (!$proc2.HasExited) { "RUNNING" } else { "STOPPED" }

$report = @"
=== E-Nyagasambu Server Status ===
Backend PID: $($proc1.Id) - Port 4000 - $backendStatus
Frontend PID: $($proc2.Id) - Port 3000 - $frontendStatus

Listening Ports:
$($portCheck -join "`n")
"@

$report | Out-File "C:\Users\Shadrack\AppData\Local\Temp\server-report.txt" -Encoding UTF8
