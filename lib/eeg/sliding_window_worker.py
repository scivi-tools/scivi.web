#!/usr/bin/env python3

import numpy as np

# For serialization
import joblib

SW_SETTING_SAMPLES = 'N'

SW_INPUT_SIGNAL = 'EEG'

SW_OUTPUT_SIGNAL_COMPONENTS = 'Raw Signal'

MODULE_PREFIX = "SW_AtTrYT8fkn"

SW_KEY = 'SW'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

raw = np.array(INPUT[SW_INPUT_SIGNAL])

sw = GLOB.get(p(SW_KEY))
if not sw:
    from .sliding_window import SlidingWindow
    n_samples = int(SETTINGS_VAL[SW_SETTING_SAMPLES])
    sw = SlidingWindow(n_samples, raw.shape[1])
    GLOB[p(SW_KEY)] = sw

OUTPUT[SW_OUTPUT_SIGNAL_COMPONENTS] = np.array([sw.feed(raw)])
