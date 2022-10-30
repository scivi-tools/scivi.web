#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from datetime import datetime
from time import time

from .EegWriter import EegWriter

# INPUT["something"]
# OUTPUT["something"]
# CACHE["something"]
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
IS_WRITE_KEY       = "Write"

EEG_DATA_KEY       = "EEG"

WRITER_KEY         = "Writer"

# Read all the input
is_write          = INPUT[IS_WRITE_KEY]
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

#current_time = datetime.fromtimestamp((float(current_time) + float(current_date)) / 1000.0)
current_time = datetime.fromtimestamp(float(current_time) / 1000.0)

# Get current writer
    
writer = CACHE.get(p(WRITER_KEY))
#start = time()

if is_write:
    #print("Writing at {}".format(time()))
    stored_filename = CACHE.get(p(FILENAME_KEY))
    #print (current_filename)
    #print (stored_filename)
    if stored_filename is not None:
        CACHE[p(FILENAME_KEY)] = current_filename
    if current_filename is None:
        current_filename = stored_filename

    if (stored_filename is None and current_filename is None) or (current_iteration < 0):
        print ("Poo!")
    else: 
        # If there's none or if it's different from what we need, create a new one
        if not writer or writer.wid != EegWriter.compute_id(current_filename, current_iteration, current_time, current_informant):
            if (writer):
                writer.close()
            else:
                # First time we launch this module; ensure cleanup
                def cleanup():
                    writer = CACHE.get(p(WRITER_KEY))
                    if writer:
                        writer.close()
                REGISTER_SUBTHREAD(None, cleanup)
    
            writer = EegWriter(current_filename, current_iteration, current_time, current_informant)
    
            CACHE[p(WRITER_KEY)] = writer
        
        writer.write(INPUT[EEG_DATA_KEY])
else:
    #print("Stopping at {}".format(time()))
    if writer:
        writer.close()
    CACHE[p(WRITER_KEY)] = None
    #print("Closing {}".format(CACHE[p(FILENAME_KEY)]))
    CACHE[p(FILENAME_KEY)] = None

#print(time() - start)

PROCESS()
