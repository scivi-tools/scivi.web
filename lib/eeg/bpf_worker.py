#!/usr/bin/env python3

BPF_SETTING_HIGH_CUT = 'High cut-off'
BPF_SETTING_LOW_CUT = 'Low cut-off'

BPF_INPUT_SIGNAL = 'Signal'

BPF_OUTPUT_SIGNAL_BAND = 'Signal Band'

low_thresh  = float(SETTINGS_VAL[BPF_SETTING_LOW_CUT])
high_thresh = float(SETTINGS_VAL[BPF_SETTING_HIGH_CUT])

raw = INPUT[BPF_INPUT_SIGNAL]

raw.filter(low_thresh, high_thresh, fir_design='firwin', skip_by_annotation='edge')

OUTPUT[BPF_OUTPUT_SIGNAL_BAND] = raw
