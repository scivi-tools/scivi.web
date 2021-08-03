#!/usr/bin/env python3

CONVERTER_INPUT_MNE_EEG = 'MNE-EEG'
CONVERTER_SETTING_MODE = 'Mode'

CONVERTER_OUTPUT_LABELS = 'Labels'
CONVERTER_OUTPUT_DATA = 'Signal'

CONVERTER_MODE_ANNOT = 0
CONVERTER_MODE_DC_A = 1

raws = INPUT[CONVERTER_INPUT_MNE_EEG]
mode = int(SETTINGS_VAL[CONVERTER_SETTING_MODE])

data = None
labels = None

if mode == CONVERTER_MODE_ANNOT:
    from mne import Epochs, pick_types, events_from_annotations
    from mne.io import concatenate_raws

    raw = concatenate_raws(raws)

    tmin, tmax = -1., 4.

    event_id = dict(hands=2, feet=3)

    events, _ = events_from_annotations(raw, event_id=dict(T1=2, T2=3))

    picks = pick_types(raw.info, meg=False, eeg=True, stim=False, eog=False, exclude='bads')

    epochs = Epochs(raw, events, event_id, tmin, tmax, proj=True, picks=picks, baseline=None, preload=True)

    epochs_train = epochs.copy().crop(tmin=1., tmax=2.)

    # TODO: check!

    labels = epochs.events[:, -1] - 2

    data = epochs.get_data()
elif mode == CONVERTER_MODE_DC_A:
    import numpy as np
    from sklearn.preprocessing import minmax_scale
    data = []
    labels = []
    for raw in raws:
        print(raw.filenames)
        # First, get the data from DC channel
        dc_a = raw.get_data('DC-A') # TODO: pick channel from settings!
        # Scale it to [0, 1]
        sc = minmax_scale(dc_a, axis = 1)
        # A bit of hack here: we cut a first chunk of a signal that's above / below the mean
        # If it's a silence, mean will be closer towards 0, e.g. 0.142343
        # If it's a signal, mean will be closer towards 1, e.g. 0.722345
        mask = sc < np.median(sc) #sc < 0.5 #sc.mean() # TODO: hardcoded value
    
        # Now mask is a boolean array; find transitions from False to True and vice versa in it
        d = np.diff(mask)
        # Find indices of said transitions
        idx = np.array(d.nonzero())
        # We are only interesned in first two transitions (there may be 3rd one)
        idx = idx[1, :2]
        print(idx)
        # TODO: hack!
        if idx.shape[0] < 2:
            print ("WARN: skipping file {}".format(raw.filenames[0]))
            continue

        r_data = raw.get_data(picks=['eeg'])[:, idx[0]:idx[1]]
        # TODO: for some reason EDF loader doesn't pick up the aux data
        r_label = raw.filenames[0].split('_')[-2]
        print (d, idx, r_data.shape, r_label)

        data.append(r_data)
        labels.append(r_label)
    min_len = np.min([d.shape[1] for d in data])
    data = np.array([d[:, :min_len] for d in data])
    labels = [int("3" in x) for x in labels] # TODO: dirty hack!
else:
    raise ValueError()

#print(data.shape)
#print(data)

OUTPUT[CONVERTER_OUTPUT_LABELS] = labels
OUTPUT[CONVERTER_OUTPUT_DATA] = data
