@echo off
rem Wrapper for Windows Task Scheduler: runs the daily delivery in the repo directory.
rem Usage: daily.cmd [morning|evening|digest]
cd /d "%~dp0.."
call npm run daily -- %1 >> data\outbox\daily.log 2>&1
