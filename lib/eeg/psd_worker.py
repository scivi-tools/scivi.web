#!/usr/bin/env python3

# For serialization
import joblib

PSD_MODE_TRAIN = 0
PSD_MODE_EVAL = 1

PSD_SETTING_MODE = 'Mode'
PSD_SETTING_MODEL = 'Model File'

PSD_INPUT_SIGNAL = 'Signal'
PSD_INPUT_LABELS = 'Labels'

PSD_OUTPUT_SIGNAL_COMPONENTS = 'Signal Components'

MODULE_PREFIX = "PSD_0ypQP9cIF8"

PSD_KEY = 'PSD'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

mode = int(SETTINGS_VAL[PSD_SETTING_MODE])
model_file = SETTINGS_VAL[PSD_SETTING_MODEL]

psd = GLOB.get(p(PSD_KEY))
if not psd:
    from mne.decoding import PSDEstimator
    psd = PSDEstimator()
    GLOB[p(PSD_KEY)] = psd

raw = INPUT[PSD_INPUT_SIGNAL]

if mode == PSD_MODE_TRAIN:
    labels = INPUT[PSD_INPUT_LABELS]
    print(raw.shape)
    OUTPUT[PSD_OUTPUT_SIGNAL_COMPONENTS] = psd.fit_transform(raw, labels)
    joblib.dump(psd, model_file)
elif mode == PSD_MODE_EVAL:
    psd = joblib.load(model_file)
    OUTPUT[PSD_OUTPUT_SIGNAL_COMPONENTS] = psd.transform(raw)
else:
    raise ValueError
