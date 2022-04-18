import math
import numpy as np
from os.path import basename

INPUT_RAW = 'Raw'
SLICER_SETTING_LABEL_LIST = 'Labels'
OUTPUT_LABELS_LIST = 'Labels'
OUTPUT_RAW_LIST = 'Raw'

raws_input = INPUT[INPUT_RAW]

labels_list = [f.strip() for f in SETTINGS_VAL[SLICER_SETTING_LABEL_LIST].split('\n')]

raws_output = []
labels = []

for raw in raws_input:
    filename = basename(raw.filenames[0])

    label = None

    for i in labels_list:
        if i in filename:
            label = i
            break
           
    if not label:
        raise ValueError()


    dur = math.floor(raw.times[-1])
    freq = raw.info['sfreq']

    skip = 1.5
    step = 0.1
    length = 1
    
    for i in np.arange(skip,dur-length,step):
        raw_clone = raw.copy()
        raw_clone.crop(i, i + length)
        
        raws_output.append(raw_clone)
        labels.append(label)

labels = np.array(labels)

OUTPUT[OUTPUT_LABELS_LIST] = labels
OUTPUT[OUTPUT_RAW_LIST] = raws_output
