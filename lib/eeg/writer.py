#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import uuid
import os
from datetime import datetime
from time import time

import numpy as np

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
MONTAGE_SCHEMA_KEY = "Montage Schema"
DIRECTORY_KEY      = "Directory"

EEG_DATA_KEY       = "EEG"

WRITER_KEY         = "Writer"

match MODE:
    case 'INITIALIZATION':
        pass # TODO: mode initialization here!

    case 'RUNNING':
        # Read all the input
        is_write          = INPUT[IS_WRITE_KEY]
        current_filename  = INPUT[FILENAME_KEY]
        current_iteration = INPUT[FILE_NUMBER_KEY]
        montage           = INPUT[MONTAGE_SCHEMA_KEY]
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

                    directory = CACHE.get(p(DIRECTORY_KEY))
                    if not directory:
                        directory = str(uuid.uuid4())
                        os.mkdir(directory)
                        CACHE[p(DIRECTORY_KEY)] = directory
            
                    writer = EegWriter(current_filename, current_iteration, current_time, current_informant, directory)
            
                    CACHE[p(WRITER_KEY)] = writer
                
                eeg = np.array(INPUT[EEG_DATA_KEY])
                eeg = montage.transform_frame_by_montage(eeg, 'cap128') # TODO: move to settings
                writer.write(eeg)
        else:
            #print("Stopping at {}".format(time()))
            if writer:
                writer.close()
            CACHE[p(WRITER_KEY)] = None
            #print("Closing {}".format(CACHE[p(FILENAME_KEY)]))
            CACHE[p(FILENAME_KEY)] = None

    case 'DESTRUCTION':
        writer = CACHE.get(p(WRITER_KEY))
        if writer:
            writer.close()

    case _:
        raise ValueError("Unknown mode: " + MODE)

#print(time() - start)

PROCESS()
