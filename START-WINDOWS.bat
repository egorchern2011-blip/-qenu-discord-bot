@echo off
title Qenu Discord Bot
echo ==============================
echo        QENU DISCORD BOT
echo ==============================
echo.
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
echo.
echo Starting bot...
npm start
pause
