#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv

width = SETTINGS_VAL["Width"]
height = SETTINGS_VAL["Height"]
img = INPUT["Picture"]
OUTPUT["Picture"] = cv.resize(img, (width, height), interpolation = cv.INTER_AREA)
