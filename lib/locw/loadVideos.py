#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import cv2 as cv

video = CACHE.get("CUR_VIDEO")
videoIndex = CACHE.get("CUR_VIDEO_INDEX")
videoPath = CACHE.get("CUR_VIDEO_PATH")
frameIndex = CACHE.get("CUR_FRAME_INDEX")
frameCount = CACHE.get("CUR_FRAME_COUNT")
videoCount = CACHE.get("VIDEO_COUNT")
frame = None

if (not video) or (not video.isOpened()):
    if videoIndex is None:
        videoIndex = 0
    else:
        videoIndex++
    frameIndex = -1
    videoList = SETTINGS_VAL["List of Videos"].split("\n")
    videoCount = len(videoList)
    if video:
        video.release()
    if videoIndex < videoCount:
        videoPath = videoList[videoIndex].strip()
        video = cv.VideoCapture(videoPath)
        frameCount = int(video.get(cv.CAP_PROP_FRAME_COUNT))
    else:
        videoPath = None
        video = None
        frameCount = 0
    CACHE["CUR_VIDEO"] = video
    CACHE["CUR_VIDEO_INDEX"] = videoIndex
    CACHE["CUR_VIDEO_PATH"] = videoPath
    CACHE["CUR_FRAME_COUNT"] = frameCount
    CACHE["VIDEO_COUNT"] = videoCount

if video and video.isOpened():
    ret, frame = video.read()
    if ret:
        frameIndex++

CACHE["CUR_FRAME_INDEX"] = frameIndex

OUTPUT["Frame"] = frame
OUTPUT["Frame Index"] = frameIndex
OUTPUT["Frame Count"] = frameCount
OUTPUT["Video Index"] = videoIndex
OUTPUT["Video Count"] = videoCount
OUTPUT["Video Path"] = videoPath

if frame:
    PROCESS()
