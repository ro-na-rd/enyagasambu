@echo off
echo Starting E-Nyagasambu servers...

REM Kill existing node processes
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul

REM Start backend
echo Starting backend on port 5000...
start "Backend" /min cmd /c "cd /d C:\Users\Shadrack\Documents\eny\enyagasambu-main\backend && node src/index.js > "%TEMP%\backend.log" 2>&1"

REM Start frontend
echo Starting frontend on port 3000...
start "Frontend" /min cmd /c "cd /d C:\Users\Shadrack\Documents\eny\enyagasambu-main\frontend && npx next dev -p 3000 > "%TEMP%\frontend.log" 2>&1"

echo Servers launched. Waiting 15 seconds...
timeout /t 15 >nul

echo === Port Check ===
netstat -ano | findstr "LISTENING" | findstr ":3000 :5000"

echo === Process Check ===
tasklist | findstr /i "node.exe"

echo === Backend Log ===
type "%TEMP%\backend.log" 2>nul

echo === Frontend Log ===
type "%TEMP%\frontend.log" 2>nul

echo === Done ===
pause
