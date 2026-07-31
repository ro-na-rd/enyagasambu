taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start backend on port 4000
start "Backend-4000" /min cmd /c "cd /d C:\Users\Shadrack\Documents\eny\enyagasambu-main\backend && node src/index.js > C:\Users\Shadrack\AppData\Local\Temp\backend.log 2>&1"

timeout /t 3 /nobreak >nul

REM Start frontend on port 3000
start "Frontend-3000" /min cmd /c "cd /d C:\Users\Shadrack\Documents\eny\enyagasambu-main\frontend && npx.cmd next dev -p 3000 > C:\Users\Shadrack\AppData\Local\Temp\frontend.log 2>&1"

timeout /t 15 /nobreak >nul

REM Check ports
echo === PORT CHECK === > C:\Users\Shadrack\AppData\Local\Temp\port-check.txt
netstat -ano | findstr "LISTENING" | findstr ":4000 :3000" >> C:\Users\Shadrack\AppData\Local\Temp\port-check.txt

echo === BACKEND LOG === >> C:\Users\Shadrack\AppData\Local\Temp\port-check.txt
type C:\Users\Shadrack\AppData\Local\Temp\backend.log >> C:\Users\Shadrack\AppData\Local\Temp\port-check.txt 2>nul

echo === FRONTEND LOG === >> C:\Users\Shadrack\AppData\Local\Temp\port-check.txt
type C:\Users\Shadrack\AppData\Local\Temp\frontend.log >> C:\Users\Shadrack\AppData\Local\Temp\port-check.txt 2>nul

echo DONE >> C:\Users\Shadrack\AppData\Local\Temp\port-check.txt
