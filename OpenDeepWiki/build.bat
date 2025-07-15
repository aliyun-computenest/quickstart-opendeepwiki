@echo off
chcp 65001 >nul
echo 开始构建KoalaWiki项目...

REM 复制启动脚本
copy ".\start-backend.bat" ".\output\" >nul
copy ".\start-frontend.bat" ".\output\" >nul

REM 构建后端
echo 构建后端...
dotnet publish KoalaWiki.sln -c Release -o output\backend

echo 构建前端...
cd web
call npm install
call npm run build
xcopy /E /I /Y .next ..\output\frontend\
cd ..

xcopy /E /I /Y .next\static ..\output\frontend\standalone\.next\static\

pause 