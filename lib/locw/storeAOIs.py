#!/usr/bin/env python3
# -*- coding: utf-8 -*-

aois = INPUT["AOIs"]
path = INPUT["Path"]
index = INPUT["Frame Index"]

with open(path + ".csv", "a") as f:
    for aoi in aois:
        s = aoi["shape"]
        f.write("%d, \"%s\", %d, %d, %d, %d, %d, %d, %d, %d\n" % \
                (index, \
                 aoi["name"], \
                 s[0][0][0], s[0][0][1], \
                 s[1][0][0], s[1][0][1], \
                 s[2][0][0], s[2][0][1], \
                 s[3][0][0], s[3][0][1]))
