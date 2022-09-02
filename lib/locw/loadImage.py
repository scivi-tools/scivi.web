#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv

img = CACHE.get("Picture")
if not img:
    img = cv.imread(SETTINGS_VAL["Path"])
    CACHE["Picture"] = img

OUTPUT["Picture"] = img
