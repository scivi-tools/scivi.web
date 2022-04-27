import mne.io
from mne import create_info
import numpy as np

INPUT_EEG = 'EEG'
OUTPUT_RAW = 'Raw'

MODULE_PREFIX = "eegToRawConverter_edfab0e2"

Accum_KEY = 'Accumulator'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)
    
accum = GLOB.get(p(Accum_KEY))
eeg = INPUT[INPUT_EEG]
eeg[1] = np.array(eeg[1])

bufferLength = 128

if accum is None:
    accum = eeg
    GLOB[p(Accum_KEY)] = accum
elif len(accum[1][0]) < bufferLength:
    accum[1] = np.concatenate((accum[1], eeg[1]), axis = 1)
      
if len(accum[1][0]) >= bufferLength:
    info = create_info(accum[0] ,512, ch_types='eeg')
    raw = mne.io.RawArray(accum[1][:,:bufferLength], info)
    accum[1] = accum[1][:,bufferLength:]
    OUTPUT[OUTPUT_RAW] = [raw]
