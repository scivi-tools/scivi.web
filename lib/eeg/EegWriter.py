#!/usr/bin/false

from datetime import datetime
import uuid
import os
import numpy as np

import cyrtranslit
import pyedflib
from random import random

class EegWriter(object):
    def __init__(self, filename, iteration, time, informant_code, directory=None):
        self.wid = EegWriter.compute_id(filename, iteration, time, informant_code)
        if not directory:
            directory = str(uuid.uuid4())
            os.mkdir(directory)

        # TODO: add date/time?
        self.filename = "{}/{:04}_{}_{:09}.edf".format(directory, iteration, filename, int(random()*10000000))

        self.write_edf = pyedflib.highlevel.write_edf

        self.header = self.create_header(filename, iteration, time, informant_code)

        self.signal_headers = []

        self.data = {}

    def compute_id(filename, iteration, time, informant_code):
        return hash("_".join([filename, str(iteration), str(time), informant_code]))

    def create_header(self, filename, iteration, time, informant_code):
        return {
            # TODO: this fields should ALL be accessible in the interface
            "technician"          : "SciVi-EEG",
            "recording_additional": "{:04}_{}".format(iteration, self.clean_string(filename)),
            "patientname"         : "X", # Depersonified
            "patient_additional"  : "X", # Depersonified
            "patientcode"         : "SCE-"+self.clean_string(str(informant_code)),
            "equipment"           : "EBNeuro BE Plus LTM",
            "admincode"           : "X", # TODO: Unknown
            "gender"              : "X", # Depersonified
            "startdate"           : time,
            "birthdate"           : "", # Depersonified
        }

    def create_signal_header(self, label):
        # TODO: this values should be supplied by equipment!
        # TODO: Especially Hz!
        return {
            'label'        : label,    # channel label (string, <= 16 characters, must be unique)
            'dimension'    : "uV",     # physical dimension (e.g., mV) (string, <= 8 characters)
            'transducer'   : "AgAl",   # 
            'prefilter'    : "0.1 Hz",  # 
            #'sample_rate'  : 128,      # sample frequency in hertz (int)
            'sample_rate'  : 512,      # sample frequency in hertz (int)
            'physical_max' : +4096.0,  # maximum physical value (float)
            'physical_min' : -4096.0,  # minimum physical value (float)
            'digital_max'  :  2**15-1, # maximum digital value (int, -2**15 <= x < 2**15)
            'digital_min'  : -2**15,   # minimum digital value (int, -2**15 <= x < 2**15)
        }

    def clean_string(self, string):
        return cyrtranslit.to_latin(string.replace(" ", "_"), 'ru')

    def write(self, data):
        if not self.signal_headers:
            for label in data[0]:
                self.signal_headers.append(self.create_signal_header(label))
                self.data[label] = []

        for label, signal in zip(data[0], data[1]):
            self.data[label].append(signal)

    def close(self):
        if len(self.data) < 1:
            return

        sorted_data = [np.hstack(self.data[key]) for key in sorted(self.data)]
        sorted_headers = list(sorted(self.signal_headers, key=lambda x: x['label']))

        sorted_data = np.array(sorted_data, dtype=np.int32).reshape( (len(sorted_data), -1) )

        self.write_edf(self.filename, sorted_data, sorted_headers, self.header, digital=True)
        
