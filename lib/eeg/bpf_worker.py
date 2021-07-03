#!/usr/bin/env python3

low_thresh  = SETTINGS['Low cut-off']
high_thresh = SETTINGS['High cut-off']
raw = INPUT['Signal']

raw.filter(low_thresh, high_thresh, fir_design='firwin', skip_by_annotation='edge')

OUTPUT['Signal Band'] = raw
