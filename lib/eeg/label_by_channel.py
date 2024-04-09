#!/usr/bin/env python3


LC_INPUT_RAW_SIGNAL = 'Raw Signal'
LC_INPUT_MONTAGE_SCHEMA = 'Montage Schema'

LC_OUTPUT_SIGNAL = 'Signal'
LC_OUTPUT_LABELS = 'Labels'

LC_SETTING_CHANNEL_NAME = 'Channel Name'

import numpy as np
from sklearn.preprocessing import minmax_scale
from mne import create_info
from mne.io import RawArray
from os.path import basename

montage = INPUT[LC_INPUT_MONTAGE_SCHEMA]

#channels = montage.electrode_names('cap21')
channels = montage.electrode_names('cap128')
info = create_info(channels, 512, 'eeg')

raws = INPUT[LC_INPUT_RAW_SIGNAL]

data = []
labels = []
for raw in [raws]:
    #raw = montage.transform_frame_by_montage(raw, 'cap21')[1]
    raw = montage.transform_frame_by_montage(raw, 'cap128')[1]
    raw = RawArray(raw, info)
    # First, get the data from DC channel
    dc_a = raw.get_data('DC-A') # TODO: pick channel from settings!
    # Scale it to [0, 1]
    sc = minmax_scale(dc_a, axis = 1)
    mask = sc < 0.5 #np.median(sc) #sc < 0.5 #sc.mean() # TODO: hardcoded value

    raw.drop_channels('DC-A') # TODO!
    r_data = raw.get_data(picks=['eeg'])
    r_label = np.median(mask)
    print ("LBC: ", r_data.shape, r_label)

    data.append(r_data)
    labels.append(str(int(r_label)))
min_len = np.min([d.shape[1] for d in data])
data = np.array([d[:, :min_len] for d in data])

OUTPUT[LC_OUTPUT_SIGNAL] = data
OUTPUT[LC_OUTPUT_LABELS] = labels
