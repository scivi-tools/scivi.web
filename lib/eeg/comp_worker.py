#!/usr/bin/env python3

COMP_INPUT_TRUTH = 'Truth'
COMP_INPUT_PREDICTION = 'Prediction'

MODULE_PREFIX = "COMP_PDkwQFLnnY"

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

truth = INPUT[COMP_INPUT_TRUTH]
pred = INPUT[COMP_INPUT_PREDICTION]

from sklearn.metrics import accuracy_score
print('Prediction accuracy: ', accuracy_score(truth, pred))
