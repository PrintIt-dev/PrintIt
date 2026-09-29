@echo off
cd /d "c:\Users\avani\Downloads\print it\print it"
echo =========================================================
echo   Pushing Latest Zero-Trace Changes to GitHub
echo =========================================================
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Pushed to GitHub! Vercel is now deploying your updated portal.
) else (
    echo [NOTICE] Please complete the browser login prompt if prompted.
)
pause
