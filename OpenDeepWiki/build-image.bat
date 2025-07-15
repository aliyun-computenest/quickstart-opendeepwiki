@echo off
echo ===========================================
echo Building KoalaWiki Docker Images
echo ===========================================

REM Enable Docker Buildx
echo Enabling Docker Buildx...
docker buildx create --use

REM Build backend image
echo Building backend image...
docker buildx build ^
    --platform linux/amd64,linux/arm64 ^
    -t crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/koala-wiki ^
    -f src/KoalaWiki/Dockerfile ^
    --push .
if %ERRORLEVEL% NEQ 0 (
    echo Error building backend image!
    exit /b %ERRORLEVEL%
)

REM Build frontend image
echo Building frontend image...
pushd web
docker buildx build ^
    --platform linux/amd64,linux/arm64 ^
    -t crpi-j9ha7sxwhatgtvj4.cn-shenzhen.personal.cr.aliyuncs.com/koala-ai/koala-wiki-web ^
    -f Dockerfile ^
    --push .
if %ERRORLEVEL% NEQ 0 (
    echo Error building frontend amd64 image!
    exit /b %ERRORLEVEL%
)
popd

echo ===========================================
echo Images built and pushed successfully!
echo ===========================================

