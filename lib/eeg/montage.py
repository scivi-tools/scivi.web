#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pathlib
import json

class Montage(object):
    def __init__(self, filename):
        self.directory = pathlib.Path(__file__).parent.absolute()

        with open("{}/montages.json".format(self.directory), "rt") as f:
            self.montages = json.load(f)

    def electrode_names(self, montage_name, pad = []):
        montage = self.montages[montage_name]

        return [electrode["canonical_name"] for electrode in montage if electrode["index"] > -1] + pad

    def transform_frame_by_montage(self, frame, montage_name):
        montage = self.montages[montage_name]

        names = []
        indices = []

        for electrode in montage:
            index = electrode["index"]
            canonical_name = electrode["canonical_name"]
            # name and color don't matter for us now
            if index > -1:
                names.append(canonical_name)
                indices.append(index)

        return [names, frame[indices, :]]
