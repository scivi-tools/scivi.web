#!/usr/bin/env python3

from .montage import Montage

MP_SETTING_MONTAGE_PATH = 'Path'
MP_OUTPUT_MONTAGE_SCHEMA = 'Montage Schema'

if MODE == "INITIALIZATION":
    GLOB["MP_old_path"] = None


elif MODE == "RUNNING":
    path = SETTINGS_VAL[MP_SETTING_MONTAGE_PATH]
    old_path = GLOB["MP_old_path"]
    if old_path != path:
        GLOB["MP_old_path"] = path
        CACHE["MP_Montage"] = Montage(path)

    OUTPUT[MP_OUTPUT_MONTAGE_SCHEMA] = CACHE["MP_Montage"]


elif MODE == "DESTRUCTION":
    del CACHE["MP_Montage"]
    del GLOB["MP_old_path"]
