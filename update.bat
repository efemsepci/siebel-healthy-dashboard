@echo off

cd /d "C:\Users\EfeSepci\OneDrive - DefineX\Masaüstü\siebel-healthy-dashboard - v2\siebel-healthy-dashboard"

echo Current directory:
cd


echo Updating application...


timeout /t 2 > nul


echo Backend updating...

xcopy ".update\extract\backend" "backend" /E /Y /I

echo Backend updated.


echo Frontend updating...

xcopy ".update\extract\frontend" "frontend" /E /Y /I

echo Frontend updated.


echo Version updating...

copy ".update\extract\version.json" "version.json" /Y

echo Version updated.


echo Cleaning...

rmdir /S /Q ".update"


echo Update completed.


pause


start "" node "launcher\launcher.js"