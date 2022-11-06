#!/usr/bin/env python3

# For serialization
import joblib
from mne.decoding import Scaler

SCALER_MODE_NONE = 0
SCALER_MODE_MEAN = 1
SCALER_MODE_MEDIAN = 2

SCALER_SETTING_MODE = 'Mode'
SCALER_SETTING_MODEL = 'Model File'

SCALER_INPUT_SIGNAL = 'Signal'
SCALER_INPUT_LABELS = 'Labels'

SCALER_OUTPUT_SIGNAL_COMPONENTS = 'Signal Components'

MODULE_PREFIX = "SCALER_wprKa3eaD3"

SCALER_KEY = 'SCALER'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

mode = int(SETTINGS_VAL[SCALER_SETTING_MODE])
#model_file = SETTINGS_VAL[SCALER_SETTING_MODEL]

raw = INPUT[SCALER_INPUT_SIGNAL]

if mode == SCALER_MODE_NONE:
    # TODO: dirty hack!
    from mne import create_info
    channels = [
        'FC5', 'FC3',  'FC1',  'FCz',  'FC2',  'FC4',  'FC6',  'C5',  'C3',  'C1',  'Cz',  'C2',  
        'C4',  'C6',  'CP5',  'CP3',  'CP1',  'CPz',  'CP2',  'CP4',  'CP6',  'Fp1',  'Fpz',  'Fp2',  
        'AF7',  'AF3',  'AFz',  'AF4',  'AF8',  'F7',  'F5',  'F3',  'F1',  'Fz',  'F2',  'F4',  
        'F6',  'F8',  'FT7',  'FT8',  'T7',  'T8',  'T9',  'T10',  'TP7',  'TP8',  'P7',  'P5',  
        'P3',  'P1',  'Pz',  'P2',  'P4',  'P6',  'P8',  'PO7',  'PO3',  'POz',  'PO4',  'PO8',  
        'O1',  'Oz',  'O2',  'Iz'
    ]
    #channels = channels[:raw.shape[1]] # TODO: dirty hack
    channels = ['C3', 'C4', 'Cz', 'F3', 'F4', 'F7', 'F8', 'Fp1', 'Fp2', 'Fz', 'O1', 'O2', 'P3', 'P4', 'Pz', 'T3', 'T4', 'T5', 'T6']
    #info = create_info(channels, 160, 'eeg')
    info = create_info(channels, 512, 'eeg')
    info.set_montage('standard_1005')
    scaler = Scaler(info)
elif mode == SCALER_MODE_MEAN:
    scaler = Scaler(scalings='mean')
elif mode == SCALER_MODE_MEDIAN:
    scaler = Scaler(scalings='median')
else:
    raise ValueError

print(raw.shape)

output = scaler.fit_transform(raw)

print(output.shape)

OUTPUT[SCALER_OUTPUT_SIGNAL_COMPONENTS] = output
