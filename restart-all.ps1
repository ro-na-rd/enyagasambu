Write-Host "`n=== Step 1: Starting MySQL & MinIO containers ===" -ForegroundColor Cyan
docker compose up -d mysql minio
Start-Sleep -Seconds 8

Write-Host "`n=== Step 2: Verifying MySQL is alive ===" -ForegroundColor Cyan
docker exec nmo-mysql mysqladmin ping -u root -prootpassword 2>&1

Write-Host "`n=== Step 3: Checking ports (MySQL:3307, MinIO API:9000, MinIO Console:9001) ===" -ForegroundColor Cyan
netstat -an | Select-String ":3307|:9000|:9001"

Write-Host "`n=== Step 4: Killing all node processes ===" -ForegroundColor Cyan
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "`n=== Step 5: Starting backend on port 5000 ===" -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "src/index.js" -WorkingDirectory "C:\Users\Shadrack\Documents\eny\enyagasambu-main\backend" -WindowStyle Minimized
Start-Sleep -Seconds 5
netstat -an | Select-String ":5000"

Write-Host "`n=== Step 6: Starting frontend on port 3000 ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Shadrack\Documents\eny\enyagasambu-main\frontend'; npx next dev -p 3000" -WindowStyle Minimized
Start-Sleep -Seconds 15
netstat -an | Select-String ":3000"

Write-Host "`n=== Step 7: Testing /api/health ===" -ForegroundColor Cyan
try { Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET } catch { Write-Host "FAILED: $_" -ForegroundColor Red }

Write-Host "`n=== Step 8: Testing /api/categories ===" -ForegroundColor Cyan
try { Invoke-RestMethod -Uri "http://localhost:5000/api/categories" -Method GET } catch { Write-Host "FAILED: $_" -ForegroundColor Red }

Write-Host "`n=== Step 9: Testing /api/auth/me (expect 'No token provided') ===" -ForegroundColor Cyan
try { Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET } catch { Write-Host "FAILED: $_" -ForegroundColor Red }

Write-Host "`n=== Done ===" -ForegroundColor Green
