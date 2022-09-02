#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv
import numpy as np

image = INPUT["Picture"]
template = INPUT["Template"]

sift = cv.SIFT_create()
kpTemplate, desTemplate = sift.detectAndCompute(template, None)
kpImage, desImage = sift.detectAndCompute(image, None)

indexParams = dict(algorithm = 1, trees = 5)
searchParams = {}
flann = cv.FlannBasedMatcher(indexParams, searchParams)
matches = flann.knnMatch(desTemplate, desImage, k = 2)

# As per Lowe's ratio test to filter good matches
goodMatches = []
for m, n in matches:
    if m.distance < 0.75 * n.distance:
        goodMatches.append(m)

print("Good matches: " + str(len(goodMatches)))

srcPoints = np.float32([kpTemplate[m.queryIdx].pt for m in goodMatches]).reshape(-1, 1, 2)
dstPoints = np.float32([kpImage[m.trainIdx].pt for m in goodMatches]).reshape(-1, 1, 2)
m, mask = cv.findHomography(srcPoints, dstPoints, cv.RANSAC, 5.0)

OUTPUT["Homography"] = m
OUTPUT["Match"] = len(goodMatches) > 150
