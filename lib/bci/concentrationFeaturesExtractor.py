import math
import numpy as np
from numpy.fft import rfft, rfftfreq

DATA_SOURCE_FILE = 0
DATA_SOURCE_EBNeuro = 1

SETTING_DATA_SOURCE = 'Data source'

INPUT_RAW = 'Raw'
OUTPUT_FEATURES_LIST = 'Features'

dataSource = int(SETTINGS_VAL[SETTING_DATA_SOURCE])

if INPUT_RAW in INPUT:
    raws = INPUT[INPUT_RAW]

    features = []

    for raw in raws:
        #Time and data arrays  
        if dataSource == DATA_SOURCE_FILE:
            t1 = raw['Fp1'][1]
            x1 = raw['Fp1'][0][0]
            t2 = raw['Fp2'][1]
            x2 = raw['Fp2'][0][0]
        elif dataSource == DATA_SOURCE_EBNeuro:
            t1 = raw['FP1'][1]
            x1 = raw['FP1'][0][0]
            t2 = raw['FP2'][1]
            x2 = raw['FP2'][0][0]
        else:
            raise ValueError()
            
        yf1 = np.abs(rfft(x1))/len(x1)
        xf1 = rfftfreq(len(x1), 1/len(x1))
        
        yf2 = np.abs(rfft(x2))/len(x2)
        xf2 = rfftfreq(len(x2), 1/len(x2))
        
        alpha1 = sum(yf1[np.logical_and(xf1 >= 8, xf1 <= 13)])
        beta1 = sum(yf1[np.logical_and(xf1 >= 14, xf1 <= 30)])
        theta1 = sum(yf1[np.logical_and(xf1 >= 4, xf1 <= 7)])
        delta1 = sum(yf1[np.logical_and(xf1 >= 0.5, xf1 <= 3)])
        gamma1 = sum(yf1[np.logical_and(xf1 >= 31, xf1 <= 50)])
        
        alpha2 = sum(yf2[np.logical_and(xf2 >= 8, xf2 <= 13)])
        beta2 = sum(yf2[np.logical_and(xf2 >= 14, xf2 <= 30)])
        theta2 = sum(yf2[np.logical_and(xf2 >= 4, xf2 <= 7)])
        delta2 = sum(yf2[np.logical_and(xf2 >= 0.5, xf2 <= 3)])
        gamma2 = sum(yf2[np.logical_and(xf2 >= 31, xf2 <= 50)])
        
        features.append(np.array([alpha1, beta1, gamma1, delta1, theta1,alpha2, beta2, gamma2, delta2, theta2]))
        
    features = np.array(features)

    OUTPUT[OUTPUT_FEATURES_LIST] = features

