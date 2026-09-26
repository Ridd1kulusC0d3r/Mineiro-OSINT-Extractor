@echo off
setlocal
title Mineiro Username Extractor
where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao foi encontrado.
  echo Instale o Node.js 22 LTS e consulte MANUAL.html.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERRO] npm nao foi encontrado.
  pause
  exit /b 1
)
if "%1"=="--check" (
  node --version
  npm --version
  exit /b 0
)
if not exist node_modules (
  echo [INFO] Instalando dependencias...
  call npm install
  if errorlevel 1 exit /b 1
)
start "" cmd /c "timeout /t 5 >nul & start http://localhost:3000"
call npm run dev
