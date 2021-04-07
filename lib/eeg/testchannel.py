#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import math


isHigh = False
if "EEG" in INPUT:
    chName = SETTINGS_VAL["Channel Name"]
    eeg = INPUT["EEG"]
    if chName in eeg[0]:
        val = eeg[1][eeg[0].index(chName)]
        isHigh = math.abs(val) > 10000

OUTPUT["Is High"] = isHigh
