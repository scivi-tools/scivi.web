#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv

img = INPUT["Picture"]
path = INPUT["Path"]
cv.imwrite(path + ".jpg", img)
