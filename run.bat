@echo off
::pip install --upgrade flask
::pip install --upgrade vosk
::pip install --upgrade numpy
::pip install --upgrade gunicorn
::pip install --upgrade websockets
set FLASK_APP=scivi.py
python -m flask run
pause