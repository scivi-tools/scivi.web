#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import random

from .EBLite_python.EBLite import EBLiteClient, DummyClient

# Constants to index GLOB array
current_EEG_mode_KEY = "current_EEG_mode"
EEG_KEY = "EEG"

# Different mode constants
MODE_IDLE        = 0
MODE_OHM_METER   = 1
MODE_CALIBRATION = 2
MODE_SAMPLING    = 3

match MODE:
    case 'INITIALIZATION':
        # If EEG is yet to be initialized, do so
        #client = EBLiteClient("192.168.171.81", 64)
        client = DummyClient("192.168.171.81", 64+4)
        #client = EBLiteClient("127.0.0.1", 64)
        GLOB[EEG_KEY] = client
        client.connect()
        print ("Connection succeed")
        GLOB[current_EEG_mode_KEY] = None

    case 'DESTRUCTION':
        client = GLOB.get(EEG_KEY)
        if client:
            client.disconnect()

    case 'RUNNING':
        client = GLOB[EEG_KEY]
        
        settings_mode = int(SETTINGS_VAL["Mode"]) # this is ID of mode: [Idle, Ohmmeter, Calibration, Data]
        
        # Logic to handle mode switching
        if GLOB[current_EEG_mode_KEY] != settings_mode:
            client.stop_sampling()
        
            {
                MODE_IDLE:          lambda: None, # Do nothing, we already in idle
                MODE_OHM_METER:     lambda: client.start_ohmmeter(),
                MODE_CALIBRATION:   lambda: client.start_calibration(),
                MODE_SAMPLING:      lambda: client.start_sampling(),
            }[settings_mode]()
        
            GLOB[current_EEG_mode_KEY] = settings_mode
        
        if settings_mode == MODE_SAMPLING:
            frames_count = 16*4
            frames = client.get_shorts(frames_count)
        
            OUTPUT["EEG"] = frames.tolist()
        
            #OUTPUT["EEG"] = frame.reshape( (len(frame), n) ).tolist()
            # OUTPUT["EEG"] = [[random.random(), random.random(), random.random(), random.random()], \
            #                  [random.random(), random.random(), random.random(), random.random()], \
            #                  [random.random(), random.random(), random.random(), random.random()], \
            #                  [random.random(), random.random(), random.random(), random.random()],
            #                  [random.random(), random.random(), random.random(), random.random()],
            #                  [random.random(), random.random(), random.random(), random.random()],
            #                  [random.random(), random.random(), random.random(), random.random()]]
        elif settings_mode == MODE_OHM_METER:
            impedances, reference, ground = client.get_impedances()
        
            transformed = client.transform_frame_by_montage(impedances, "cap21")
        
            #print (transformed)
        
            names = transformed[0]
            imps = transformed[1]
        
            imps = imps[:,0] + imps[:,1]
        
            OUTPUT["EEG"] = [
                names,
                imps.tolist()
            ]
        
            print (OUTPUT["EEG"])
        
            #OUTPUT["EEG"] = [ \
            #    ["Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8", "A1", "T3", "C3", "Cz", "C4", "T4", "A2", "T5", "P3", "Pz", "P4", "T6", "O1", "O2"], \
            #    [random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
            #     random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
            #     random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
            #     random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, random.random() * 100, \
            #     random.random() * 100] \
            #]
    case _:
        raise ValueError("Unknown mode: " + MODE)

PROCESS()
