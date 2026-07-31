Start-Sleep -Seconds 3

$backend = Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory "C:\Users\Shadrack\Documents\eny\enyagasambu-main\backend" -PassThru -WindowStyle Hidden
$frontend = Start-Process -FilePath "npx" -ArgumentList "next","dev","-p","3000" -WorkingDirectory "C:\Users\Shadrack\Documents\eny\enyagasambu-main\frontend" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 15

$ports = netstat -ano | Select-String ":3000 |:5000 "
$result = "Backend PID: $($backend.Id) | Frontend PID: $($frontend.Id)`n"
$result += "Listening ports:`n$ports"

$backendAlive = Get-Process -Id $backend.Id -ErrorAction SilentlyContinue
$frontendAlive = Get-Process -Id $frontend.Id -ErrorAction SilentlyContinue

if ($backendAlive) { $result += "`nBackend: RUNNING (port 5000)" } else { $result += "`nBackend: NOT RUNNING" }
if ($frontendAlive) { $result += "`nFrontend: RUNNING (port 3000)" } else { $result += "`nFrontend: NOT RUNNING" }

$result | Out-File "$env:TEMP\server-status.txt"
