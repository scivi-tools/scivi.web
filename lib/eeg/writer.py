#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from datetime import datetime

from .EegWriter import EegWriter

# INPUT["something"]
# OUTPUT["something"]
# GLOB["something"]
# SETTINGS_VAL["something"]

MODULE_PREFIX = "EegWriter_bU3nDCYS0Q"

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

# A bunch of #defines
FILENAME_KEY       = "Filename"
FILE_NUMBER_KEY    = "File Number"
TIME_KEY           = "Time of Recording"
DATE_KEY           = "Date of Recording"
INFORMANT_CODE_KEY = "Informant Code"

EEG_DATA_KEY       = "EEG"

WRITER_KEY         = "Writer"

# Read all the input

current_filename  = INPUT[FILENAME_KEY]
current_iteration = INPUT[FILE_NUMBER_KEY]
current_date      = SETTINGS_VAL[DATE_KEY]
current_time      = SETTINGS_VAL[TIME_KEY]
current_informant = SETTINGS_VAL[INFORMANT_CODE_KEY]

#print (current_filename)
#print (current_iteration)
#print (current_date)
#print (current_time)

# HACK
#current_date = datetime.strptime(current_date, '%Y-%m-%d').timestamp()
#current_time = current_time.split(':')
#current_time = int(current_time[0])*60 + int(current_time[1])

current_time = datetime.fromtimestamp((float(current_time) + float(current_date)) / 1000.0)

# Get current writer
    
writer = GLOB.get(p(WRITER_KEY))

if current_filename:
    # If there's none or if it's different from what we need, create a new one
    if not writer or writer.wid != EegWriter.compute_id(current_filename, current_iteration, current_time, current_informant):
        if (writer):
            writer.close()
        else:
            # First time we launch this module; ensure cleanup
            def cleanup():
                writer = GLOB.get(p(WRITER_KEY))
                if writer:
                    writer.close()
            REGISTER_SUBTHREAD(None, cleanup)

        writer = EegWriter(current_filename, current_iteration, current_time, current_informant)

        GLOB[p(WRITER_KEY)] = writer
    
    writer.write(INPUT[EEG_DATA_KEY])
else:
    if writer:
        writer.close()
    GLOB[p(WRITER_KEY)] = None

PROCESS()
