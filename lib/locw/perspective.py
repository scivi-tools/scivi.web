#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv

homo = INPUT["Homography"]
aois = INPUT["AOIs"]

tAOIs = []
for aoi in aois:
    tAOIs.append({ "name": aoi["name"], "shape": cv.perspectiveTransform(aoi["shape"], homo) })

OUTPUT["Transformed AOIs"] = tAOIs
