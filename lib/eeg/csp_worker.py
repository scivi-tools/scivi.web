#!/usr/bin/env python3

CSP_MODE_TRAIN = 0
CSP_MODE_EVAL = 1

CSP_SETTING_COMPONENTS = 'Components'
CSP_SETTING_MODE = 'Mode'

CSP_INPUT_SIGNAL = 'Signal'

CSP_OUTPUT_SIGNAL_COMPONENTS = 'Signal Components'

MODULE_PREFIX = "CSP_j4VGYjn6e5"

CSP_KEY = 'CSP'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

mode = int(SETTINGS_VAL[CSP_SETTING_MODE])

csp = GLOB.get(p(CSP_KEY))
if not csp:
    from mne.decoding import CSP
    n_components = int(SETTINGS_VAL[CSP_SETTING_COMPONENTS])
    csp = CSP(n_components=n_components, reg=None, log=True, norm_trace=False)
    GLOB[p(CSP_KEY)] = csp

raw = INPUT[CSP_INPUT_SIGNAL]

if mode == CSP_MODE_TRAIN:
    OUTPUT[CSP_OUTPUT_SIGNAL_COMPONENTS] = csp.fit_transform(raw, None) # TODO: y labels!
elif mode == CSP_MODE_EVAL:
    OUTPUT[CSP_OUTPUT_SIGNAL_COMPONENTS] = csp.transform(raw)
else:
    raise ValueError
