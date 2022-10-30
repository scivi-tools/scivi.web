#!/usr/bin/env false

import numpy as np

class SlidingWindow(object):
    def __init__(self, n_samples, n_channels):
        self.buffer = np.zeros( (n_samples, n_channels) )

    def feed(self, raw):
        n_samples = raw.shape[0]
        self.buffer = np.roll(self.buffer, -n_samples)
        self.buffer[-n_samples:, :] = raw
        return self.buffer
