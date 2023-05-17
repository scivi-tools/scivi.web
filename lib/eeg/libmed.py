#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time

try:
    import pylibmed as med
except:
    raise RuntimeError("This feature is not available for this deployment") from None


EEG_KEY = "EEG"
EEG_current_mode_KEY = "EEG_current_mode"

def parse_options(options, ignore=[]):
    ret = {}
    for key in options:
        if key not in ignore:
            ret[key.lower().replace(" ", "_")] = options[key]

    return ret


sample_count = 16

# Mode enum, aligned with the ontology.
MODE_IDLE        = 0
MODE_OHM_METER   = 1
MODE_CALIBRATION = 2
MODE_SAMPLING    = 3

MODE_MAP = {
    MODE_IDLE:          med.MED_EEG_IDLE,
    MODE_OHM_METER:     med.MED_EEG_IMPEDANCE,
    MODE_CALIBRATION:   med.MED_EEG_TEST,
    MODE_SAMPLING:      med.MED_EEG_SAMPLING,
}

def tick(driver_name, MODE, SETTINGS_VAL, OUTPUT, GLOB, PROCESS):
    if MODE == "INITIALIZATION":
        # Create a new Eeg object and save it into GLOB to use on consecutive ticks.
        # The initial connection (if needed) happens on creation of the object.
        # We will get an exception here if the connection fails.
        opts = parse_options(SETTINGS_VAL, ["Mode"])
        opts["verbosity"] = 3
        eeg = med.Eeg(driver_name, opts)
        GLOB[EEG_KEY] = eeg
        GLOB[EEG_current_mode_KEY] = None


    elif MODE == "RUNNING":
        eeg = GLOB[EEG_KEY]

        # Pass mode change to the device if needed.
        current_mode = GLOB[EEG_current_mode_KEY]
        new_mode = int(SETTINGS_VAL["Mode"])
        if new_mode != current_mode:
            GLOB[EEG_current_mode_KEY] = new_mode
            current_mode = new_mode
            eeg.set_mode(MODE_MAP[new_mode])

        labels = eeg.get_channels()
        OUTPUT["Labels"] = labels

        if current_mode == MODE_IDLE:
            pass
        elif current_mode == MODE_OHM_METER:
            # Produces an 1d array of values, we have to reshape it to fit the
            # usual format.
            data = eeg.get_impedance()
            OUTPUT["EEG"] = [ [val] for val in data.tolist() ]
        else:
            # Produces a 2d array with samples.
            data = eeg.sample(sample_count)
            OUTPUT["EEG"] = data.T.tolist()


    elif MODE == "DESTRUCTION":
        # The object must be destroued in order to tear down the connections and
        # any leftover resources. Do it explicitly here as otherwise the object
        # (and any connection to it) will hang in GLOB and won't be GC'd
        del GLOB[EEG_KEY]
        del GLOB[EEG_current_mode_KEY]


    PROCESS()
