#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import random

# OUTPUT["EEG"] = [[random.random(), random.random(), random.random(), random.random()], \
#                  [random.random(), random.random(), random.random(), random.random()], \
#                  [random.random(), random.random(), random.random(), random.random()], \
#                  [random.random(), random.random(), random.random(), random.random()],
#                  [random.random(), random.random(), random.random(), random.random()],
#                  [random.random(), random.random(), random.random(), random.random()],
#                  [random.random(), random.random(), random.random(), random.random()]]
OUTPUT["EEG"] = [ \
    ["Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8", "A1", "T3", "C3", "Cz", "C4", "T4", "A2", "T5", "P3", "Pz", "P4", "T6", "O1", "O2"], \
    [random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
     random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
     random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
     random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
     random.random() * 100] \
]
PROCESS()
time.sleep(0.1)
