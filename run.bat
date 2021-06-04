@echo off
pip install --upgrade flask
set FLASK_APP=scivi.py
python -m flask run
pause