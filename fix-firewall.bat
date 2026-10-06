@echo off
echo ===================================================
echo  FreshMart - Windows Firewall Configuration Tool
echo ===================================================
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click 'fix-firewall.bat' and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo [1/3] Removing old conflicting Node.js block rules...
netsh advfirewall firewall delete rule name="Node.js JavaScript Runtime" >nul 2>&1

echo [2/3] Adding Allow rule for Node.js on all profiles...
netsh advfirewall firewall add rule name="Node.js JavaScript Runtime" dir=in action=allow program="C:\Program Files\nodejs\node.exe" profile=any

echo [3/3] Ensuring Port 5000 is open (TCP Inbound)...
netsh advfirewall firewall add rule name="Backend 5000" dir=in action=allow protocol=TCP localport=5000 profile=any

echo.
echo ===================================================
echo  SUCCESS! Windows Firewall is now allowing Node.js!
echo  Port 5000 is now accessible from your phone.
echo ===================================================
echo.
pause
