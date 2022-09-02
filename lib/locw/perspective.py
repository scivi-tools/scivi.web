#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv
import numpy as np

homo = INPUT["Homography"]
aois = INPUT["AOIs"]

tAOIs = []
for aoi in aois:
    try:
        shape = cv.perspectiveTransform(aoi["shape"], homo)
    except:
        shape = np.float32([ [0, 0] ] * 4).reshape(-1, 1, 2)
    tAOIs.append({ "name": aoi["name"], "shape": shape })

OUTPUT["Transformed AOIs"] = tAOIs
