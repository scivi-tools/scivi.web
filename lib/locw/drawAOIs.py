#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv
import numpy as np

img = INPUT["Picture"].copy()
aois = INPUT["AOIs"]
for aoi in aois:
    cv.polylines(img, [np.int32(aoi["shape"])], True, (0, 0, 255), 2)
OUTPUT["Picture"] = img
