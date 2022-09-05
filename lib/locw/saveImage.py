#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv

img = INPUT["Picture"]
path = INPUT["Path"] + ".jpg"
cv.imwrite(path, img)
PUBLISH_FILE(path)
