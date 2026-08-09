@echo off
echo.
echo ========================================
echo    Dr. Desk - Git Push
echo ========================================
echo.

cd /d c:\Users\Hugoe\drdesk

echo Agregando cambios...
git add .

echo.
set /p mensaje="Mensaje del commit: "

if "%mensaje%"=="" set mensaje=Actualizacion

echo.
echo Creando commit...
git commit -m "%mensaje%"

echo.
echo Subiendo a GitHub...
git push

echo.
echo ========================================
echo    Listo! Cambios subidos a GitHub
echo ========================================
echo.
echo Ahora ejecuta en el servidor:
echo /root/actualizar-drdesk.sh
echo.
pause
