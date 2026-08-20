@echo off
chcp 65001 > nul
taskkill /f /im node.exe > nul 2>&1
taskkill /f /im python.exe > nul 2>&1
echo 서버 종료 완료!
timeout /t 2 /nobreak > nul
exit
