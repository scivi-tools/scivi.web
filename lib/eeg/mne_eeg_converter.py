#!/usr/bin/env python3

CONVERTER_INPUT_MNE_EEG = 'MNE-EEG'
CONVERTER_SETTING_MODE = 'Mode'

CONVERTER_OUTPUT_LABELS = 'Labels'
CONVERTER_OUTPUT_DATA = 'Signal'

CONVERTER_MODE_ANNOT = 0
CONVERTER_MODE_DC_A = 1

raw = INPUT[CONVERTER_INPUT_MNE_EEG]
mode = int(SETTINGS_VAL[CONVERTER_SETTING_MODE])

data = None
labels = None

if mode == CONVERTER_MODE_ANNOT:
    from mne import Epochs, pick_types, events_from_annotations

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
    raise NotImplementedError()
else:
    raise ValueError()

OUTPUT[CONVERTER_OUTPUT_LABELS] = labels
OUTPUT[CONVERTER_OUTPUT_DATA] = data
