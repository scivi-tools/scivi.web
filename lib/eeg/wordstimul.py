#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import random
import math


if not "Words" in CACHE:
    sh = SETTINGS_VAL["Words"].split("\n")
    #random.shuffle(sh)
    CACHE["Words"] = sh
    CACHE["Index"] = 0;
    CACHE["Word"] = None
    CACHE["Iteration"] = 1;

if CACHE["Iteration"] > 0:
    now = time.time()
    if "lastCall" in CACHE:
        elapsed = now - CACHE["lastCall"]
    else:
        elapsed = 0
        CACHE["lastCall"] = now

    if int(elapsed * 1000) > int(SETTINGS_VAL["Timeout"]):
        CACHE["lastCall"] = now
        words = CACHE["Words"];
        idx = CACHE["Index"];
        if idx % 2:
            CACHE["Word"] = words[math.floor(idx / 2)];
        else:
            CACHE["Word"] = None;
        idx += 1;
        CACHE["Index"] = idx;
        if idx > len(words) * 2:
            iterat = CACHE["Iteration"]
            iterat += 1;
            if iterat <= int(SETTINGS_VAL["Iterations Count"]):
                CACHE["Iteration"] = iterat;
                CACHE["Index"] = 0;
            else:
                CACHE["Iteration"] = 0;

OUTPUT["Word"] = CACHE["Word"];
OUTPUT["Iteration"] = CACHE["Iteration"];
