import math
import numpy as np
from numpy.fft import rfft, rfftfreq

INPUT_RAW = 'Raw'
OUTPUT_FEATURES_LIST = 'Features'

raws = INPUT[INPUT_RAW]

features = []

for raw in raws:

    #Time and data arrays    
    t1 = raw['Fp1'][1]
    x1 = raw['Fp1'][0][0]
    t2 = raw['Fp2'][1]
    x2 = raw['Fp2'][0][0]
        
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
    
    features.append(np.array([alpha1, gamma1, delta1, alpha2, beta2, gamma2, delta2, theta2]))
    
features = np.array(features)

OUTPUT[OUTPUT_FEATURES_LIST] = features

