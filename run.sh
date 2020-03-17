#!/bin/bash

pushd kb > /dev/null
./merge.sh > /dev/null
popd > /dev/null

export FLASK_APP=scivi.py
flask run
