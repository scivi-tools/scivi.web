#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pytesseract as tesseract
import numpy as np

img = INPUT["Picture"]

d = tesseract.image_to_data(img, lang = "rus", config = "--psm 11", output_type = tesseract.Output.DICT)
n = len(d['level'])
aois = []

for i in range(n):
    if d['level'][i] == 5:
        (x, y, w, h) = (d['left'][i], d['top'][i], d['width'][i], d['height'][i])
        aois.append({ "name": d["text"][i], "shape": np.float32([ [x, y], [x, y + h], [x + w, y + h], [x + w, y] ]).reshape(-1, 1, 2) })

OUTPUT["AOIs"] = aois
