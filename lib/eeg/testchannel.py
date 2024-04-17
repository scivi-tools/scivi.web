#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import numpy as np

THRESHOLD = 10000

isHigh = False
isLow = False
if "EEG" in INPUT:
    chName = SETTINGS_VAL["Channel Name"]
    eeg = np.array(INPUT["EEG"])
    montage = INPUT["Montage Schema"]
    eeg = montage.transform_frame_by_montage(eeg, 'cap128') # TODO: move to settings!
    if chName in eeg[0]:
        val = eeg[1][eeg[0].index(chName)]
        isHigh = abs(val[0]) > THRESHOLD or abs(val[-1]) > THRESHOLD
        isLow = abs(val[0]) < THRESHOLD or abs(val[-1]) < THRESHOLD

OUTPUT["Is High"] = isHigh
OUTPUT["Is Low"] = isLow
