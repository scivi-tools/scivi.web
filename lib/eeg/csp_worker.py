#!/usr/bin/env python3

# For serialization
import joblib

CSP_MODE_TRAIN = 0
CSP_MODE_EVAL = 1

CSP_SETTING_COMPONENTS = 'Components'
CSP_SETTING_MODE = 'Mode'
CSP_SETTING_MODEL = 'Model File'

CSP_INPUT_SIGNAL = 'Signal'
CSP_INPUT_LABELS = 'Labels'

CSP_OUTPUT_SIGNAL_COMPONENTS = 'Signal Components'

MODULE_PREFIX = "CSP_j4VGYjn6e5"

CSP_KEY = 'CSP'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

mode = int(SETTINGS_VAL[CSP_SETTING_MODE])
model_file = SETTINGS_VAL[CSP_SETTING_MODEL]

raw = INPUT[CSP_INPUT_SIGNAL]

csp = GLOB.get(p(CSP_KEY))
if not csp:
    from mne.decoding import CSP
    n_components = int(SETTINGS_VAL[CSP_SETTING_COMPONENTS])
    csp = CSP(n_components=n_components, reg=None, log=True, norm_trace=False)
    GLOB[p(CSP_KEY)] = csp

if mode == CSP_MODE_TRAIN:
    labels = INPUT[CSP_INPUT_LABELS]
    print(raw.shape)
    OUTPUT[CSP_OUTPUT_SIGNAL_COMPONENTS] = csp.fit_transform(raw, labels)
    # TODO: just for visual stuff!
    import matplotlib.pyplot as plt
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
    csp.plot_patterns(info, ch_type='eeg', units='Patterns (AU)', size=1.5, show=False)
    plt.savefig('test.png')
    joblib.dump(csp, model_file)
elif mode == CSP_MODE_EVAL:
    print("CSP: ", raw.shape)
    import numpy as np
    csp = joblib.load(model_file)
    OUTPUT[CSP_OUTPUT_SIGNAL_COMPONENTS] = csp.transform(np.array(raw))
else:
    raise ValueError
