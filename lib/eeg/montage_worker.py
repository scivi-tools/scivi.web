#!/usr/bin/env python3

from .montage import Montage

MP_SETTING_MONTAGE_PATH = 'Path'

MP_OUTPUT_MONTAGE_SCHEMA = 'Montage Schema'

path = SETTINGS_VAL[MP_SETTING_MONTAGE_PATH]
OUTPUT[MP_OUTPUT_MONTAGE_SCHEMA] = Montage(path)
