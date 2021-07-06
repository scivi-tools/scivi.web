#!/usr/bin/env python3

# For serialization
import joblib

LDA_MODE_TRAIN = 0
LDA_MODE_EVAL = 1

LDA_INPUT_SIGNAL = 'Signal'
LDA_INPUT_LABELS = 'Labels'

LDA_SETTING_MODE = 'Mode'
LDA_SETTING_MODEL = 'Model File'

LDA_OUTPUT_RESULT = 'Result'

MODULE_PREFIX = "LDA_rLWC2bcgVr"

LDA_KEY = 'LDA'

def p(x):
    return "{}_{}".format(MODULE_PREFIX, x)

raw = INPUT[LDA_INPUT_SIGNAL]

mode = int(SETTINGS_VAL[LDA_SETTING_MODE])
model_file = SETTINGS_VAL[LDA_SETTING_MODEL]

lda = GLOB.get(p(LDA_KEY))
if not lda:
    from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
    lda = LinearDiscriminantAnalysis()
    GLOB[p(LDA_KEY)] = lda

if mode == LDA_MODE_TRAIN:
    labels = INPUT[LDA_INPUT_LABELS]
    lda.fit(raw, labels)
    joblib.dump(lda, model_file)
elif mode == LDA_MODE_EVAL:
    lda = joblib.load(model_file)
    OUTPUT[LDA_OUTPUT_RESULT] = lda.predict(raw)
else:
    raise ValueError()
