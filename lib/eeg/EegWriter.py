#!/usr/bin/false

import pyedflib

class EegWriter(object):
    def __init__(self, filename, iteration, date, time, informant_code, directory="."):
        self.id = EegWriter.compute_id(filename, iteration, date, time, informant_code)
        self.directory = directory
        self.write_header(filename, iteration, date, time, informant_code)

    def compute_id(filename, iteration, date, time, informant_code):
        return hash("_".join(filename, iteration, date, time, informant_code))

    def write_header(self, filename, iteration, date, time, informant_code):
        pass

    def write(self, data):
        pass

    def close(self):
        pass
