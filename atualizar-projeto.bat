@echo off
REM Atualiza Browserslist
npx update-browserslist-db@latest

REM Atualiza Vite e ws para a última versão
npm install vite@latest ws@latest

REM Remove node_modules e package-lock.json
rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM Reinstala as dependências
npm install

echo.
echo Projeto atualizado! Agora execute: npm run dev
echo. 