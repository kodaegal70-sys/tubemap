@echo off
npx -y create-next-app@latest app_tmp --typescript --eslint --no-tailwind --src-dir --app --import-alias "@/*" --use-npm
if %errorlevel% neq 0 exit /b %errorlevel%
robocopy app_tmp . /E /MOVE
rmdir app_tmp
