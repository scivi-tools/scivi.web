#!/usr/bin/env python3

# For serialization
import joblib

VEC_MODE_TRAIN = 0
VEC_MODE_EVAL = 1

VEC_SETTING_MODE = 'Mode'
VEC_SETTING_MODEL = 'Model File'

VEC_INPUT_SIGNAL = 'Signal'

VEC_OUTPUT_SIGNAL_COMPONENTS = 'Signal Components'

MODULE_PREFIX = "VEC_m6EhCNcfoB"

VEC_KEY = 'VEC'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

mode = int(SETTINGS_VAL[VEC_SETTING_MODE])
model_file = SETTINGS_VAL[VEC_SETTING_MODEL]

vec = GLOB.get(p(VEC_KEY))
if not vec:
    from mne.decoding import Vectorizer
    vec = Vectorizer()
    GLOB[p(VEC_KEY)] = vec

raw = INPUT[VEC_INPUT_SIGNAL]

if mode == VEC_MODE_TRAIN:
    print(raw.shape)
    OUTPUT[VEC_OUTPUT_SIGNAL_COMPONENTS] = vec.fit_transform(raw)
    joblib.dump(vec, model_file)
elif mode == VEC_MODE_EVAL:
    vec = joblib.load(model_file)
    OUTPUT[VEC_OUTPUT_SIGNAL_COMPONENTS] = vec.transform(raw)
else:
    raise ValueError
