#!/usr/bin/false

from datetime import datetime

import cyrtranslit
import pyedflib

class EegWriter(object):
    def __init__(self, filename, iteration, date, time, informant_code, directory="."):
        self.id = EegWriter.compute_id(filename, iteration, date, time, informant_code)

        # TODO: add date/time?
        self.filename = "{}/{}_{}.edf".format(directory, iteration, filename)

        self.write_edf = pyedflib.highlevel.write_edf

        self.header = self.create_header(filename, iteration, date, time, informant_code)

        self.signal_headers = []

        self.data = []

    def compute_id(filename, iteration, date, time, informant_code):
        return hash("_".join(filename, iteration, date, time, informant_code))

    def create_header(self, filename, iteration, date, time, informant_code):
        return {
            # TODO: this fields should ALL be accessible in the interface
            "technician"          : "SciVi-EEG",
            "recording_additional": "{}_{}".format(iteration, self.clean_string(filename)),
            "patientname"         : "X", # Depersonified
            "patient_additional"  : "X", # Depersonified
            "patientcode"         : "SCE-"+self.clean_string(str(informant_code)),
            "equipment"           : "EBNeuro BE Plus LTM",
            "admincode"           : "X", # TODO: Unknown
            "gender"              : "X", # Depersonified
            "startdate"           : self.format_date(date, time),
            "birthdate"           : "X", # Depersonified
        }

    def create_signal_header(self, label):
        # TODO: this values should be supplied by equipment!
        # TODO: Especially Hz!
        return {
            'label'        : label,    # channel label (string, <= 16 characters, must be unique)
            'dimension'    : "uV",     # physical dimension (e.g., mV) (string, <= 8 characters)
            'sample_rate'  : 128,      # sample frequency in hertz (int)
            'physical_max' : +4096.0,  # maximum physical value (float)
            'physical_min' : -4096.0,  # minimum physical value (float)
            'digital_max'  : -2**15,   # maximum digital value (int, -2**15 <= x < 2**15)
            'digital_min'  :  2**15-1, # minimum digital value (int, -2**15 <= x < 2**15)
        }

    def clean_string(self, string):
        return cyrtranslit.to_latin(string.replace(" ", "_"), 'ru')

    def format_date(self, date, time):
        return datetime.combine(date, time)

    def write(self, data):
        if not self.signal_headers:
            for label in data[0]:
                self.signal_headers.append(self.create_signal_header(label))

        self.data.append(data[1])

    def close(self):
        if len(data) < 1:
            return

        self.write_edf(self.filename, self.data, self.signal_headers, self.header, digital=False)
        
