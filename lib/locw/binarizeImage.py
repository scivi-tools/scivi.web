#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv

def bw(image, blur, block, c):
    result = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    result = cv.medianBlur(result, blur)
    return cv.adaptiveThreshold(result, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, block, c)

OUTPUT["Picture"] = bw(INPUT["Picture"], SETTINGS_VAL["Blur"], SETTINGS_VAL["Block"], SETTINGS_VAL["C"])
