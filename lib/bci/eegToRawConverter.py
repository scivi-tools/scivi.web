import mne.io
from mne import create_info

INPUT_EEG = 'EEG'
OUTPUT_RAW = 'Raw'

eeg = INPUT[INPUT_EEG]

info = create_info(eeg[0] ,512)
raw = mne.io.RawArray(eeg[1], info)

OUTPUT[OUTPUT_RAW] = [raw]