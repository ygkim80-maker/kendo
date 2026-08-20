@echo off
chcp 65001 > nul
title 정진 — 검도 훈련 앱

echo [1/2] 백엔드 서버 시작 중...
start "백엔드" cmd /k "cd /d %~dp0backend && py -3.13 -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo [2/2] 프론트엔드 서버 시작 중...
start "프론트엔드" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo 브라우저 열기...
start http://localhost:5173

exit
