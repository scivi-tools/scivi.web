#!/bin/bash

export FLASK_APP=scivi.py
python3 -m flask run --host=0.0.0.0 --port=5555
if [ $? -ne 0 ]; then
    echo "Maybe you are out of python virtual environment"
    echo "Try:"
    echo "./setup.py"
    echo "source .venv/bin/activate"
fi
