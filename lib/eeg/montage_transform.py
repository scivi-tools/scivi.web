#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import numpy as np

from .montage import Montage

if MODE == "INITIALIZATION":
    GLOB["MT_old_montage_name"] = None


elif MODE == "RUNNING":
    data = INPUT["EEG In"]
    labels = None
    montage : Montage = INPUT["Montage Schema"] if HAS_INPUT["Montage Schema"] else None

    montage_name = SETTINGS_VAL["Montage Name"]

    if montage is not None:
        frames = np.asarray(data)
        labels, frames = montage.transform_frame_by_montage(frames, montage_name)
        data = frames.tolist()
        

    OUTPUT["EEG Out"] = data
    OUTPUT["Labels"] = labels


elif MODE == "DESTRUCTION":
    pass


PROCESS()
