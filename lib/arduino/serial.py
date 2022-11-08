#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import serial

if "serial" not in CACHE:
    CACHE["serial"] = serial.Serial(SETTINGS_VAL["Path"], 9600, timeout = 1)

s = CACHE["serial"]

OUTPUT["Data"] = s.readline().decode("ascii")

if MODE == "DESTRUCTION":
    s.close()
else:
    PROCESS()
