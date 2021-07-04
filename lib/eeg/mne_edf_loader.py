#!/usr/bin/env python3

from mne.io import concatenate_raws, read_raw_edf
from mne.datasets import eegbci
from mne.channels import make_standard_montage

LOADER_SETTING_FILE_LIST = 'File List'

LOADER_OUTPUT_RAW_EEG = 'RAW EEG'

MODULE_PREFIX = 'MNE_EDF_Loader_ghn0n0h95M'

LOADER_KEY = 'MNE EDF Loader Raws'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

raw = GLOB.get(p(LOADER_KEY))
if not raw:
    raw_fnames = [f.strip() for f in SETTINGS_VAL[LOADER_SETTING_FILE_LIST].split('\n')]
    
    raw = concatenate_raws([read_raw_edf(f, preload=True) for f in raw_fnames])
    eegbci.standardize(raw)  # set channel names
    montage = make_standard_montage('standard_1005')
    raw.set_montage(montage)
    
    # strip channel names of "." characters
    raw.rename_channels(lambda x: x.strip('.'))

    GLOB[p(LOADER_KEY)] = raw

OUTPUT[LOADER_OUTPUT_RAW_EEG] = raw
