@echo off
cd /d D:\project\eny\enyagasambu-main
echo [%date% %time%] Starting frontend build... >> .build-status.log
"C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose --progress=plain build frontend >> .build-status.log 2>&1
echo [%date% %time%] Build exit code: %ERRORLEVEL% >> .build-status.log
