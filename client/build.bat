@echo off
if not exist "lib" mkdir lib
call npm install
if "%1"=="debug" (
	call "node_modules/.bin/browserify.cmd" src/scivi-editor.js --standalone SciViEditor -o lib/scivi-editor.min.js
) else (
	call "node_modules/.bin/browserify.cmd" src/scivi-editor.js --s SciViEditor -o lib/scivi-editor.tmp.js
	call "node_modules/.bin/terser.cmd" lib/scivi-editor.tmp.js -o lib/scivi-editor.min.js
	del lib\scivi-editor.tmp.js
)
pause
