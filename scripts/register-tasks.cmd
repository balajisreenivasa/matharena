@echo off
rem Creates the three Windows Task Scheduler entries for daily delivery.
rem Run once from any directory. Remove with scripts\unregister-tasks.cmd.
set HERE=%~dp0
schtasks /Create /F /SC DAILY  /ST 06:00 /TN "MathArena Morning" /TR "\"%HERE%daily.cmd\" morning"
schtasks /Create /F /SC DAILY  /ST 20:00 /TN "MathArena Evening" /TR "\"%HERE%daily.cmd\" evening"
schtasks /Create /F /SC WEEKLY /D SUN /ST 18:00 /TN "MathArena Digest" /TR "\"%HERE%daily.cmd\" digest"
echo.
echo Registered. Check with: schtasks /Query /TN "MathArena Morning"
echo The app must be running (npm run dev) for links in the emails to open.
