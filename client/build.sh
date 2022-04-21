#!/bin/bash

BROWSERIFY="./node_modules/.bin/browserify"
UGLIFY="./node_modules/.bin/uglifyjs"

mkdir -p lib

if [[ $1 == "debug" ]]; then
    $BROWSERIFY src/scivi-editor.js --standalone SciViEditor -o lib/scivi-editor.min.js
else
    $BROWSERIFY src/scivi-editor.js --standalone SciViEditor -o lib/scivi-editor.tmp.js
    $UGLIFY lib/scivi-editor.tmp.js -o lib/scivi-editor.min.js
    rm lib/scivi-editor.tmp.js
fi
