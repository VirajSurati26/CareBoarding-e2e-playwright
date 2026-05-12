@echo off
echo Setting up Mobile Testing Environment...
echo.

echo 1. Starting Appium Server...
start "Appium Server" cmd /k "npx appium --port 4724"
timeout /t 5

echo.
echo 2. Checking for Android Emulator...
adb devices

echo.
echo 3. If no devices listed above:
echo    - Open Android Studio
echo    - Go to AVD Manager
echo    - Start your Android emulator
echo.
echo 4. Once emulator is running, press any key to continue...
pause

echo.
echo 5. Verifying device connection...
adb devices

echo.
echo Setup complete! You can now run your mobile tests.
echo.
pause
