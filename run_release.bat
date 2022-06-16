@echo off
::pip install --upgrade flask
::pip install --upgrade vosk
::pip install --upgrade gunicorn
::pip install --upgrade websockets
set FLASK_APP=scivi.py
python -m flask run --host=0.0.0.0
pause